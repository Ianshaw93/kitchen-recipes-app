import { afterEach, describe, expect, it, vi } from "vitest";
import { DELETE } from "@/app/api/payments/[id]/route";
import { GET, POST } from "@/app/api/payments/route";
import { SEED_PAYMENTS } from "@/lib/payments";
import { createMemoryStore, resetDefaultStoreForTests, setPaymentsStoreForTests } from "@/lib/payments-store";

function request(path = "http://localhost/api/payments", init?: RequestInit): Request {
  return new Request(path, init);
}

describe("payments API routes", () => {
  afterEach(() => {
    resetDefaultStoreForTests();
    vi.unstubAllEnvs();
  });

  it("GET seeds Asda shop and car oil change on an empty store", async () => {
    setPaymentsStoreForTests(createMemoryStore());

    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");

    const body = (await response.json()) as { entries: typeof SEED_PAYMENTS };
    expect(body.entries.map((entry) => entry.description)).toEqual([
      "Car oil change",
      "Asda shop",
    ]);
    expect(body.entries).toHaveLength(2);
    expect(body.entries.find((entry) => entry.description === "Asda shop")?.amountPence).toBe(5760);
    expect(body.entries.find((entry) => entry.description === "Car oil change")?.note).toBe(
      "Shared car bill",
    );
  });

  it("POST adds a spend that GET then returns", async () => {
    setPaymentsStoreForTests(createMemoryStore());
    await GET(request());

    const created = await POST(
      request("http://localhost/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: "2026-09-22",
          description: "Milk",
          amountPence: 200,
          paidBy: "Avery",
        }),
      }),
    );

    expect(created.status).toBe(201);
    const listed = await GET(request());
    const body = (await listed.json()) as { entries: Array<{ description: string }> };
    expect(body.entries[0]?.description).toBe("Milk");
  });

  it("rejects invalid POST bodies", async () => {
    setPaymentsStoreForTests(createMemoryStore());
    const response = await POST(
      request("http://localhost/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: "nope" }),
      }),
    );
    expect(response.status).toBe(400);
  });

  it("DELETE removes a seeded entry", async () => {
    setPaymentsStoreForTests(createMemoryStore());
    const listed = await GET(request());
    const body = (await listed.json()) as { entries: Array<{ id: string; description: string }> };
    const asda = body.entries.find((entry) => entry.description === "Asda shop");
    expect(asda).toBeDefined();

    const deleted = await DELETE(request(`http://localhost/api/payments/${asda!.id}`), {
      params: Promise.resolve({ id: asda!.id }),
    });
    expect(deleted.status).toBe(200);

    const after = await GET(request());
    const remaining = (await after.json()) as { entries: Array<{ description: string }> };
    expect(remaining.entries.map((entry) => entry.description)).toEqual(["Car oil change"]);
  });

  it("returns 401 when the household token does not match", async () => {
    vi.stubEnv("PAYMENTS_HOUSEHOLD_TOKEN", "household-secret");
    setPaymentsStoreForTests(createMemoryStore());

    const response = await GET(request());
    expect(response.status).toBe(401);

    const allowed = await GET(
      request("http://localhost/api/payments", {
        headers: { Authorization: "Bearer household-secret" },
      }),
    );
    expect(allowed.status).toBe(200);
  });
});

const liveBase = process.env.PAYMENTS_E2E_URL;

describe.skipIf(!liveBase)("payments API live GET", () => {
  it("returns seeded Asda shop and car oil change", async () => {
    const headers: HeadersInit = {};
    const token = process.env.PAYMENTS_HOUSEHOLD_TOKEN || process.env.NEXT_PUBLIC_PAYMENTS_TOKEN;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${liveBase}/api/payments`, { headers, cache: "no-store" });
    expect(response.ok).toBe(true);
    const body = (await response.json()) as { entries: Array<{ description: string }> };
    const descriptions = body.entries.map((entry) => entry.description);
    expect(descriptions).toContain("Asda shop");
    expect(descriptions).toContain("Car oil change");
  });
});
