import { parseCalendarEvents, type CalendarEvent, type CalendarEventDraft } from "./calendar";
import { paymentsRequestHeaders } from "./payments-client";

export class CalendarApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly offline = false,
  ) {
    super(message);
    this.name = "CalendarApiError";
  }
}

function isOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

function networkError(generic: string): CalendarApiError {
  return new CalendarApiError(
    isOffline() ? "You're offline. The shared calendar can't update." : generic,
    undefined,
    isOffline(),
  );
}

async function errorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data: unknown = await response.json();
    if (data && typeof data === "object" && "error" in data) {
      const message = (data as { error: unknown }).error;
      if (typeof message === "string" && message.trim()) {
        return message;
      }
    }
  } catch {
    // Ignore non-JSON error bodies.
  }

  if (response.status === 401) {
    return "Shared calendar token was rejected.";
  }

  return fallback;
}

async function readJson(response: Response): Promise<unknown> {
  return response.json();
}

function readEvent(data: unknown): CalendarEvent | null {
  const rawEvent =
    data && typeof data === "object" && "event" in data ? (data as { event: unknown }).event : null;
  return parseCalendarEvents(rawEvent ? [rawEvent] : null)?.[0] ?? null;
}

export async function fetchSharedEvents(): Promise<CalendarEvent[]> {
  let response: Response;
  try {
    response = await fetch("/api/calendar", {
      headers: paymentsRequestHeaders(),
      cache: "no-store",
    });
  } catch {
    throw networkError("Couldn't reach the shared calendar.");
  }

  if (!response.ok) {
    throw new CalendarApiError(
      await errorMessage(response, "Couldn't load the shared calendar."),
      response.status,
      false,
    );
  }

  const data = await readJson(response);
  const rawEvents =
    data && typeof data === "object" && "events" in data ? (data as { events: unknown }).events : null;
  const events = parseCalendarEvents(rawEvents);
  if (!events) {
    throw new CalendarApiError("Shared calendar returned invalid data.");
  }

  return events;
}

export async function postSharedEvent(draft: CalendarEventDraft): Promise<CalendarEvent> {
  let response: Response;
  try {
    response = await fetch("/api/calendar", {
      method: "POST",
      headers: paymentsRequestHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(draft),
      cache: "no-store",
    });
  } catch {
    throw networkError("Couldn't save that event.");
  }

  if (!response.ok) {
    throw new CalendarApiError(await errorMessage(response, "Couldn't save that event."), response.status);
  }

  const event = readEvent(await readJson(response));
  if (!event) {
    throw new CalendarApiError("Shared calendar returned invalid data.");
  }

  return event;
}

export async function patchSharedEvent(id: string, draft: CalendarEventDraft): Promise<CalendarEvent> {
  let response: Response;
  try {
    response = await fetch(`/api/calendar/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: paymentsRequestHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(draft),
      cache: "no-store",
    });
  } catch {
    throw networkError("Couldn't update that event.");
  }

  if (!response.ok) {
    throw new CalendarApiError(await errorMessage(response, "Couldn't update that event."), response.status);
  }

  const event = readEvent(await readJson(response));
  if (!event) {
    throw new CalendarApiError("Shared calendar returned invalid data.");
  }

  return event;
}

export async function deleteSharedEventRequest(id: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`/api/calendar/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: paymentsRequestHeaders(),
      cache: "no-store",
    });
  } catch {
    throw networkError("Couldn't remove that event.");
  }

  if (!response.ok && response.status !== 404) {
    throw new CalendarApiError(await errorMessage(response, "Couldn't remove that event."), response.status);
  }
}
