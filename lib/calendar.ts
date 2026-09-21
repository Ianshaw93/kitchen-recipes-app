export const CALENDAR_STORAGE_KEY = "kusina:calendar:v1";
export const CALENDAR_KV_KEY = CALENDAR_STORAGE_KEY;

export const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export type CalendarWho = "Ian" | "Avery" | "Both";

export type CalendarEvent = {
  id: string;
  title: string;
  startDate: string;
  endDate?: string;
  allDay: boolean;
  startTime?: string;
  note?: string;
  who: CalendarWho;
  createdAt: string;
};

export type CalendarEventDraft = {
  title: string;
  startDate: string;
  endDate?: string;
  allDay: boolean;
  startTime?: string;
  note?: string;
  who: CalendarWho;
};

export type CalendarDocument = {
  version: 1;
  events: CalendarEvent[];
};

export type CalendarDayCell = {
  iso: string;
  day: number;
  inMonth: boolean;
};

export type CalendarMonth = {
  year: number;
  month: number;
  title: string;
  cells: CalendarDayCell[];
};

export const SEED_EVENTS: CalendarEvent[] = [
  {
    id: "seed-thailand-trip-2026-10",
    title: "Thailand trip",
    startDate: "2026-10-06",
    endDate: "2026-10-18",
    allDay: true,
    who: "Both",
    note: "Shared dates — edit if plans shift.",
    createdAt: "2026-09-21T12:00:00.000Z",
  },
  {
    id: "seed-midwife-appointment-2026-09-28",
    title: "Midwife appointment",
    startDate: "2026-09-28",
    allDay: false,
    startTime: "10:30",
    who: "Both",
    note: "Placeholder — delete if the date is wrong.",
    createdAt: "2026-09-21T12:00:00.000Z",
  },
];

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ISO_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function isWho(value: unknown): value is CalendarWho {
  return value === "Ian" || value === "Avery" || value === "Both";
}

function isValidTime(value: unknown): value is string {
  return typeof value === "string" && ISO_TIME_PATTERN.test(value);
}

function isValidDate(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_DATE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function isValidEvent(value: unknown): value is CalendarEvent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const event = value as Partial<CalendarEvent>;
  if (typeof event.id !== "string" || event.id.length === 0) {
    return false;
  }
  if (typeof event.title !== "string" || event.title.trim().length === 0) {
    return false;
  }
  if (!isValidDate(event.startDate)) {
    return false;
  }
  if (event.endDate !== undefined && !isValidDate(event.endDate)) {
    return false;
  }
  if (event.endDate && event.endDate < event.startDate) {
    return false;
  }
  if (typeof event.allDay !== "boolean") {
    return false;
  }
  if (event.startTime !== undefined && !isValidTime(event.startTime)) {
    return false;
  }
  if (event.note !== undefined && typeof event.note !== "string") {
    return false;
  }
  if (!isWho(event.who)) {
    return false;
  }
  if (typeof event.createdAt !== "string" || event.createdAt.length === 0) {
    return false;
  }

  return true;
}

function isValidEvents(value: unknown): value is CalendarEvent[] {
  return Array.isArray(value) && value.every(isValidEvent);
}

export function parseCalendarEvents(value: unknown): CalendarEvent[] | null {
  if (!isValidEvents(value)) {
    return null;
  }

  return sortSoonestFirst(value);
}

export function parseCalendarEventDraft(value: unknown): CalendarEventDraft | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const draft = value as Partial<CalendarEventDraft>;
  if (typeof draft.title !== "string" || draft.title.trim().length === 0) {
    return null;
  }
  if (!isValidDate(draft.startDate)) {
    return null;
  }
  if (draft.endDate !== undefined && draft.endDate !== "" && !isValidDate(draft.endDate)) {
    return null;
  }
  if (draft.endDate && draft.endDate < draft.startDate) {
    return null;
  }
  if (typeof draft.allDay !== "boolean") {
    return null;
  }
  if (draft.startTime !== undefined && draft.startTime !== "" && !isValidTime(draft.startTime)) {
    return null;
  }
  if (draft.note !== undefined && typeof draft.note !== "string") {
    return null;
  }
  if (!isWho(draft.who)) {
    return null;
  }

  const parsed: CalendarEventDraft = {
    title: draft.title.trim(),
    startDate: draft.startDate,
    allDay: draft.allDay,
    who: draft.who,
  };

  if (draft.endDate && draft.endDate !== draft.startDate) {
    parsed.endDate = draft.endDate;
  }

  if (!draft.allDay && draft.startTime) {
    parsed.startTime = draft.startTime;
  }

  const note = draft.note?.trim();
  if (note) {
    parsed.note = note;
  }

  return parsed;
}

export function parseCalendarDocument(value: unknown): CalendarDocument | null {
  if (value == null) {
    return null;
  }

  if (Array.isArray(value)) {
    const events = parseCalendarEvents(value);
    return events ? { version: 1, events } : null;
  }

  if (typeof value !== "object") {
    return null;
  }

  const doc = value as Partial<CalendarDocument>;
  if (doc.version !== 1) {
    return null;
  }

  const events = parseCalendarEvents(doc.events);
  if (!events) {
    return null;
  }

  return { version: 1, events };
}

