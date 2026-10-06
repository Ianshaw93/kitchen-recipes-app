import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { resetFxCacheForTests } from "@/lib/fx";

function request(path = "http://localhost/api/payments/rate"): Request {
  return new Request(path);
}

function stubProviders(handler: (url: string) => Response | "network-error"): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const outcome = handler(String(input));
      if (outcome === "network-error") {
        throw new TypeError("Failed to fetch");
      }

      return outcome;
    }),
  );
}

describe("payments rate API route", () => {
  beforeEach(() => {
    resetFxCacheForTests();
  });

  afterEach(() => {
    resetFxCacheForTests();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns the live THB to GBP rate", async () => {
    stubProviders((url) =>
      url.includes("open.er-api.com")
        ? Response.json({ rates: { GBP: 0.02272 } })
        : new Response("boom", { status: 503 }),
    );

    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({
      base: "THB",
      quote: "GBP",
      rate: 0.02272,
      source: "open.er-api.com",
      fetchedAt: expect.any(String),
    });
  });

  it("returns 503 with an error when no provider answers", async () => {
    stubProviders(() => "network-error");

    const response = await GET(request());

    expect(response.status).toBe(503);
    const body = (await response.json()) as { error: string };
    expect(body.error).toMatch(/rate/i);
  });

  it("requires the household token", async () => {
    vi.stubEnv("PAYMENTS_HOUSEHOLD_TOKEN", "household-secret");
    stubProviders(() => Response.json({ rates: { GBP: 0.02272 } }));

    expect((await GET(request())).status).toBe(401);

    const allowed = await GET(
      request("http://localhost/api/payments/rate?token=household-secret"),
    );
    expect(allowed.status).toBe(200);
  });
});
