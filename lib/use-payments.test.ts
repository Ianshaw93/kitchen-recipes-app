import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SEED_PAYMENTS, addPayment, savePayments } from "./payments";
import { usePayments } from "./use-payments";

function stubLedger(initial = SEED_PAYMENTS) {
  let entries = [...initial];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();
    if (url.includes("/api/payments/") && method === "DELETE") {
      const id = decodeURIComponent(url.split("/").pop() ?? "");
      entries = entries.filter((entry) => entry.id !== id);
      return Response.json({ ok: true });
    }
    if (method === "POST") {
      const draft = JSON.parse(String(init?.body ?? "{}"));
      entries = addPayment(entries, draft);
      return Response.json({ entry: entries[0] }, { status: 201 });
    }
    return Response.json({ entries });
  });
  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock, getEntries: () => entries };
}

describe("usePayments", () => {
  it("loads the shared ledger from the API", async () => {
    stubLedger();
    const { result } = renderHook(() => usePayments());

    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.entries.map((entry) => entry.description)).toEqual([
      "Car oil change",
      "Asda shop",
    ]);
    expect(result.current.syncError).toBeNull();
  });

  it("POSTs adds and keeps seeded balance math until a matching Avery spend", async () => {
    stubLedger();
    const { result } = renderHook(() => usePayments());
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    await result.current.add({
      date: "2026-09-22",
      description: "Tesco shop",
      amountPence: 12960,
      paidBy: "Avery",
    });

    await waitFor(() =>
      expect(result.current.entries.some((entry) => entry.description === "Tesco shop")).toBe(true),
    );
  });

  it("keeps cached entries and sets an error when the API is unreachable", async () => {
    savePayments(
      addPayment([], {
        date: "2026-09-12",
        description: "Waitrose",
        amountPence: 2000,
        paidBy: "Avery",
      }),
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );

    const { result } = renderHook(() => usePayments());
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.entries[0]?.description).toBe("Waitrose");
    expect(result.current.syncError).toMatch(/couldn't reach|offline/i);
  });
});
