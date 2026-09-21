import { afterEach, describe, expect, it, vi } from "vitest";
import { SEED_EVENTS } from "./calendar";
import {
  deleteSharedEventRequest,
  fetchSharedEvents,
  patchSharedEvent,
  postSharedEvent,
} from "./calendar-client";
import { paymentsRequestHeaders } from "./payments-client";

describe("calendar client", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reuses the public household token as Bearer", () => {
    vi.stubEnv("NEXT_PUBLIC_PAYMENTS_TOKEN", "phone-token");
    expect(paymentsRequestHeaders().get("Authorization")).toBe("Bearer phone-token");
  });

  it("GETs the shared calendar", async () => {
    const fetchMock = vi.fn(async () => Response.json({ events: SEED_EVENTS }));
    vi.stubGlobal("fetch", fetchMock);

    const events = await fetchSharedEvents();
    expect(events.map((event) => event.title)).toContain("Thailand trip");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/calendar",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("POSTs, PATCHes, and DELETEs by id", async () => {
    const created = {
      id: "abc",
      title: "Date night",
      startDate: "2026-09-25",
      allDay: true,
      who: "Both" as const,
      createdAt: "2026-09-22T00:00:00.000Z",
    };
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "POST") {
        return Response.json({ event: created }, { status: 201 });
      }
      if (init?.method === "PATCH") {
        return Response.json({ event: { ...created, title: "Updated" } });
      }
      return Response.json({ ok: true });
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      postSharedEvent({
        title: "Date night",
        startDate: "2026-09-25",
        allDay: true,
        who: "Both",
      }),
    ).resolves.toEqual(created);

    await expect(
      patchSharedEvent("abc", {
        title: "Updated",
        startDate: "2026-09-25",
        allDay: true,
        who: "Both",
      }),
    ).resolves.toMatchObject({ title: "Updated" });

    await deleteSharedEventRequest("abc");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/calendar/abc",
      expect.objectContaining({ method: "DELETE" }),
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

    await expect(fetchSharedEvents()).rejects.toThrow(/offline/i);

    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      get: () => true,
    });
  });
});
