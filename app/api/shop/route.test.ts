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

  it("POST needThisWeek copies a standing row into this week without removing it", async () => {
    setShopStoreForTests(createShopMemoryStore());
    const seeded = await GET(request());
    const shop = (await seeded.json()) as { shop: typeof SEED_SHOP };
    const oil = shop.shop.sections.fewWeeks.find((item) => item.label === "Olive oil");
    const tamarind = shop.shop.sections.asian.find((item) => item.label.startsWith("Tamarind"));

    await POST(
      request("http://localhost/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "toggle", section: "fewWeeks", id: oil!.id }),
      }),
    );

    const copied = await POST(
      request("http://localhost/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "needThisWeek", section: "fewWeeks", id: oil!.id }),
      }),
    );
    expect(copied.status).toBe(200);

    const again = await POST(
      request("http://localhost/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "needThisWeek", section: "asian", id: tamarind!.id }),
      }),
    );
    expect(again.status).toBe(200);

    const duplicate = await POST(
      request("http://localhost/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "needThisWeek", section: "fewWeeks", id: oil!.id }),
      }),
    );
    expect(duplicate.status).toBe(200);

    const listed = await GET(request());
    const body = (await listed.json()) as { shop: typeof SEED_SHOP };
    expect(body.shop.sections.fewWeeks.find((item) => item.id === oil!.id)).toMatchObject({
      label: "Olive oil",
      done: true,
    });
    expect(body.shop.sections.fewWeeks).toHaveLength(SEED_SHOP.sections.fewWeeks.length);
    expect(body.shop.sections.asian.find((item) => item.id === tamarind!.id)?.note).toMatch(/ran out/i);
    expect(body.shop.sections.thisWeek.map((item) => item.label)).toEqual([
      "Olive oil",
      "Tamarind paste (or sugar-free sinigang mix)",
    ]);
    expect(body.shop.sections.thisWeek.every((item) => item.done === false)).toBe(true);
    expect(body.shop.sections.thisWeek.find((item) => item.label.startsWith("Tamarind"))?.note).toMatch(
      /ran out/i,
    );

    const copy = body.shop.sections.thisWeek.find((item) => item.label === "Olive oil");
    await POST(
      request("http://localhost/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "toggle", section: "thisWeek", id: copy!.id }),
      }),
    );
    const afterTick = await GET(request());
    const ticked = (await afterTick.json()) as { shop: typeof SEED_SHOP };
    expect(ticked.shop.sections.thisWeek.find((item) => item.id === copy!.id)?.done).toBe(true);
    expect(ticked.shop.sections.fewWeeks.find((item) => item.id === oil!.id)?.done).toBe(true);
  });

  it("GET seeds the heater and POST can tick or add a home item", async () => {
    setShopStoreForTests(createShopMemoryStore());

    const seeded = await GET(request());
    const shop = (await seeded.json()) as { shop: typeof SEED_SHOP };
    expect(shop.shop.homeItems.map((item) => item.label)).toEqual(["Heater"]);
    expect(shop.shop.homeItems[0]?.done).toBe(false);
    expect(shop.shop.homeItems[0]?.detail?.options.map((option) => option.url)).toEqual([
      "https://www.screwfix.com/p/blyss-1500w-electric-portable-oil-filled-radiator-white/668cj",
      "https://www.amazon.co.uk/Status-Radiator-Adjustable-Thermostat-OFH9-2000WT1PKB/dp/B0F55646WB",
      "https://www.amazon.co.uk/Russell-Hobbs-Protection-Guarantee-RHOFR2009-D/dp/B0DKJKHQSG",
      "https://www.johnlewis.com/john-lewis-2500w-digital-oil-radiator-white/p110649880",
    ]);
    expect(shop.shop.sections.fewWeeks.map((item) => item.label)).toEqual([
      "Soap refill",
      "Black bin bags",
      "Olive oil",
      "Coconut oil",
    ]);

    const toggled = await POST(
      request("http://localhost/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "toggle", section: "home", id: "seed-heater" }),
      }),
    );
    expect(toggled.status).toBe(200);

    const added = await POST(
      request("http://localhost/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "add", section: "home", label: "Dining table" }),
      }),
    );
    expect(added.status).toBe(201);

    const listed = await GET(request());
    const body = (await listed.json()) as { shop: typeof SEED_SHOP };
    expect(body.shop.homeItems.map((item) => ({ label: item.label, done: item.done }))).toEqual([
      { label: "Heater", done: true },
      { label: "Dining table", done: false },
    ]);
    expect(body.shop.homeItems[0]?.detail?.options[0]?.url).toMatch(/screwfix\.com/);
    expect(body.shop.sections.asian.map((item) => item.label)).toEqual(
      SEED_SHOP.sections.asian.map((item) => item.label),
    );
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

    const unknownCopy = await POST(
      request("http://localhost/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "needThisWeek", section: "asian", id: "missing" }),
      }),
    );
    expect(unknownCopy.status).toBe(404);

    const wrongSection = await POST(
      request("http://localhost/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "needThisWeek", section: "thisWeek", id: "seed-soap-refill" }),
      }),
    );
    expect(wrongSection.status).toBe(400);
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
