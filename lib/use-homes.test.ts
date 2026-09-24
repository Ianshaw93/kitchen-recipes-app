import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { applyVote, SEED_HOMES_WEEK, type HomesDocument } from "./homes";
import { useHomes } from "./use-homes";

function stubHomes(initial = [SEED_HOMES_WEEK]) {
  let weeks = structuredClone(initial);
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();
    if (url.includes("/api/homes/vote") && method === "POST") {
      const draft = JSON.parse(String(init?.body ?? "{}")) as {
        listingId: string;
        person: "ian" | "abby";
        choice: "no" | "maybe" | "yes";
      };
      weeks = applyVote(weeks, draft.listingId, draft.person, draft.choice);
      return Response.json({ weeks });
    }
    return Response.json({ weeks });
  });
  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock, getWeeks: () => weeks };
}

describe("useHomes", () => {
  it("loads the shared shortlist from the API", async () => {
    stubHomes();
    const { result } = renderHook(() => useHomes());

    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.weeks[0]?.id).toBe("2026-W39");
    expect(result.current.syncError).toBeNull();
  });

  it("POSTs a vote and keeps the listing in place", async () => {
    stubHomes();
    const { result } = renderHook(() => useHomes());
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    await result.current.vote(SEED_HOMES_WEEK.listings[0]!.id, "ian", "yes");

    await waitFor(() =>
      expect(result.current.weeks[0]?.listings[0]?.votes.ian?.choice).toBe("yes"),
    );
  });

  it("keeps cached weeks and sets an error when the API is unreachable", async () => {
    window.localStorage.setItem(
      "kusina:homes:v1",
      JSON.stringify({ version: 1, weeks: [SEED_HOMES_WEEK] } satisfies HomesDocument),
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );

    const { result } = renderHook(() => useHomes());
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.weeks[0]?.id).toBe("2026-W39");
    expect(result.current.syncError).toMatch(/couldn't reach|offline/i);
  });
});
