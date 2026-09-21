import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SEED_EVENTS, addEvent, saveEvents } from "./calendar";
import { useCalendar } from "./use-calendar";

function stubCalendar(initial = SEED_EVENTS) {
  let events = [...initial];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();
    if (url.includes("/api/calendar/") && method === "DELETE") {
      const id = decodeURIComponent(url.split("/").pop() ?? "");
      events = events.filter((event) => event.id !== id);
      return Response.json({ ok: true });
    }
    if (url.includes("/api/calendar/") && method === "PATCH") {
      const id = decodeURIComponent(url.split("/").pop() ?? "");
      const draft = JSON.parse(String(init?.body ?? "{}"));
      events = events.map((event) => (event.id === id ? { ...event, ...draft } : event));
      return Response.json({ event: events.find((event) => event.id === id) });
    }
    if (method === "POST") {
      const draft = JSON.parse(String(init?.body ?? "{}"));
      events = addEvent(events, draft);
      return Response.json({ event: events[0] }, { status: 201 });
    }
    return Response.json({ events });
  });
  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock, getEvents: () => events };
}

describe("useCalendar", () => {
  it("loads the shared calendar from the API", async () => {
    stubCalendar();
    const { result } = renderHook(() => useCalendar());

    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.events.map((event) => event.title)).toEqual([
      "Midwife appointment",
      "Thailand trip",
    ]);
    expect(result.current.syncError).toBeNull();
  });

  it("POSTs adds and PATCHes edits", async () => {
    stubCalendar();
    const { result } = renderHook(() => useCalendar());
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    await result.current.add({
      title: "Date night",
      startDate: "2026-09-25",
      allDay: true,
      who: "Both",
    });

    await waitFor(() =>
      expect(result.current.events.some((event) => event.title === "Date night")).toBe(true),
    );

    const added = result.current.events.find((event) => event.title === "Date night")!;
    await result.current.update(added.id, {
      title: "Date night at home",
      startDate: "2026-09-25",
      allDay: true,
      who: "Avery",
    });

    await waitFor(() =>
      expect(result.current.events.some((event) => event.title === "Date night at home")).toBe(true),
    );
  });

  it("keeps cached events and sets an error when the API is unreachable", async () => {
    saveEvents(
      addEvent([], {
        title: "Cached dinner",
        startDate: "2026-09-25",
        allDay: true,
        who: "Both",
      }),
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );

    const { result } = renderHook(() => useCalendar());
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.events[0]?.title).toBe("Cached dinner");
    expect(result.current.syncError).toMatch(/couldn't reach|offline/i);
  });
});
