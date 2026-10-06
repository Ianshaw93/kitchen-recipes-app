import type { ThbGbpRate } from "./payments";
import { isValidFxRate } from "./payments";

export const FX_PRIMARY_URL = "https://open.er-api.com/v6/latest/THB";
export const FX_PRIMARY_SOURCE = "open.er-api.com";
export const FX_FALLBACK_URL = "https://api.frankfurter.app/latest?from=THB&to=GBP";
export const FX_FALLBACK_SOURCE = "frankfurter.app";

/** Rates barely move day to day; an hour of caching keeps the phones snappy. */
export const FX_CACHE_TTL_MS = 60 * 60 * 1000;
export const FX_FETCH_TIMEOUT_MS = 4000;

export type FxFetchOptions = {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  now?: () => number;
};

type Provider = { url: string; source: string };

const PROVIDERS: Provider[] = [
  { url: FX_PRIMARY_URL, source: FX_PRIMARY_SOURCE },
  { url: FX_FALLBACK_URL, source: FX_FALLBACK_SOURCE },
];

let cache: { rate: ThbGbpRate; at: number } | null = null;

export function resetFxCacheForTests(): void {
  cache = null;
}

function readGbpRate(payload: unknown): number | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const rates = (payload as { rates?: unknown }).rates;
  if (!rates || typeof rates !== "object") {
    return null;
  }

  const rate = (rates as Record<string, unknown>).GBP;
  return isValidFxRate(rate) ? rate : null;
}

async function fetchProviderRate(
  provider: Provider,
  options: FxFetchOptions,
): Promise<number | null> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? FX_FETCH_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(provider.url, {
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) {
      return null;
    }

    return readGbpRate(await response.json());
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * The THB→GBP rate, from a one-hour in-memory cache, the primary provider, or the
 * fallback provider. Returns null when nothing usable answers.
 */
export async function getThbGbpRate(options: FxFetchOptions = {}): Promise<ThbGbpRate | null> {
  const now = options.now ?? Date.now;

  if (cache && now() - cache.at < FX_CACHE_TTL_MS) {
    return cache.rate;
  }

  for (const provider of PROVIDERS) {
    const rate = await fetchProviderRate(provider, options);
    if (rate === null) {
      continue;
    }

    const fresh: ThbGbpRate = {
      base: "THB",
      quote: "GBP",
      rate,
      source: provider.source,
      fetchedAt: new Date(now()).toISOString(),
    };
    cache = { rate: fresh, at: now() };
    return fresh;
  }

  return null;
}
