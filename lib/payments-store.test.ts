import { afterEach, describe, expect, it, vi } from "vitest";
import { SEED_PAYMENTS, calculateBalance, summariseBalance } from "./payments";
import {
  PaymentsStoreUnavailableError,
  createMemoryStore,
  createRedisStore,
  createSharedPayment,
  deleteSharedPayment,
  getDefaultStore,
  listSharedPayments,
  readRedisEnv,
  resetDefaultStoreForTests,
  type PaymentsKv,
} from "./payments-store";

describe("payments store", () => {
  afterEach(() => {
    resetDefaultStoreForTests();
    vi.unstubAllEnvs();
  });

  it("seeds Asda and the oil change on the first empty store", async () => {
    const store = createMemoryStore();
    const entries = await listSharedPayments(store);

    expect(entries.map((entry) => entry.description)).toEqual([
      "Car oil change",
      "Asda shop",
    ]);
    expect(entries).toHaveLength(SEED_PAYMENTS.length);
    expect(summariseBalance(calculateBalance(entries))).toBe("Ian is owed £64.80");
  });

  it("does not re-seed after the ledger is cleared", async () => {
    const store = createMemoryStore();
    const seeded = await listSharedPayments(store);

    for (const entry of seeded) {
      await deleteSharedPayment(entry.id, store);
    }

    expect(await listSharedPayments(store)).toEqual([]);
  });

  it("adds a spend and keeps the 50/50 math", async () => {
    const store = createMemoryStore();
    await listSharedPayments(store);

    const { entry, created } = await createSharedPayment(
      {
        date: "2026-09-22",
        description: "Tesco shop",
        amountPence: 12960,
        paidBy: "Avery",
      },
      store,
    );

    expect(created).toBe(true);
    expect(entry.description).toBe("Tesco shop");

    const listed = await listSharedPayments(store);
    expect(listed[0]?.description).toBe("Tesco shop");
    expect(calculateBalance(listed)).toEqual({ status: "settled" });
  });

  it("does not double-add the same spend", async () => {
    const store = createMemoryStore();
    const draft = {
      date: "2026-09-22",
      description: "Milk",
      amountPence: 200,
      paidBy: "Ian" as const,
    };

    const first = await createSharedPayment(draft, store);
    const second = await createSharedPayment(draft, store);

    expect(second.created).toBe(false);
    expect(second.entry.id).toBe(first.entry.id);
    expect((await listSharedPayments(store)).filter((entry) => entry.description === "Milk")).toHaveLength(
      1,
    );
  });

  it("reads Redis env from Upstash or legacy KV names", () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://upstash.example");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "upstash-token");
    expect(readRedisEnv()).toEqual({
      url: "https://upstash.example",
      token: "upstash-token",
    });

    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    vi.stubEnv("KV_REST_API_URL", "https://kv.example");
    vi.stubEnv("KV_REST_API_TOKEN", "kv-token");
    expect(readRedisEnv()).toEqual({
      url: "https://kv.example",
      token: "kv-token",
    });
  });

  it("writes through a Redis-shaped client", async () => {
    const map = new Map<string, unknown>();
    const client: PaymentsKv = {
      get: async (key) => map.get(key) ?? null,
      set: async (key, value, opts) => {
        if (opts?.nx && map.has(key)) {
          return null;
        }
        map.set(key, value);
        return "OK";
      },
    };

    const store = createRedisStore(client);
    const entries = await listSharedPayments(store);
    expect(entries.map((entry) => entry.description)).toContain("Asda shop");
    expect(map.size).toBe(1);
  });

  it("throws in production when Redis env is missing", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    vi.stubEnv("KV_REST_API_URL", "");
    vi.stubEnv("KV_REST_API_TOKEN", "");
    resetDefaultStoreForTests();

    expect(() => getDefaultStore()).toThrow(PaymentsStoreUnavailableError);
  });
});
