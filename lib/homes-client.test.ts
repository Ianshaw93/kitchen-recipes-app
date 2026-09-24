import { afterEach, describe, expect, it, vi } from "vitest";
import { paymentsRequestHeaders } from "./payments-client";
import { SEED_HOMES_WEEK } from "./homes";
import { fetchSharedHomes, postSharedVote } from "./homes-client";

describe("homes client", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reuses the payments household token header", () => {
    vi.stubEnv("NEXT_PUBLIC_PAYMENTS_TOKEN", "phone-token");
    expect(paymentsRequestHeaders().get("Authorization")).toBe("Bearer phone-token");
  });

  it("GETs the shared homes list", async () => {
    const fetchMock = vi.fn(async () => Response.json({ weeks: [SEED_HOMES_WEEK] }));
    vi.stubGlobal("fetch", fetchMock);

    const weeks = await fetchSharedHomes();
    expect(weeks[0]?.listings[0]?.address).toBe("Archerhill Road, Knightswood");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/homes",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("POSTs a vote", async () => {
    const fetchMock = vi.fn(async () => Response.json({ weeks: [SEED_HOMES_WEEK] }));
    vi.stubGlobal("fetch", fetchMock);

    await postSharedVote({
      listingId: SEED_HOMES_WEEK.listings[0]!.id,
      person: "ian",
      choice: "yes",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/homes/vote",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("surfaces an offline error when fetch fails", async () => {
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      get: () => false,
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );

    await expect(fetchSharedHomes()).rejects.toThrow(/offline/i);

    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      get: () => true,
    });
  });
});
