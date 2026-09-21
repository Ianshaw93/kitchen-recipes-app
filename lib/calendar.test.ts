import { describe, expect, it } from "vitest";
import {
  CALENDAR_STORAGE_KEY,
  SEED_EVENTS,
  WEEKDAY_LABELS,
  addEvent,
  calendarMonth,
  deleteEvent,
  eventCoversDate,
  eventsOnDate,
  formatEventWhen,
  loadEvents,
  parseCalendarDocument,
  parseCalendarEventDraft,
  saveEvents,
  shiftMonth,
  upcomingEvents,
  updateEvent,
} from "./calendar";

const dinner = {
  title: "Date night",
  startDate: "2026-09-25",
  allDay: false,
  startTime: "19:00",
  who: "Both" as const,
  note: "Somewhere walkable",
};

describe("calendar storage", () => {
  it("loads an empty list when nothing is stored", () => {
    expect(window.localStorage.getItem(CALENDAR_STORAGE_KEY)).toBeNull();
    expect(loadEvents()).toEqual([]);
  });

  it("saves events and loads them back", () => {
    const events = addEvent([], dinner);
    saveEvents(events);

    expect(loadEvents()).toEqual(events);
    expect(JSON.parse(window.localStorage.getItem(CALENDAR_STORAGE_KEY) ?? "null")).toEqual(events);
  });

  it("falls back to an empty list when stored data is invalid", () => {
    window.localStorage.setItem(CALENDAR_STORAGE_KEY, "{not-json");
    expect(loadEvents()).toEqual([]);

    window.localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify([{ title: "nope" }]));
    expect(loadEvents()).toEqual([]);
  });
});

describe("seeded couple events", () => {
  it("includes the Thailand trip and a midwife placeholder", () => {
    expect(SEED_EVENTS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "seed-thailand-trip-2026-10",
          title: "Thailand trip",
          startDate: "2026-10-06",
          endDate: "2026-10-18",
          allDay: true,
          who: "Both",
        }),
        expect.objectContaining({
          title: "Midwife appointment",
          startDate: "2026-09-28",
          allDay: false,
          startTime: "10:30",
          who: "Both",
        }),
      ]),
    );
  });
});

describe("add, update, and delete events", () => {
  it("adds an event with a generated id and keeps soonest first", () => {
    const first = addEvent([], dinner);
    const next = addEvent(first, {
      title: "Market shop",
      startDate: "2026-09-22",
      allDay: true,
      who: "Ian",
    });

    expect(next).toHaveLength(2);
    expect(next[0]?.title).toBe("Market shop");
    expect(next[0]?.who).toBe("Ian");
    expect(next[0]?.allDay).toBe(true);
    expect(next[0]?.id).toEqual(expect.any(String));
    expect(next[0]?.id).not.toBe(next[1]?.id);
    expect(next[1]?.title).toBe("Date night");
  });

  it("updates an event by id", () => {
    const events = addEvent([], dinner);
    const id = events[0]!.id;
    const updated = updateEvent(events, id, {
      title: "Date night at home",
      startDate: "2026-09-25",
      allDay: true,
      who: "Avery",
    });

    expect(updated[0]?.title).toBe("Date night at home");
    expect(updated[0]?.allDay).toBe(true);
    expect(updated[0]?.who).toBe("Avery");
    expect(updated[0]?.startTime).toBeUndefined();
    expect(updated[0]?.id).toBe(id);
  });

  it("deletes an event by id", () => {
    const events = addEvent([], dinner);
    const id = events[0]?.id;
    expect(id).toBeDefined();
    expect(deleteEvent(events, id ?? "")).toEqual([]);
    expect(deleteEvent(events, "missing")).toEqual(events);
  });
});

