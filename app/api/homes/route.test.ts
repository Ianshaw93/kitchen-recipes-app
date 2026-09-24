import { afterEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/homes/route";
import { POST as VOTE } from "@/app/api/homes/vote/route";
import { SEED_HOMES_WEEK } from "@/lib/homes";
import { createHomesMemoryStore, resetHomesStoreForTests, setHomesStoreForTests } from "@/lib/homes-store";

function request(path = "http://localhost/api/homes", init?: RequestInit): Request {
  return new Request(path, init);
}

describe("homes API routes", () => {
  afterEach(() => {
    resetHomesStoreForTests();
    vi.unstubAllEnvs();
  });

  it("GET seeds the W39 listings on an empty store", async () => {
    setHomesStoreForTests(createHomesMemoryStore());

    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");

    const body = (await response.json()) as { weeks: typeof SEED_HOMES_WEEK[] };
    expect(body.weeks).toHaveLength(1);
    expect(body.weeks[0]?.id).toBe("2026-W39");
    expect(body.weeks[0]?.listings.map((listing) => listing.address)).toEqual([
      "Archerhill Road, Knightswood",
      "124 Alderman Road, Knightswood",
      "Kelvindale Road, Kelvindale",
      "243 Alderman Road",
    ]);
  });

  it("POST /vote upserts a person vote that GET then returns", async () => {
    setHomesStoreForTests(createHomesMemoryStore());
    await GET(request());

    const voted = await VOTE(
      request("http://localhost/api/homes/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: SEED_HOMES_WEEK.listings[0]!.id,
          person: "abby",
          choice: "yes",
        }),
      }),
    );

    expect(voted.status).toBe(200);
    const listed = await GET(request());
    const body = (await listed.json()) as {
      weeks: Array<{ listings: Array<{ votes: { abby?: { choice: string } } }> }>;
    };
    expect(body.weeks[0]?.listings[0]?.votes.abby?.choice).toBe("yes");
  });

  it("rejects invalid vote bodies", async () => {
    setHomesStoreForTests(createHomesMemoryStore());
    const response = await VOTE(
      request("http://localhost/api/homes/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: "x", person: "avery", choice: "yes" }),
      }),
    );
    expect(response.status).toBe(400);
  });

  it("returns 404 when voting on an unknown listing", async () => {
    setHomesStoreForTests(createHomesMemoryStore());
    const response = await VOTE(
      request("http://localhost/api/homes/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: "missing", person: "ian", choice: "no" }),
      }),
    );
    expect(response.status).toBe(404);
  });

  it("POST /api/homes appends a week", async () => {
    setHomesStoreForTests(createHomesMemoryStore());
    await GET(request());

    const created = await POST(
      request("http://localhost/api/homes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "2026-W40",
          label: "Week of 28 Sep 2026",
          createdAt: "2026-09-28T12:00:00.000Z",
          listings: [
            {
              id: "later-listing",
              address: "Later Road, Kelvindale",
              area: "Kelvindale",
              price: 280000,
              beds: 3,
              type: "semi",
              blurb: "A later shortlist card.",
              votes: {},
            },
          ],
        }),
      }),
    );

    expect(created.status).toBe(201);
    const listed = await GET(request());
    const body = (await listed.json()) as { weeks: Array<{ id: string }> };
    expect(body.weeks.map((week) => week.id)).toEqual(["2026-W40", "2026-W39"]);
  });

  it("rejects invalid week bodies", async () => {
    setHomesStoreForTests(createHomesMemoryStore());
    const response = await POST(
      request("http://localhost/api/homes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: "nope" }),
      }),
    );
    expect(response.status).toBe(400);
  });

  it("returns 401 when the household token does not match", async () => {
    vi.stubEnv("PAYMENTS_HOUSEHOLD_TOKEN", "household-secret");
    setHomesStoreForTests(createHomesMemoryStore());

    const response = await GET(request());
    expect(response.status).toBe(401);

    const allowed = await GET(
      request("http://localhost/api/homes", {
        headers: { Authorization: "Bearer household-secret" },
      }),
    );
    expect(allowed.status).toBe(200);
  });
});
