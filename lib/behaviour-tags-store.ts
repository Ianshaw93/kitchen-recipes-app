import { Redis } from "@upstash/redis";
import {
  BEHAVIOUR_TAGS_KV_KEY,
  addBehaviourTag,
  parseTagsDocument,
  removeBehaviourTag,
  sortTagsNewestFirst,
  tagIds,
  type BehaviourTag,
  type BehaviourTagDraft,
  type BehaviourTagsDocument,
} from "./behaviour-tags";
import { readRedisEnv } from "./payments-store";

export type BehaviourTagsStore = {
  read(): Promise<unknown>;
  write(value: BehaviourTagsDocument): Promise<void>;
};

export type BehaviourTagsKv = {
  get: (key: string) => Promise<unknown>;
  set: (key: string, value: unknown) => Promise<"OK" | null>;
};

export class BehaviourTagsStoreUnavailableError extends Error {
  constructor(
    message = "Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_URL and KV_REST_API_TOKEN) so behaviour tags can be stored.",
  ) {
    super(message);
    this.name = "BehaviourTagsStoreUnavailableError";
  }
}

let testOverride: BehaviourTagsStore | null = null;
let memorySingleton: BehaviourTagsStore | null = null;
let redisSingleton: BehaviourTagsStore | null = null;

export function createBehaviourTagsMemoryStore(initial: unknown = null): BehaviourTagsStore {
  let value: unknown = initial;
  return {
    async read() {
      return value;
    },
    async write(next) {
      value = structuredClone(next);
    },
  };
}

export function createBehaviourTagsRedisStore(client: BehaviourTagsKv): BehaviourTagsStore {
  return {
    async read() {
      return client.get(BEHAVIOUR_TAGS_KV_KEY);
    },
    async write(next) {
      await client.set(BEHAVIOUR_TAGS_KV_KEY, next);
    },
  };
}

export function setBehaviourTagsStoreForTests(store: BehaviourTagsStore | null): void {
  testOverride = store;
}

export function resetBehaviourTagsStoreForTests(): void {
  testOverride = null;
  memorySingleton = null;
  redisSingleton = null;
}

export function getDefaultBehaviourTagsStore(): BehaviourTagsStore {
  if (testOverride) {
    return testOverride;
  }

  const redisEnv = readRedisEnv();
  if (redisEnv) {
    if (!redisSingleton) {
      const redis = new Redis({ url: redisEnv.url, token: redisEnv.token });
      redisSingleton = createBehaviourTagsRedisStore({
        get: (key) => redis.get(key),
        set: async (key, value) => ((await redis.set(key, value)) === "OK" ? "OK" : null),
      });
    }
    return redisSingleton;
  }

  if (process.env.NODE_ENV === "production") {
    throw new BehaviourTagsStoreUnavailableError();
  }

  memorySingleton ??= createBehaviourTagsMemoryStore();
  return memorySingleton;
}

async function readDocument(store: BehaviourTagsStore): Promise<BehaviourTagsDocument> {
  return parseTagsDocument(await store.read());
}

export async function listSharedBehaviourTags(
  store: BehaviourTagsStore = getDefaultBehaviourTagsStore(),
): Promise<BehaviourTag[]> {
  return sortTagsNewestFirst((await readDocument(store)).tags);
}

export async function listSharedBehaviourTagIds(
  store: BehaviourTagsStore = getDefaultBehaviourTagsStore(),
): Promise<string[]> {
  return tagIds(await readDocument(store));
}

export async function addSharedBehaviourTag(
  draft: BehaviourTagDraft,
  store: BehaviourTagsStore = getDefaultBehaviourTagsStore(),
): Promise<BehaviourTag> {
  const id = crypto.randomUUID();
  const next = addBehaviourTag(await readDocument(store), draft, { id, now: new Date() });
  await store.write(next);
  return next.tags[next.tags.length - 1] as BehaviourTag;
}

export async function deleteSharedBehaviourTag(
  id: string,
  store: BehaviourTagsStore = getDefaultBehaviourTagsStore(),
): Promise<boolean> {
  const { document, removed } = removeBehaviourTag(await readDocument(store), id);
  if (removed) {
    await store.write(document);
  }
  return removed;
}
