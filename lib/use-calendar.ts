"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  addEvent,
  deleteEvent,
  loadEvents,
  saveEvents,
  updateEvent,
  type CalendarEvent,
  type CalendarEventDraft,
} from "./calendar";
import {
  CalendarApiError,
  deleteSharedEventRequest,
  fetchSharedEvents,
  patchSharedEvent,
  postSharedEvent,
} from "./calendar-client";

export type CalendarSyncStatus = "loading" | "ready" | "error";

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof CalendarApiError) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export function useCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [status, setStatus] = useState<CalendarSyncStatus>("loading");
  const loadPromiseRef = useRef<Promise<CalendarEvent[]>>(Promise.resolve([]));
  const eventsRef = useRef<CalendarEvent[]>([]);

  const replaceEvents = useCallback((next: CalendarEvent[]) => {
    eventsRef.current = next;
    setEvents(next);
    saveEvents(next);
  }, []);

  useEffect(() => {
    const pending = fetchSharedEvents()
      .then((remote) => {
        replaceEvents(remote);
        setSyncError(null);
        setStatus("ready");
        setHydrated(true);
        return remote;
      })
      .catch((error: unknown) => {
        const cached = loadEvents();
        if (cached.length > 0) {
          eventsRef.current = cached;
          setEvents(cached);
        }
        setSyncError(errorMessage(error, "Couldn't load the shared calendar."));
        setStatus("error");
        setHydrated(true);
        return cached;
      });

    loadPromiseRef.current = pending;
  }, [replaceEvents]);

  const add = useCallback(
    async (draft: CalendarEventDraft): Promise<boolean> => {
      await loadPromiseRef.current;
      const previous = eventsRef.current;
      replaceEvents(addEvent(previous, draft));
      setSyncError(null);

      try {
        await postSharedEvent(draft);
        const remote = await fetchSharedEvents();
        replaceEvents(remote);
        setStatus("ready");
        return true;
      } catch (error) {
        replaceEvents(previous);
        setSyncError(errorMessage(error, "Couldn't save that event."));
        setStatus("error");
        return false;
      }
    },
    [replaceEvents],
  );

  const update = useCallback(
    async (id: string, draft: CalendarEventDraft): Promise<boolean> => {
      await loadPromiseRef.current;
      const previous = eventsRef.current;
      replaceEvents(updateEvent(previous, id, draft));
      setSyncError(null);

      try {
        await patchSharedEvent(id, draft);
        const remote = await fetchSharedEvents();
        replaceEvents(remote);
        setStatus("ready");
        return true;
      } catch (error) {
        replaceEvents(previous);
        setSyncError(errorMessage(error, "Couldn't update that event."));
        setStatus("error");
        return false;
      }
    },
    [replaceEvents],
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      await loadPromiseRef.current;
      const previous = eventsRef.current;
      replaceEvents(deleteEvent(previous, id));
      setSyncError(null);

      try {
        await deleteSharedEventRequest(id);
        const remote = await fetchSharedEvents();
        replaceEvents(remote);
        setStatus("ready");
        return true;
      } catch (error) {
        replaceEvents(previous);
        setSyncError(errorMessage(error, "Couldn't remove that event."));
        setStatus("error");
        return false;
      }
    },
    [replaceEvents],
  );

  return { events, add, update, remove, hydrated, syncError, status };
}
