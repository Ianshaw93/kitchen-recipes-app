import { afterEach, describe, expect, it, vi } from "vitest";
import { SEED_SHOP, SHOP_KV_KEY } from "./shop";
import {
  ShopStoreUnavailableError,
  addSharedShopItem,
  clearSharedShopTicks,
  createShopMemoryStore,
  createShopRedisStore,
  getDefaultShopStore,
  listSharedShop,
  resetShopStoreForTests,
  toggleSharedShopItem,
  type ShopKv,
} from "./shop-store";

describe("shop store", () => {
  afterEach(() => {
    resetShopStoreForTests();
    vi.unstubAllEnvs();
  });

  it("seeds the household list once and does not re-seed an emptied specials section", async () => {
    const store = createShopMemoryStore();
    const first = await listSharedShop(store);

    expect(first.sections.fewWeeks.map((item) => item.label)).toEqual(
      SEED_SHOP.sections.fewWeeks.map((item) => item.label),
    );
    expect(first.sections.thisWeek).toEqual([]);
    expect(first.sections.asian.map((item) => item.label)).toEqual(
      SEED_SHOP.sections.asian.map((item) => item.label),
    );

    const again = await listSharedShop(store);
    expect(again.sections.fewWeeks.map((item) => item.id)).toEqual(
      first.sections.fewWeeks.map((item) => item.id),
    );
  });

  it("persists a toggle, an added item, and cleared ticks", async () => {
    const store = createShopMemoryStore();
    const seeded = await listSharedShop(store);
    const soap = seeded.sections.fewWeeks[0]!;

    const toggled = await toggleSharedShopItem("fewWeeks", soap.id, store);
    expect(toggled?.sections.fewWeeks[0]?.done).toBe(true);

    const added = await addSharedShopItem("thisWeek", { label: "Birthday candles" }, store);
    expect(added.sections.thisWeek.map((item) => item.label)).toEqual(["Birthday candles"]);

    const cleared = await clearSharedShopTicks("fewWeeks", store);
    expect(cleared.sections.fewWeeks[0]).toMatchObject({ id: soap.id, done: false });
    expect(cleared.sections.thisWeek).toHaveLength(1);

    const listed = await listSharedShop(store);
    expect(listed.sections.fewWeeks[0]?.done).toBe(false);
    expect(listed.sections.thisWeek[0]?.label).toBe("Birthday candles");
  });

  it("writes through a Redis-shaped client on kusina:shop:v1", async () => {
    const map = new Map<string, unknown>();
    const client: ShopKv = {
      get: async (key) => map.get(key) ?? null,
      set: async (key, value, opts) => {
        if (opts?.nx && map.has(key)) {
          return null;
        }
        map.set(key, value);
        return "OK";
      },
    };

    const store = createShopRedisStore(client);
    const shop = await listSharedShop(store);
    expect(shop.sections.asian[0]?.label).toBe("Fish sauce (patis)");
    expect(map.has(SHOP_KV_KEY)).toBe(true);
  });

  it("returns undefined when toggling an unknown id", async () => {
    const store = createShopMemoryStore();
    await listSharedShop(store);
    expect(await toggleSharedShopItem("asian", "missing", store)).toBeUndefined();
  });

  it("throws in production when Redis env is missing", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    vi.stubEnv("KV_REST_API_URL", "");
    vi.stubEnv("KV_REST_API_TOKEN", "");
    resetShopStoreForTests();

    expect(() => getDefaultShopStore()).toThrow(ShopStoreUnavailableError);
  });
});