describe("calendar draft and document parsing", () => {
  it("parses a valid draft and rejects junk", () => {
    expect(
      parseCalendarEventDraft({
        title: "  Thailand trip ",
        startDate: "2026-10-06",
        endDate: "2026-10-18",
        allDay: true,
        who: "Both",
        note: " flights booked ",
      }),
    ).toEqual({
      title: "Thailand trip",
      startDate: "2026-10-06",
      endDate: "2026-10-18",
      allDay: true,
      who: "Both",
      note: "flights booked",
    });

    expect(
      parseCalendarEventDraft({
        title: "Scan",
        startDate: "2026-09-28",
        allDay: false,
        startTime: "10:30",
        who: "Ian",
      }),
    ).toEqual({
      title: "Scan",
      startDate: "2026-09-28",
      allDay: false,
      startTime: "10:30",
      who: "Ian",
    });

    expect(parseCalendarEventDraft({ title: "x", startDate: "28-09-2026", allDay: true, who: "Both" })).toBeNull();
    expect(parseCalendarEventDraft({ title: "  ", startDate: "2026-09-28", allDay: true, who: "Both" })).toBeNull();
    expect(parseCalendarEventDraft({ title: "x", startDate: "2026-09-28", endDate: "2026-09-20", allDay: true, who: "Both" })).toBeNull();
    expect(parseCalendarEventDraft({ title: "x", startDate: "2026-09-28", allDay: false, startTime: "25:00", who: "Both" })).toBeNull();
    expect(parseCalendarEventDraft({ title: "x", startDate: "2026-09-28", allDay: true, who: "Abby" })).toBeNull();
    expect(parseCalendarEventDraft(null)).toBeNull();
  });

  it("parses a versioned document and a raw event array", () => {
    const events = addEvent([], dinner);

    expect(parseCalendarDocument({ version: 1, events })).toEqual({
      version: 1,
      events,
    });
    expect(parseCalendarDocument(events)?.events).toEqual(events);
    expect(parseCalendarDocument(null)).toBeNull();
    expect(parseCalendarDocument({ version: 1, events: [{ nope: true }] })).toBeNull();
  });
});

describe("month grid and upcoming list", () => {
  it("builds a Monday-first month grid for October 2026", () => {
    expect(WEEKDAY_LABELS).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);

    const october = calendarMonth(2026, 10);
    expect(october.title).toBe("October 2026");
    expect(october.cells).toHaveLength(42);
    expect(october.cells[0]).toEqual({ iso: "2026-09-28", day: 28, inMonth: false });
    expect(october.cells.find((cell) => cell.iso === "2026-10-06")).toEqual({
      iso: "2026-10-06",
      day: 6,
      inMonth: true,
    });
    expect(shiftMonth(2026, 10, -1)).toEqual({ year: 2026, month: 9 });
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
  });

  it("finds multi-day events on every covered date", () => {
    const thailand = SEED_EVENTS.find((event) => event.title === "Thailand trip")!;
    expect(eventCoversDate(thailand, "2026-10-06")).toBe(true);
    expect(eventCoversDate(thailand, "2026-10-12")).toBe(true);
    expect(eventCoversDate(thailand, "2026-10-18")).toBe(true);
    expect(eventCoversDate(thailand, "2026-10-05")).toBe(false);
    expect(eventsOnDate(SEED_EVENTS, "2026-09-28")[0]?.title).toBe("Midwife appointment");
  });

  it("lists current and upcoming events from a given day", () => {
    const listed = upcomingEvents(SEED_EVENTS, "2026-09-21");
    expect(listed.map((event) => event.title)).toEqual(["Midwife appointment", "Thailand trip"]);
    expect(upcomingEvents(SEED_EVENTS, "2026-10-10").map((event) => event.title)).toEqual(["Thailand trip"]);
    expect(upcomingEvents(SEED_EVENTS, "2026-10-19")).toEqual([]);
  });

  it("formats all-day ranges and timed events", () => {
    const thailand = SEED_EVENTS.find((event) => event.title === "Thailand trip")!;
    const midwife = SEED_EVENTS.find((event) => event.title === "Midwife appointment")!;
    expect(formatEventWhen(thailand)).toBe("6–18 Oct 2026");
    expect(formatEventWhen(midwife)).toBe("28 Sep 2026 · 10:30");
    expect(formatEventWhen(addEvent([], dinner)[0]!)).toBe("25 Sep 2026 · 19:00");
  });
});
