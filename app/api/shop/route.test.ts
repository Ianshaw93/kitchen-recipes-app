import { afterEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/shop/route";
import { SEED_SHOP } from "@/lib/shop";
import { createShopMemoryStore, resetShopStoreForTests, setShopStoreForTests } from "@/lib/shop-store";

function request(path = "http://localhost/api/shop", init?: RequestInit): Request {
  return new Request(path, init);
}

describe("shop API routes", () => {
  afterEach(() => {
    resetShopStoreForTests();
    vi.unstubAllEnvs();
  });

  it("GET seeds restocks and the Asian run on an empty store", async () => {
    setShopStoreForTests(createShopMemoryStore());

    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");

    const body = (await response.json()) as { shop: typeof SEED_SHOP };
    expect(body.shop.sections.fewWeeks.map((item) => item.label)).toEqual([
      "Soap refill",
      "Black bin bags",
      "Olive oil",
      "Coconut oil",
    ]);
    expect(body.shop.sections.thisWeek).toEqual([]);
    expect(body.shop.sections.asian.map((item) => item.label)).toEqual([
      "Fish sauce (patis)",
      "Tamarind paste (or sugar-free sinigang mix)",
      "Calamansi if available",
    ]);
    expect(body.shop.sections.asian.find((item) => item.label.startsWith("Tamarind"))?.note).toMatch(
      /ran out/i,
    );
  });

  it("POST toggle sticks for the next GET", async () => {
    setShopStoreForTests(createShopMemoryStore());
    const seeded = await GET(request());
    const shop = (await seeded.json()) as { shop: typeof SEED_SHOP };
    const soap = shop.shop.sections.fewWeeks.find((item) => item.label === "Soap refill");
    expect(soap).toBeDefined();

    const toggled = await POST(
      request("http://localhost/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "toggle", section: "fewWeeks", id: soap!.id }),
      }),
    );
    expect(toggled.status).toBe(200);

    const listed = await GET(request());
    const body = (await listed.json()) as { shop: typeof SEED_SHOP };
    expect(body.shop.sections.fewWeeks.find((item) => item.id === soap!.id)?.done).toBe(true);
    expect(body.shop.sections.asian.every((item) => item.done === false)).toBe(true);
  });

  it("POST add appends a this-week extra and clear unchecks without deleting", async () => {
    setShopStoreForTests(createShopMemoryStore());
    await GET(request());

    const created = await POST(
      request("http://localhost/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "add", section: "thisWeek", label: "Birthday candles" }),
      }),
    );
    expect(created.status).toBe(201);

    const seeded = await GET(request());
    const shop = (await seeded.json()) as { shop: typeof SEED_SHOP };
    const oil = shop.shop.sections.fewWeeks.find((item) => item.label === "Olive oil");
    await POST(
      request("http://localhost/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "toggle", section: "fewWeeks", id: oil!.id }),
      }),
    );
    const cleared = await POST(
      request("http://localhost/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "clear", section: "fewWeeks" }),
      }),
    );
    expect(cleared.status).toBe(200);

    const listed = await GET(request());
    const body = (await listed.json()) as { shop: typeof SEED_SHOP };
    expect(body.shop.sections.thisWeek.map((item) => item.label)).toEqual(["Birthday candles"]);
    expect(body.shop.sections.fewWeeks.find((item) => item.id === oil!.id)?.done).toBe(false);
    expect(body.shop.sections.fewWeeks.map((item) => item.label)).toContain("Olive oil");
  });

  it("rejects invalid POST bodies and unknown item ids", async () => {
    setShopStoreForTests(createShopMemoryStore());
    await GET(request());

    const invalid = await POST(
      request("http://localhost/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "add", section: "thisWeek", label: "   " }),
      }),
    );
    expect(invalid.status).toBe(400);

    const missing = await POST(
      request("http://localhost/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "toggle", section: "asian", id: "missing" }),
      }),
    );
    expect(missing.status).toBe(404);
  });

  it("returns 401 when the household token does not match", async () => {
    vi.stubEnv("PAYMENTS_HOUSEHOLD_TOKEN", "household-secret");
    setShopStoreForTests(createShopMemoryStore());

    const response = await GET(request());
    expect(response.status).toBe(401);

    const allowed = await GET(
      request("http://localhost/api/shop", {
        headers: { Authorization: "Bearer household-secret" },
      }),
    );
    expect(allowed.status).toBe(200);
  });
});
