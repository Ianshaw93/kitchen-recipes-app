import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  CALENDAR_STORAGE_KEY,
  SEED_EVENTS,
  addEvent,
  saveEvents,
  type CalendarEvent,
  type CalendarEventDraft,
} from "@/lib/calendar";
import { CoupleCalendar } from "./CoupleCalendar";

function stubCalendarApi(initial: CalendarEvent[] = []) {
  let events = [...initial];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();
    const idMatch = url.match(/\/api\/calendar\/([^/?]+)/);

    if (idMatch && method === "DELETE") {
      const id = decodeURIComponent(idMatch[1] ?? "");
      events = events.filter((event) => event.id !== id);
      return Response.json({ ok: true });
    }

    if (idMatch && method === "PATCH") {
      const id = decodeURIComponent(idMatch[1] ?? "");
      const draft = JSON.parse(String(init?.body ?? "{}")) as CalendarEventDraft;
      events = events.map((event) =>
        event.id === id
          ? {
              ...event,
              title: draft.title,
              startDate: draft.startDate,
              allDay: draft.allDay,
              who: draft.who,
              ...(draft.endDate ? { endDate: draft.endDate } : { endDate: undefined }),
              ...(draft.startTime && !draft.allDay ? { startTime: draft.startTime } : { startTime: undefined }),
              ...(draft.note ? { note: draft.note } : { note: undefined }),
            }
          : event,
      );
      return Response.json({ event: events.find((event) => event.id === id) });
    }

    if (url.includes("/api/calendar") && method === "POST") {
      const draft = JSON.parse(String(init?.body ?? "{}")) as CalendarEventDraft;
      events = addEvent(events, draft);
      return Response.json({ event: events.find((event) => event.title === draft.title) }, { status: 201 });
    }

    if (url.includes("/api/calendar")) {
      return Response.json({ events });
    }

    return new Response("not found", { status: 404 });
  });

  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock, getEvents: () => events };
}

describe("CoupleCalendar", () => {
  it("renders the month view, upcoming list, and both-phones message", async () => {
    stubCalendarApi(SEED_EVENTS);
    render(<CoupleCalendar today="2026-09-21" />);

    expect(screen.getByRole("heading", { name: /calendar/i })).toBeInTheDocument();
    expect(screen.getByText(/same events on both phones/i)).toBeInTheDocument();
    expect(await screen.findByText("Thailand trip")).toBeInTheDocument();
    expect(screen.getByText("Midwife appointment")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /september 2026/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add event/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /28 september 2026/i })).toHaveAttribute(
      "data-has-events",
      "true",
    );
  });

  it("adds an event via the API", async () => {
    const user = userEvent.setup();
    const api = stubCalendarApi();
    render(<CoupleCalendar today="2026-09-21" />);
    await screen.findByText(/nothing coming up yet/i);

    await user.type(screen.getByLabelText(/title/i), "Date night");
    await user.click(screen.getByRole("button", { name: /^both$/i }));
    await user.click(screen.getByRole("button", { name: /add event/i }));

    expect(await screen.findAllByText("Date night")).not.toHaveLength(0);
    expect(api.fetchMock).toHaveBeenCalledWith(
      "/api/calendar",
      expect.objectContaining({ method: "POST" }),
    );

    const stored = JSON.parse(window.localStorage.getItem(CALENDAR_STORAGE_KEY) ?? "null");
    expect(stored).toHaveLength(1);
    expect(stored[0].title).toBe("Date night");
    expect(screen.getByLabelText(/title/i)).toHaveValue("");
  });

  it("edits and deletes an event after confirm", async () => {
    const user = userEvent.setup();
    const api = stubCalendarApi(SEED_EVENTS);
    render(<CoupleCalendar today="2026-09-21" />);
    expect(await screen.findByText("Midwife appointment")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /edit midwife appointment/i }));
    await user.clear(screen.getByLabelText(/title/i));
    await user.type(screen.getByLabelText(/title/i), "Midwife follow-up");
    await user.click(screen.getByRole("button", { name: /save event/i }));

    expect(await screen.findAllByText("Midwife follow-up")).not.toHaveLength(0);
    expect(api.fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/calendar\/seed-midwife/),
      expect.objectContaining({ method: "PATCH" }),
    );

    await user.click(screen.getByRole("button", { name: /delete midwife follow-up/i }));
    const dialog = screen.getByRole("dialog", { name: /remove this event/i });
    await user.click(within(dialog).getByRole("button", { name: /remove/i }));

    expect(await screen.findByText("Thailand trip")).toBeInTheDocument();
    expect(screen.queryAllByText("Midwife follow-up")).toHaveLength(0);
    expect(api.fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/calendar\/seed-midwife/),
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("shows cached events and an error when the API is offline", async () => {
    saveEvents(SEED_EVENTS);
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

    render(<CoupleCalendar today="2026-09-21" />);

    expect(await screen.findByText("Thailand trip")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(/offline/i);

    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      get: () => true,
    });
  });

  it("opens October when focused on the Thailand start date", async () => {
    stubCalendarApi(SEED_EVENTS);
    render(<CoupleCalendar today="2026-09-21" focusDate="2026-10-06" />);

    expect(await screen.findByRole("heading", { name: /october 2026/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "6 October 2026" })).toHaveAttribute("aria-pressed", "true");
  });
});
