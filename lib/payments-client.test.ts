import { afterEach, describe, expect, it, vi } from "vitest";
import {
  deleteSharedPaymentRequest,
  fetchSharedPayments,
  fetchThbGbpRate,
  paymentsRequestHeaders,
  postSharedPayment,
} from "./payments-client";
import { SEED_PAYMENTS } from "./payments";

describe("payments client", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("sends the public household token as Bearer", () => {
    vi.stubEnv("NEXT_PUBLIC_PAYMENTS_TOKEN", "phone-token");
    expect(paymentsRequestHeaders().get("Authorization")).toBe("Bearer phone-token");
  });

  it("GETs the shared ledger", async () => {
    const fetchMock = vi.fn(async () => Response.json({ entries: SEED_PAYMENTS }));
    vi.stubGlobal("fetch", fetchMock);

    const entries = await fetchSharedPayments();
    expect(entries.map((entry) => entry.description)).toContain("Asda shop");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/payments",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("POSTs a draft and DELETEs by id", async () => {
    const created = {
      id: "abc",
      date: "2026-09-22",
      description: "Milk",
      amountPence: 200,
      paidBy: "Ian" as const,
      createdAt: "2026-09-22T00:00:00.000Z",
    };
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "POST") {
        return Response.json({ entry: created }, { status: 201 });
      }
      return Response.json({ ok: true });
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      postSharedPayment({
        date: "2026-09-22",
        description: "Milk",
        amountPence: 200,
        paidBy: "Ian",
      }),
    ).resolves.toEqual(created);

    await deleteSharedPaymentRequest("abc");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/payments/abc",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("surfaces an offline error when fetch fails", async () => {
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      get: () => false,
    });
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    }));

    await expect(fetchSharedPayments()).rejects.toThrow(/offline/i);

    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      get: () => true,
    });
  });
});

describe("payments client rate lookup", () => {
  it("reads the THB to GBP rate from the shared API", async () => {
    const payload = {
      base: "THB",
      quote: "GBP",
      rate: 0.02272,
      source: "open.er-api.com",
      fetchedAt: "2026-10-06T00:00:00.000Z",
    };
    const fetchMock = vi.fn(async () => Response.json(payload));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchThbGbpRate()).resolves.toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/payments/rate",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("returns null when the rate route fails or returns junk", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 503 })));
    await expect(fetchThbGbpRate()).resolves.toBeNull();

    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ base: "THB", quote: "GBP" })));
    await expect(fetchThbGbpRate()).resolves.toBeNull();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );
    await expect(fetchThbGbpRate()).resolves.toBeNull();
  });
});
