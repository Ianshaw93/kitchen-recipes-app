import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("<html></html>", { status: 200 })),
    );
  });

  afterEach(() => {
    resetHomesStoreForTests();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
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

  it("attaches preview images for listings that have a url and persists them", async () => {
    const store = createHomesMemoryStore();
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const page = String(input);
      return new Response(
        `<meta property="og:image" content="https://cdn.example/photos/${encodeURIComponent(page)}.jpg">`,
        { status: 200, headers: { "Content-Type": "text/html" } },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const weeks = await listSharedHomes(store);
    const listings = weeks[0]!.listings;

    expect(listings.find((listing) => listing.id === "archerhill-road-knightswood")?.imageUrl).toBe(
      "https://cdn.example/photos/https%3A%2F%2Fwww.rightmove.co.uk%2Fproperties%2F93127215.jpg",
    );
    expect(listings.find((listing) => listing.id === "124-alderman-road-knightswood")?.imageUrl).toMatch(
      /^https:\/\/cdn\.example\/photos\//,
    );
    expect(listings.find((listing) => listing.id === "kelvindale-road-kelvindale")?.imageUrl).toMatch(
      /^https:\/\/cdn\.example\/photos\//,
    );
    expect(listings.find((listing) => listing.id === "243-alderman-road")?.imageUrl).toBeUndefined();

    fetchMock.mockClear();
    const again = await listSharedHomes(store);
    expect(again[0]?.listings[0]?.imageUrl).toBe(listings[0]?.imageUrl);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps a listing without an image when the preview fetch fails", async () => {
    const store = createHomesMemoryStore();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("blocked");
      }),
    );

    const weeks = await listSharedHomes(store);
    expect(weeks[0]?.listings.every((listing) => listing.imageUrl == null)).toBe(true);
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
