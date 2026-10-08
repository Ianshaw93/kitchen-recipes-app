import { Redis } from "@upstash/redis";
import {
  RELATIONSHIP_KV_KEY,
  SEED_RELATIONSHIP,
  parseRelationshipDocument,
  type RelationshipDocument,
} from "./relationship";
import { readRedisEnv } from "./payments-store";

export type RelationshipStore = {
  read(): Promise<unknown>;
  write(value: RelationshipDocument, options?: { nx?: boolean }): Promise<boolean>;
};

export type RelationshipKv = {
  get: (key: string) => Promise<unknown>;
  set: (
    key: string,
    value: unknown,
    opts?: { nx?: boolean },
  ) => Promise<"OK" | null>;
};

export class RelationshipStoreUnavailableError extends Error {
  constructor(
    message = "Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_URL and KV_REST_API_TOKEN) so relationship notes can be shared.",
  ) {
    super(message);
    this.name = "RelationshipStoreUnavailableError";
  }
}

let testOverride: RelationshipStore | null = null;
let memorySingleton: RelationshipStore | null = null;
let redisSingleton: RelationshipStore | null = null;

export function createRelationshipMemoryStore(initial: unknown = null): RelationshipStore {
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

export function createRelationshipRedisStore(client: RelationshipKv): RelationshipStore {
  return {
    async read() {
      return client.get(RELATIONSHIP_KV_KEY);
    },
    async write(next, options) {
      const result = await client.set(
        RELATIONSHIP_KV_KEY,
        next,
        options?.nx ? { nx: true } : undefined,
      );
      return result === "OK";
    },
  };
}

export function setRelationshipStoreForTests(store: RelationshipStore | null): void {
  testOverride = store;
}

export function resetRelationshipStoreForTests(): void {
  testOverride = null;
  memorySingleton = createRelationshipMemoryStore();
  redisSingleton = null;
}

function getMemorySingleton(): RelationshipStore {
  if (!memorySingleton) {
    memorySingleton = createRelationshipMemoryStore();
  }
  return memorySingleton;
}

function getRedisStoreSingleton(env: { url: string; token: string }): RelationshipStore {
  if (!redisSingleton) {
    const redis = new Redis({ url: env.url, token: env.token });
    redisSingleton = createRelationshipRedisStore({
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

export function getDefaultRelationshipStore(): RelationshipStore {
  if (testOverride) {
    return testOverride;
  }

  const redisEnv = readRedisEnv();
  if (redisEnv) {
    return getRedisStoreSingleton(redisEnv);
  }

  if (process.env.NODE_ENV === "production") {
    throw new RelationshipStoreUnavailableError();
  }

  return getMemorySingleton();
}

export async function listSharedRelationship(
  store: RelationshipStore = getDefaultRelationshipStore(),
): Promise<RelationshipDocument> {
  const existing = parseRelationshipDocument(await store.read());
  if (existing) {
    return existing;
  }

  const wrote = await store.write(SEED_RELATIONSHIP, { nx: true });
  if (!wrote) {
    const raced = parseRelationshipDocument(await store.read());
    return raced ?? SEED_RELATIONSHIP;
  }

  return SEED_RELATIONSHIP;
}

export async function writeSharedRelationship(
  document: RelationshipDocument,
  store: RelationshipStore = getDefaultRelationshipStore(),
): Promise<RelationshipDocument> {
  await store.write(document);
  return document;
}
