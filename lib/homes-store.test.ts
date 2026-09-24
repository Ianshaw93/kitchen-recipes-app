import { afterEach, describe, expect, it, vi } from "vitest";
import { SEED_HOMES_WEEK } from "./homes";
import {
  HomesStoreUnavailableError,
  appendSharedWeek,
  createHomesMemoryStore,
  createHomesRedisStore,
  getDefaultHomesStore,
  listSharedHomes,
  readRedisEnv,
  resetHomesStoreForTests,
  voteSharedHome,
  type HomesKv,
} from "./homes-store";

describe("homes store", () => {
  afterEach(() => {
    resetHomesStoreForTests();
    vi.unstubAllEnvs();
  });

  it("seeds the W39 shortlist on an empty store", async () => {
    const store = createHomesMemoryStore();
    const weeks = await listSharedHomes(store);

    expect(weeks).toHaveLength(1);
    expect(weeks[0]?.id).toBe("2026-W39");
    expect(weeks[0]?.listings.map((listing) => listing.address)).toContain(
      "Archerhill Road, Knightswood",
    );
    expect(weeks[0]?.listings).toHaveLength(SEED_HOMES_WEEK.listings.length);
  });

  it("upserts a vote onto the seeded listing", async () => {
    const store = createHomesMemoryStore();
    await listSharedHomes(store);

    const { listing } = await voteSharedHome(
      {
        listingId: SEED_HOMES_WEEK.listings[0]!.id,
        person: "ian",
        choice: "yes",
      },
      store,
    );

    expect(listing?.votes.ian?.choice).toBe("yes");

    const listed = await listSharedHomes(store);
    expect(listed[0]?.listings[0]?.votes.ian?.choice).toBe("yes");
  });

  it("appends a later week without dropping seed votes", async () => {
    const store = createHomesMemoryStore();
    await voteSharedHome(
      {
        listingId: SEED_HOMES_WEEK.listings[0]!.id,
        person: "abby",
        choice: "maybe",
      },
      store,
    );

    const extra = {
      ...SEED_HOMES_WEEK,
      id: "2026-W40",
      label: "Week of 28 Sep 2026",
      createdAt: "2026-09-28T12:00:00.000Z",
      listings: [
        {
          ...SEED_HOMES_WEEK.listings[0]!,
          id: "later-listing",
          address: "Later Road, Kelvindale",
        },
      ],
    };

    const { created } = await appendSharedWeek(extra, store);
    expect(created).toBe(true);

    const weeks = await listSharedHomes(store);
    expect(weeks.map((week) => week.id)).toEqual(["2026-W40", "2026-W39"]);
    expect(weeks[1]?.listings[0]?.votes.abby?.choice).toBe("maybe");
  });

  it("reads Redis env from Upstash or legacy KV names", () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://upstash.example");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "upstash-token");
    expect(readRedisEnv()).toEqual({
      url: "https://upstash.example",
      token: "upstash-token",
    });
  });

  it("writes through a Redis-shaped client", async () => {
    const map = new Map<string, unknown>();
    const client: HomesKv = {
      get: async (key) => map.get(key) ?? null,
      set: async (key, value, opts) => {
        if (opts?.nx && map.has(key)) {
          return null;
        }
        map.set(key, value);
        return "OK";
      },
    };

    const store = createHomesRedisStore(client);
    const weeks = await listSharedHomes(store);
    expect(weeks[0]?.id).toBe("2026-W39");
    expect(map.size).toBe(1);
  });

  it("throws in production when Redis env is missing", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    vi.stubEnv("KV_REST_API_URL", "");
    vi.stubEnv("KV_REST_API_TOKEN", "");
    resetHomesStoreForTests();

    expect(() => getDefaultHomesStore()).toThrow(HomesStoreUnavailableError);
  });
});
