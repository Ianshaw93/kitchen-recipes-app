import { Redis } from "@upstash/redis";
import {
  HOMES_KV_KEY,
  SEED_HOMES_WEEK,
  applyVote,
  findListing,
  homesDocument,
  parseHomesDocument,
  parseWeekDraft,
  sortWeeksNewestFirst,
  type HomeListing,
  type HomeVoteDraft,
  type HomeWeek,
  type HomesDocument,
} from "./homes";
import { readRedisEnv } from "./payments-store";

export type HomesStore = {
  read(): Promise<unknown>;
  write(value: HomesDocument, options?: { nx?: boolean }): Promise<boolean>;
};

export type HomesKv = {
  get: (key: string) => Promise<unknown>;
  set: (
    key: string,
    value: unknown,
    opts?: { nx?: boolean },
  ) => Promise<"OK" | null>;
};

export class HomesStoreUnavailableError extends Error {
  constructor(
    message = "Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_URL and KV_REST_API_TOKEN) so homes can be shared.",
  ) {
    super(message);
    this.name = "HomesStoreUnavailableError";
  }
}

export { readRedisEnv };

let testOverride: HomesStore | null = null;
let memorySingleton: HomesStore | null = null;
let redisSingleton: HomesStore | null = null;

export function createHomesMemoryStore(initial: unknown = null): HomesStore {
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

export function createHomesRedisStore(client: HomesKv): HomesStore {
  return {
    async read() {
      return client.get(HOMES_KV_KEY);
    },
    async write(next, options) {
      const result = await client.set(
        HOMES_KV_KEY,
        next,
        options?.nx ? { nx: true } : undefined,
      );
      return result === "OK";
    },
  };
}

export function setHomesStoreForTests(store: HomesStore | null): void {
  testOverride = store;
}

export function resetHomesStoreForTests(): void {
  testOverride = null;
  memorySingleton = createHomesMemoryStore();
  redisSingleton = null;
}

function getMemorySingleton(): HomesStore {
  if (!memorySingleton) {
    memorySingleton = createHomesMemoryStore();
  }
  return memorySingleton;
}

function getRedisStoreSingleton(env: { url: string; token: string }): HomesStore {
  if (!redisSingleton) {
    const redis = new Redis({ url: env.url, token: env.token });
    redisSingleton = createHomesRedisStore({
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

export function getDefaultHomesStore(): HomesStore {
  if (testOverride) {
    return testOverride;
  }

  const redisEnv = readRedisEnv();
  if (redisEnv) {
    return getRedisStoreSingleton(redisEnv);
  }

  if (process.env.NODE_ENV === "production") {
    throw new HomesStoreUnavailableError();
  }

  return getMemorySingleton();
}

export async function listSharedHomes(
  store: HomesStore = getDefaultHomesStore(),
): Promise<HomeWeek[]> {
  const existing = parseHomesDocument(await store.read());
  if (existing) {
    return sortWeeksNewestFirst(existing.weeks);
  }

  const seeded = homesDocument([SEED_HOMES_WEEK]);
  const wrote = await store.write(seeded, { nx: true });
  if (!wrote) {
    const raced = parseHomesDocument(await store.read());
    return sortWeeksNewestFirst(raced?.weeks ?? [SEED_HOMES_WEEK]);
  }

  return sortWeeksNewestFirst([SEED_HOMES_WEEK]);
}

export async function voteSharedHome(
  draft: HomeVoteDraft,
  store: HomesStore = getDefaultHomesStore(),
): Promise<{ listing: HomeListing | undefined; weeks: HomeWeek[] }> {
  const weeks = await listSharedHomes(store);
  if (!findListing(weeks, draft.listingId)) {
    return { listing: undefined, weeks };
  }

  const next = applyVote(weeks, draft.listingId, draft.person, draft.choice);
  await store.write(homesDocument(next));
  return { listing: findListing(next, draft.listingId), weeks: next };
}

export async function appendSharedWeek(
  draft: HomeWeek,
  store: HomesStore = getDefaultHomesStore(),
): Promise<{ week: HomeWeek; created: boolean; weeks: HomeWeek[] }> {
  const parsed = parseWeekDraft(draft);
  if (!parsed) {
    throw new Error("Invalid week");
  }

  const weeks = await listSharedHomes(store);
  const existing = weeks.find((week) => week.id === parsed.id);
  if (existing) {
    return { week: existing, created: false, weeks };
  }

  const next = sortWeeksNewestFirst([parsed, ...weeks]);
  await store.write(homesDocument(next));
  return { week: parsed, created: true, weeks: next };
}
