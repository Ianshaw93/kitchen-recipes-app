import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  FX_CACHE_TTL_MS,
  FX_FALLBACK_SOURCE,
  FX_FALLBACK_URL,
  FX_PRIMARY_SOURCE,
  FX_PRIMARY_URL,
  getThbGbpRate,
  resetFxCacheForTests,
} from "./fx";

const primaryPayload = { result: "success", base_code: "THB", rates: { GBP: 0.02272 } };
const fallbackPayload = {
  amount: 1,
  base: "THB",
  date: "2026-10-06",
  rates: { GBP: 0.0225 },
};

function stubProviders(
  handler: (url: string) => Response | "network-error" | "hang",
) {
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const outcome = handler(String(input));
    if (outcome === "network-error") {
      return Promise.reject(new TypeError("Failed to fetch"));
    }
    if (outcome === "hang") {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
      });
    }
    return Promise.resolve(outcome);
  });

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("thb to gbp rate", () => {
  beforeEach(() => {
    resetFxCacheForTests();
  });

  afterEach(() => {
    resetFxCacheForTests();
    vi.unstubAllGlobals();
  });

  it("reads rates.GBP from the primary provider", async () => {
    const fetchMock = stubProviders((url) =>
      url === FX_PRIMARY_URL ? Response.json(primaryPayload) : new Response("nope", { status: 503 }),
    );

    const rate = await getThbGbpRate();

    expect(rate).toEqual({
      base: "THB",
      quote: "GBP",
      rate: 0.02272,
      source: FX_PRIMARY_SOURCE,
      fetchedAt: expect.any(String),
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(FX_PRIMARY_URL);
    expect(Number.isNaN(Date.parse(rate?.fetchedAt ?? ""))).toBe(false);
  });

  it("falls back to frankfurter when the primary provider errors", async () => {
    const fetchMock = stubProviders((url) => {
      if (url === FX_PRIMARY_URL) {
        return new Response("boom", { status: 503 });
      }
      return url === FX_FALLBACK_URL
        ? Response.json(fallbackPayload)
        : new Response("nope", { status: 404 });
    });

    const rate = await getThbGbpRate();

    expect(rate?.rate).toBe(0.0225);
    expect(rate?.source).toBe(FX_FALLBACK_SOURCE);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([FX_PRIMARY_URL, FX_FALLBACK_URL]);
  });

  it("falls back to frankfurter when the primary provider is unreachable", async () => {
    stubProviders((url) =>
      url === FX_PRIMARY_URL ? "network-error" : Response.json(fallbackPayload),
    );

    expect((await getThbGbpRate())?.rate).toBe(0.0225);
  });

  it("returns null when neither provider answers", async () => {
    stubProviders(() => "network-error");

    expect(await getThbGbpRate()).toBeNull();
  });

  it("ignores implausible rates from both providers", async () => {
    stubProviders((url) =>
      Response.json(url === FX_PRIMARY_URL ? { rates: { GBP: 5000 } } : { rates: { GBP: 0 } }),
    );

    expect(await getThbGbpRate()).toBeNull();
  });

  it("ignores a payload without a numeric GBP rate", async () => {
    stubProviders(() => Response.json({ rates: { GBP: "0.02" } }));

    expect(await getThbGbpRate()).toBeNull();
  });

  it("serves the cached rate for an hour", async () => {
    const fetchMock = stubProviders((url) =>
      url === FX_PRIMARY_URL ? Response.json(primaryPayload) : new Response("nope", { status: 503 }),
    );

    const first = await getThbGbpRate();
    const second = await getThbGbpRate();

    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("refetches once the cache is stale", async () => {
    let now = 1_000_000;
    const fetchMock = stubProviders((url) =>
      url === FX_PRIMARY_URL ? Response.json(primaryPayload) : new Response("nope", { status: 503 }),
    );

    await getThbGbpRate({ now: () => now });
    now += FX_CACHE_TTL_MS - 1;
    await getThbGbpRate({ now: () => now });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    now += 2;
    await getThbGbpRate({ now: () => now });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not cache a failed lookup", async () => {
    stubProviders(() => "network-error");
    expect(await getThbGbpRate()).toBeNull();

    const fetchMock = stubProviders((url) =>
      url === FX_PRIMARY_URL ? Response.json(primaryPayload) : new Response("nope", { status: 503 }),
    );

    expect((await getThbGbpRate())?.rate).toBe(0.02272);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("gives up on a hanging provider", async () => {
    stubProviders(() => "hang");

    await expect(getThbGbpRate({ timeoutMs: 20 })).resolves.toBeNull();
  });

  it("sends an abort signal to the provider", async () => {
    const fetchMock = stubProviders((url) =>
      url === FX_PRIMARY_URL ? Response.json(primaryPayload) : new Response("nope", { status: 503 }),
    );

    await getThbGbpRate();

    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);
  });
});