export function calendarDocument(events: CalendarEvent[]): CalendarDocument {
  return { version: 1, events: sortSoonestFirst(events) };
}

export function sortSoonestFirst(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((left, right) => {
    if (left.startDate !== right.startDate) {
      return left.startDate < right.startDate ? -1 : 1;
    }

    const leftTime = left.allDay || !left.startTime ? "00:00" : left.startTime;
    const rightTime = right.allDay || !right.startTime ? "00:00" : right.startTime;
    if (leftTime !== rightTime) {
      return leftTime < rightTime ? -1 : 1;
    }

    if (left.title !== right.title) {
      return left.title < right.title ? -1 : 1;
    }

    return left.id < right.id ? -1 : 1;
  });
}

export function eventFromDraft(
  draft: CalendarEventDraft,
  id: string,
  createdAt: string,
): CalendarEvent {
  const event: CalendarEvent = {
    id,
    title: draft.title.trim(),
    startDate: draft.startDate,
    allDay: draft.allDay,
    who: draft.who,
    createdAt,
  };

  if (draft.endDate && draft.endDate !== draft.startDate) {
    event.endDate = draft.endDate;
  }

  if (!draft.allDay && draft.startTime) {
    event.startTime = draft.startTime;
  }

  const note = draft.note?.trim();
  if (note) {
    event.note = note;
  }

  return event;
}

export function addEvent(events: CalendarEvent[], draft: CalendarEventDraft): CalendarEvent[] {
  const event = eventFromDraft(draft, crypto.randomUUID(), new Date().toISOString());
  return sortSoonestFirst([event, ...events]);
}

export function updateEvent(
  events: CalendarEvent[],
  id: string,
  draft: CalendarEventDraft,
): CalendarEvent[] {
  return sortSoonestFirst(
    events.map((event) => (event.id === id ? eventFromDraft(draft, event.id, event.createdAt) : event)),
  );
}

export function deleteEvent(events: CalendarEvent[], id: string): CalendarEvent[] {
  return events.filter((event) => event.id !== id);
}

export function loadEvents(): CalendarEvent[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(CALENDAR_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isValidEvents(parsed)) {
      return [];
    }

    return sortSoonestFirst(parsed);
  } catch {
    return [];
  }
}

export function saveEvents(events: CalendarEvent[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(sortSoonestFirst(events)));
  } catch {
    // Ignore quota / private mode.
  }
}

export function todayISODate(): string {
  return toISODate(new Date());
}

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseISODate(iso: string): { year: number; month: number; day: number } | null {
  if (!isValidDate(iso)) {
    return null;
  }

  const [year, month, day] = iso.split("-").map(Number);
  return { year, month, day };
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export function calendarMonth(year: number, month: number): CalendarMonth {
  const first = new Date(year, month - 1, 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(year, month - 1, 1 - mondayOffset);
  const cells: CalendarDayCell[] = [];

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
    cells.push({
      iso: toISODate(date),
      day: date.getDate(),
      inMonth: date.getMonth() === month - 1,
    });
  }

  return {
    year,
    month,
    title: first.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
    cells,
  };
}

export function eventEndDate(event: Pick<CalendarEvent, "startDate" | "endDate">): string {
  return event.endDate ?? event.startDate;
}

export function eventCoversDate(event: Pick<CalendarEvent, "startDate" | "endDate">, iso: string): boolean {
  return event.startDate <= iso && eventEndDate(event) >= iso;
}

export function eventsOnDate(events: CalendarEvent[], iso: string): CalendarEvent[] {
  return sortSoonestFirst(events.filter((event) => eventCoversDate(event, iso)));
}

export function upcomingEvents(events: CalendarEvent[], today: string): CalendarEvent[] {
  return sortSoonestFirst(events.filter((event) => eventEndDate(event) >= today));
}

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatShortDate(iso: string): { day: number; month: string; year: number } {
  const parsed = parseISODate(iso) ?? { year: 0, month: 1, day: 0 };
  return {
    day: parsed.day,
    month: SHORT_MONTHS[parsed.month - 1] ?? "",
    year: parsed.year,
  };
}

export function formatEventWhen(event: CalendarEvent): string {
  const start = formatShortDate(event.startDate);
  const endIso = eventEndDate(event);
  let when = `${start.day} ${start.month} ${start.year}`;

  if (endIso !== event.startDate) {
    const end = formatShortDate(endIso);
    if (start.month === end.month && start.year === end.year) {
      when = `${start.day}–${end.day} ${start.month} ${start.year}`;
    } else if (start.year === end.year) {
      when = `${start.day} ${start.month} – ${end.day} ${end.month} ${start.year}`;
    } else {
      when = `${start.day} ${start.month} ${start.year} – ${end.day} ${end.month} ${end.year}`;
    }
  }

  if (!event.allDay && event.startTime) {
    return `${when} · ${event.startTime}`;
  }

  return when;
}

export function formatDayLabel(iso: string): string {
  const parsed = parseISODate(iso);
  if (!parsed) {
    return iso;
  }

  return new Date(parsed.year, parsed.month - 1, parsed.day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
