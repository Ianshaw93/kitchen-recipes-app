import { Redis } from "@upstash/redis";
import {
  CALENDAR_KV_KEY,
  SEED_EVENTS,
  addEvent,
  calendarDocument,
  deleteEvent,
  parseCalendarDocument,
  sortSoonestFirst,
  updateEvent,
  type CalendarDocument,
  type CalendarEvent,
  type CalendarEventDraft,
} from "./calendar";
import { readRedisEnv } from "./payments-store";

export type CalendarStore = {
  read(): Promise<unknown>;
  write(value: CalendarDocument, options?: { nx?: boolean }): Promise<boolean>;
};

export type CalendarKv = {
  get: (key: string) => Promise<unknown>;
  set: (
    key: string,
    value: unknown,
    opts?: { nx?: boolean },
  ) => Promise<"OK" | null>;
};

export class CalendarStoreUnavailableError extends Error {
  constructor(
    message = "Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_URL and KV_REST_API_TOKEN) so the calendar can be shared.",
  ) {
    super(message);
    this.name = "CalendarStoreUnavailableError";
  }
}

let testOverride: CalendarStore | null = null;
let memorySingleton: CalendarStore | null = null;
let redisSingleton: CalendarStore | null = null;

export function createMemoryStore(initial: unknown = null): CalendarStore {
  let value: unknown = initial;
  return {
    async read() {
      return value;
    },
    async write(next, options) {
      if (options?.nx && value != null) {
        return false;
      }
      value = next;
      return true;
    },
  };
}

export function createCalendarRedisStore(client: CalendarKv): CalendarStore {
  return {
    async read() {
      return client.get(CALENDAR_KV_KEY);
    },
    async write(next, options) {
      const result = await client.set(
        CALENDAR_KV_KEY,
        next,
        options?.nx ? { nx: true } : undefined,
      );
      return result === "OK";
    },
  };
}

export function setCalendarStoreForTests(store: CalendarStore | null): void {
  testOverride = store;
}

export function resetDefaultStoreForTests(): void {
  testOverride = null;
  memorySingleton = createMemoryStore();
  redisSingleton = null;
}

function getMemorySingleton(): CalendarStore {
  if (!memorySingleton) {
    memorySingleton = createMemoryStore();
  }
  return memorySingleton;
}

function getRedisStoreSingleton(env: { url: string; token: string }): CalendarStore {
  if (!redisSingleton) {
    const redis = new Redis({ url: env.url, token: env.token });
    redisSingleton = createCalendarRedisStore({
      get: (key) => redis.get(key),
      set: async (key, value, opts) => {
        const result = opts?.nx
          ? await redis.set(key, value, { nx: true })
          : await redis.set(key, value);
        return result === "OK" ? "OK" : null;
      },
    });
  }
  return redisSingleton;
}

export function getDefaultStore(): CalendarStore {
  if (testOverride) {
    return testOverride;
  }

  const redisEnv = readRedisEnv();
  if (redisEnv) {
    return getRedisStoreSingleton(redisEnv);
  }

  if (process.env.NODE_ENV === "production") {
    throw new CalendarStoreUnavailableError();
  }

  return getMemorySingleton();
}

export async function listSharedEvents(
  store: CalendarStore = getDefaultStore(),
): Promise<CalendarEvent[]> {
  const existing = parseCalendarDocument(await store.read());
  if (existing) {
    return sortSoonestFirst(existing.events);
  }

  const seeded = calendarDocument(SEED_EVENTS);
  const wrote = await store.write(seeded, { nx: true });
  if (!wrote) {
    const raced = parseCalendarDocument(await store.read());
    return sortSoonestFirst(raced?.events ?? SEED_EVENTS);
  }

  return sortSoonestFirst(SEED_EVENTS);
}

export async function createSharedEvent(
  draft: CalendarEventDraft,
  store: CalendarStore = getDefaultStore(),
): Promise<{ event: CalendarEvent; created: boolean }> {
  const events = await listSharedEvents(store);
  const next = addEvent(events, draft);
  await store.write(calendarDocument(next));
  const created = next.find((event) => !events.some((existing) => existing.id === event.id));
  return { event: created ?? next[0]!, created: true };
}

export async function updateSharedEvent(
  id: string,
  draft: CalendarEventDraft,
  store: CalendarStore = getDefaultStore(),
): Promise<CalendarEvent | null> {
  const events = await listSharedEvents(store);
  if (!events.some((event) => event.id === id)) {
    return null;
  }

  const next = updateEvent(events, id, draft);
  await store.write(calendarDocument(next));
  return next.find((event) => event.id === id) ?? null;
}

export async function deleteSharedEvent(
  id: string,
  store: CalendarStore = getDefaultStore(),
): Promise<boolean> {
  const events = await listSharedEvents(store);
  if (!events.some((event) => event.id === id)) {
    return false;
  }

  await store.write(calendarDocument(deleteEvent(events, id)));
  return true;
}
