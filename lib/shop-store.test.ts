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

  it("migrates a stored v1 list by adding the heater without replacing grocery rows", async () => {
    const store = createShopMemoryStore({
      version: 1,
      updatedAt: "2026-09-20T00:00:00.000Z",
      sections: {
        fewWeeks: [{ id: "soap", label: "Soap refill", done: true }],
        thisWeek: [{ id: "lemons", label: "Lemons", done: false }],
        asian: [{ id: "patis", label: "Fish sauce (patis)", done: false }],
      },
    });

    const listed = await listSharedShop(store);
    expect(listed.version).toBe(2);
    expect(listed.sections.fewWeeks[0]).toMatchObject({ id: "soap", label: "Soap refill", done: true });
    expect(listed.sections.thisWeek.map((item) => item.label)).toEqual(["Lemons"]);
    expect(listed.sections.asian[0]?.label).toBe("Fish sauce (patis)");
    expect(listed.homeItems.map((item) => item.label)).toEqual(["Heater"]);
    expect(listed.homeItems[0]?.done).toBe(false);
    expect(listed.homeItems[0]?.detail?.options[0]?.url).toMatch(/screwfix\.com/);

    const stored = await store.read();
    expect(stored).toMatchObject({ version: 2 });
    const again = await listSharedShop(store);
    expect(again.homeItems).toHaveLength(1);
    expect(again.sections.fewWeeks[0]?.done).toBe(true);
  });

  it("does not reseed home items when a v2 list has none", async () => {
    const emptied = {
      ...SEED_SHOP,
      updatedAt: "2026-09-28T00:00:00.000Z",
      homeItems: [],
    };
    const store = createShopMemoryStore(emptied);
    const listed = await listSharedShop(store);
    expect(listed.homeItems).toEqual([]);
    expect(listed.sections.fewWeeks.map((item) => item.label)).toEqual(
      SEED_SHOP.sections.fewWeeks.map((item) => item.label),
    );
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
