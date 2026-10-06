import { afterEach, describe, expect, it, vi } from "vitest";
import { DELETE } from "@/app/api/payments/[id]/route";
import { GET, POST } from "@/app/api/payments/route";
import { SEED_PAYMENTS, type PaymentEntry } from "@/lib/payments";
import { resetFxCacheForTests } from "@/lib/fx";
import { createMemoryStore, resetDefaultStoreForTests, setPaymentsStoreForTests } from "@/lib/payments-store";

function request(path = "http://localhost/api/payments", init?: RequestInit): Request {
  return new Request(path, init);
}

function postRequest(body: unknown): Request {
  return request("http://localhost/api/payments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function stubLiveRate(rate: number | null): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      if (rate === null) {
        return new Response("boom", { status: 503 });
      }

      return String(input).includes("open.er-api.com")
        ? Response.json({ rates: { GBP: rate } })
        : new Response("boom", { status: 503 });
    }),
  );
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

describe("payments API routes with Thai baht", () => {
  afterEach(() => {
    resetDefaultStoreForTests();
    resetFxCacheForTests();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  const thbBody = {
    date: "2026-10-07",
    description: "Night market",
    paidBy: "Ian",
    currency: "THB",
    originalAmount: 100000,
    fxRate: 0.0228,
  };

  it("converts a THB spend with the live rate and lists it", async () => {
    stubLiveRate(0.025);
    setPaymentsStoreForTests(createMemoryStore());

    const response = await POST(postRequest(thbBody));
    expect(response.status).toBe(201);

    const body = (await response.json()) as { entry: PaymentEntry };
    expect(body.entry).toMatchObject({
      description: "Night market",
      paidBy: "Ian",
      amountPence: 2500,
      currency: "THB",
      originalAmount: 100000,
      fxRate: 0.025,
      fxSource: "live",
    });

    const listed = await GET(request());
    const list = (await listed.json()) as { entries: PaymentEntry[] };
    expect(list.entries[0]).toMatchObject({
      currency: "THB",
      originalAmount: 100000,
      fxRate: 0.025,
      fxSource: "live",
      amountPence: 2500,
    });
  });

  it("falls back to the client rate when no live rate is reachable", async () => {
    stubLiveRate(null);
    setPaymentsStoreForTests(createMemoryStore());

    const response = await POST(postRequest(thbBody));
    expect(response.status).toBe(201);

    const body = (await response.json()) as { entry: PaymentEntry };
    expect(body.entry).toMatchObject({
      amountPence: 2280,
      currency: "THB",
      originalAmount: 100000,
      fxRate: 0.0228,
      fxSource: "manual",
    });
  });

  it("uses the approximate fallback rate when the client sends none", async () => {
    stubLiveRate(null);
    setPaymentsStoreForTests(createMemoryStore());

    const response = await POST(
      postRequest({ ...thbBody, fxRate: undefined, amountPence: undefined }),
    );
    expect(response.status).toBe(201);

    const body = (await response.json()) as { entry: PaymentEntry };
    expect(body.entry.fxSource).toBe("manual");
    expect(body.entry.amountPence).toBe(Math.round(100000 * 0.0228));
  });

  it("rejects an unusable THB spend", async () => {
    stubLiveRate(null);
    setPaymentsStoreForTests(createMemoryStore());

    expect((await POST(postRequest({ ...thbBody, originalAmount: undefined }))).status).toBe(400);
    expect((await POST(postRequest({ ...thbBody, originalAmount: -5 }))).status).toBe(400);
    expect((await POST(postRequest({ ...thbBody, currency: "EUR" }))).status).toBe(400);
  });

  it("rejects a THB spend that converts to less than a penny", async () => {
    stubLiveRate(0.025);
    setPaymentsStoreForTests(createMemoryStore());
    await GET(request());

    // The client rate is fine, but the live rate rounds ฿0.10 down to nothing.
    const liveKillsIt = await POST(
      postRequest({ ...thbBody, originalAmount: 10, fxRate: 0.1 }),
    );
    expect(liveKillsIt.status).toBe(400);
    expect(await liveKillsIt.json()).toEqual({ error: "Invalid payment" });

    // The client rate alone is already sub-penny.
    const subPenny = await POST(
      postRequest({ ...thbBody, originalAmount: 20, fxRate: 0.0228 }),
    );
    expect(subPenny.status).toBe(400);

    // Nothing was written, so the ledger is still the seeded one.
    const listed = await GET(request());
    const list = (await listed.json()) as { entries: PaymentEntry[] };
    expect(list.entries).toHaveLength(SEED_PAYMENTS.length);
    expect(list.entries.map((entry) => entry.description)).toEqual([
      "Car oil change",
      "Asda shop",
    ]);
  });

  it("does not double-add the same THB spend", async () => {
    stubLiveRate(0.025);
    setPaymentsStoreForTests(createMemoryStore());
    await GET(request());

    const first = await POST(postRequest(thbBody));
    expect(first.status).toBe(201);
    const firstEntry = ((await first.json()) as { entry: PaymentEntry }).entry;

    const second = await POST(postRequest(thbBody));
    expect(second.status).toBe(200);
    const secondEntry = ((await second.json()) as { entry: PaymentEntry }).entry;
    expect(secondEntry.id).toBe(firstEntry.id);

    const listed = await GET(request());
    const list = (await listed.json()) as { entries: PaymentEntry[] };
    expect(list.entries.filter((entry) => entry.currency === "THB")).toHaveLength(1);
  });

  it("keeps GBP posts working", async () => {
    stubLiveRate(null);
    setPaymentsStoreForTests(createMemoryStore());

    const response = await POST(
      postRequest({
        date: "2026-10-07",
        description: "Tesco shop",
        amountPence: 1250,
        paidBy: "Avery",
      }),
    );

    expect(response.status).toBe(201);
    const body = (await response.json()) as { entry: PaymentEntry };
    expect(body.entry).toMatchObject({ amountPence: 1250, paidBy: "Avery" });
    expect(body.entry.currency).toBeUndefined();
  });
});

const liveBase = process.env.PAYMENTS_E2E_URL;
const realFetch = globalThis.fetch;

describe.skipIf(!liveBase)("payments API live GET", () => {
  it("returns seeded Asda shop and car oil change", async () => {
    const headers: HeadersInit = {};
    const token = process.env.PAYMENTS_HOUSEHOLD_TOKEN || process.env.NEXT_PUBLIC_PAYMENTS_TOKEN;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await realFetch(`${liveBase}/api/payments`, { headers, cache: "no-store" });
    expect(response.ok).toBe(true);
    const body = (await response.json()) as { entries: Array<{ description: string }> };
    const descriptions = body.entries.map((entry) => entry.description);
    expect(descriptions).toContain("Asda shop");
    expect(descriptions).toContain("Car oil change");
  });
});
