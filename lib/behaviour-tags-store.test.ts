import { afterEach, describe, expect, it, vi } from "vitest";
import { RELATIONSHIP_KV_KEY } from "./relationship";
import {
  BehaviourTagsStoreUnavailableError,
  addSharedBehaviourTag,
  createBehaviourTagsMemoryStore,
  createBehaviourTagsRedisStore,
  deleteSharedBehaviourTag,
  getDefaultBehaviourTagsStore,
  listSharedBehaviourTags,
  resetBehaviourTagsStoreForTests,
} from "./behaviour-tags-store";

function fakeKv() {
  const data = new Map<string, unknown>();
  return {
    data,
    get: vi.fn(async (key: string) => data.get(key) ?? null),
    set: vi.fn(async (key: string, value: unknown) => {
      data.set(key, structuredClone(value));
      return "OK" as const;
    }),
  };
}

describe("behaviour tags store", () => {
  afterEach(() => {
    resetBehaviourTagsStoreForTests();
    vi.unstubAllEnvs();
  });

  it("lists nothing on an empty store", async () => {
    expect(await listSharedBehaviourTags(createBehaviourTagsMemoryStore())).toEqual([]);
  });

  it("adds, lists newest first, and deletes by id", async () => {
    const store = createBehaviourTagsMemoryStore();
    const first = await addSharedBehaviourTag(
      { horseman: "criticism", kind: "win", text: "Generic win", date: "2026-10-01" },
      store,
    );
    const second = await addSharedBehaviourTag(
      { horseman: "contempt", kind: "slip", text: "Generic slip", date: "2026-10-03" },
      store,
    );
    expect(first.id).not.toBe(second.id);
    expect((await listSharedBehaviourTags(store)).map((tag) => tag.text)).toEqual(["Generic slip", "Generic win"]);

    expect(await deleteSharedBehaviourTag(first.id, store)).toBe(true);
    expect(await deleteSharedBehaviourTag(first.id, store)).toBe(false);
    expect((await listSharedBehaviourTags(store)).map((tag) => tag.id)).toEqual([second.id]);
  });

  it("writes only to relationship:tags in Redis, never the household notes key", async () => {
    const kv = fakeKv();
    const store = createBehaviourTagsRedisStore(kv);
    await addSharedBehaviourTag({ horseman: "stonewalling", kind: "win", text: "Generic pause" }, store);

    expect([...kv.data.keys()]).toEqual(["relationship:tags"]);
    expect(kv.set).not.toHaveBeenCalledWith(RELATIONSHIP_KV_KEY, expect.anything(), expect.anything());
    expect(kv.data.get("relationship:tags")).toMatchObject({
      version: 1,
      tags: [{ horseman: "stonewalling", kind: "win", text: "Generic pause" }],
    });
  });

  it("refuses to fall back to memory in production without Redis", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    vi.stubEnv("KV_REST_API_URL", "");
    vi.stubEnv("KV_REST_API_TOKEN", "");
    expect(() => getDefaultBehaviourTagsStore()).toThrow(BehaviourTagsStoreUnavailableError);
  });
});
