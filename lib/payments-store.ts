import { Redis } from "@upstash/redis";
import {
  PAYMENTS_KV_KEY,
  SEED_PAYMENTS,
  addPayment,
  deletePayment,
  findDuplicatePayment,
  parsePaymentsDocument,
  paymentsDocument,
  sortNewestFirst,
  type PaymentDraft,
  type PaymentEntry,
  type PaymentsDocument,
} from "./payments";

export type PaymentsStore = {
  read(): Promise<unknown>;
  write(value: PaymentsDocument, options?: { nx?: boolean }): Promise<boolean>;
};

export type PaymentsKv = {
  get: (key: string) => Promise<unknown>;
  set: (
    key: string,
    value: unknown,
    opts?: { nx?: boolean },
  ) => Promise<"OK" | null>;
};

export class PaymentsStoreUnavailableError extends Error {
  constructor(
    message = "Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_URL and KV_REST_API_TOKEN) so payments can be shared.",
  ) {
    super(message);
    this.name = "PaymentsStoreUnavailableError";
  }
}

let testOverride: PaymentsStore | null = null;
let memorySingleton: PaymentsStore | null = null;
let redisSingleton: PaymentsStore | null = null;

export function readRedisEnv(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    return null;
  }

  return { url, token };
}

export function createMemoryStore(initial: unknown = null): PaymentsStore {
  let value: unknown = initial;
  return {
    async read() {
      return value;
    },
    async write(next, options) {
      if (options?.nx && value != null) {
        return false;
      }
      value = next;
      return true;
    },
  };
}

export function createRedisStore(client: PaymentsKv): PaymentsStore {
  return {
    async read() {
      return client.get(PAYMENTS_KV_KEY);
    },
    async write(next, options) {
      const result = await client.set(
        PAYMENTS_KV_KEY,
        next,
        options?.nx ? { nx: true } : undefined,
      );
      return result === "OK";
    },
  };
}

export function setPaymentsStoreForTests(store: PaymentsStore | null): void {
  testOverride = store;
}

export function resetDefaultStoreForTests(): void {
  testOverride = null;
  memorySingleton = createMemoryStore();
  redisSingleton = null;
}

function getMemorySingleton(): PaymentsStore {
  if (!memorySingleton) {
    memorySingleton = createMemoryStore();
  }
  return memorySingleton;
}

function getRedisStoreSingleton(env: { url: string; token: string }): PaymentsStore {
  if (!redisSingleton) {
    const redis = new Redis({ url: env.url, token: env.token });
    redisSingleton = createRedisStore({
      get: (key) => redis.get(key),
      set: async (key, value, opts) => {
        const result = opts?.nx
          ? await redis.set(key, value, { nx: true })
          : await redis.set(key, value);
        return result === "OK" ? "OK" : null;
      },
    });
  }
  return redisSingleton;
}

export function getDefaultStore(): PaymentsStore {
  if (testOverride) {
    return testOverride;
  }

  const redisEnv = readRedisEnv();
  if (redisEnv) {
    return getRedisStoreSingleton(redisEnv);
  }

  if (process.env.NODE_ENV === "production") {
    throw new PaymentsStoreUnavailableError();
  }

  return getMemorySingleton();
}

export async function listSharedPayments(
  store: PaymentsStore = getDefaultStore(),
): Promise<PaymentEntry[]> {
  const existing = parsePaymentsDocument(await store.read());
  if (existing) {
    return sortNewestFirst(existing.entries);
  }

  const seeded = paymentsDocument(SEED_PAYMENTS);
  const wrote = await store.write(seeded, { nx: true });
  if (!wrote) {
    const raced = parsePaymentsDocument(await store.read());
    return sortNewestFirst(raced?.entries ?? SEED_PAYMENTS);
  }

  return sortNewestFirst(SEED_PAYMENTS);
}

export async function createSharedPayment(
  draft: PaymentDraft,
  store: PaymentsStore = getDefaultStore(),
): Promise<{ entry: PaymentEntry; created: boolean }> {
  const entries = await listSharedPayments(store);
  const duplicate = findDuplicatePayment(entries, draft);
  if (duplicate) {
    return { entry: duplicate, created: false };
  }

  const next = addPayment(entries, draft);
  await store.write(paymentsDocument(next));
  return { entry: next[0]!, created: true };
}

export async function deleteSharedPayment(
  id: string,
  store: PaymentsStore = getDefaultStore(),
): Promise<boolean> {
  const entries = await listSharedPayments(store);
  if (!entries.some((entry) => entry.id === id)) {
    return false;
  }

  await store.write(paymentsDocument(deletePayment(entries, id)));
  return true;
}
