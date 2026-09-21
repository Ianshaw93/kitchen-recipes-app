import { afterEach, describe, expect, it, vi } from "vitest";
import { CALENDAR_KV_KEY, SEED_EVENTS } from "./calendar";
import {
  CalendarStoreUnavailableError,
  createCalendarRedisStore,
  createMemoryStore,
  createSharedEvent,
  deleteSharedEvent,
  getDefaultStore,
  listSharedEvents,
  resetDefaultStoreForTests,
  updateSharedEvent,
  type CalendarKv,
} from "./calendar-store";
import { readRedisEnv } from "./payments-store";

describe("calendar store", () => {
  afterEach(() => {
    resetDefaultStoreForTests();
    vi.unstubAllEnvs();
  });

  it("seeds Thailand and the midwife placeholder on the first empty store", async () => {
    const store = createMemoryStore();
    const events = await listSharedEvents(store);

    expect(events.map((event) => event.title)).toEqual(["Midwife appointment", "Thailand trip"]);
    expect(events).toHaveLength(SEED_EVENTS.length);
    expect(events.find((event) => event.title === "Thailand trip")?.endDate).toBe("2026-10-18");
  });

  it("does not re-seed after the calendar is cleared", async () => {
    const store = createMemoryStore();
    const seeded = await listSharedEvents(store);

    for (const event of seeded) {
      await deleteSharedEvent(event.id, store);
    }

    expect(await listSharedEvents(store)).toEqual([]);
  });

  it("adds, updates, and deletes an event", async () => {
    const store = createMemoryStore();
    await listSharedEvents(store);

    const { event, created } = await createSharedEvent(
      {
        title: "Date night",
        startDate: "2026-09-25",
        allDay: false,
        startTime: "19:00",
        who: "Both",
      },
      store,
    );

    expect(created).toBe(true);
    expect(event.title).toBe("Date night");

    const updated = await updateSharedEvent(
      event.id,
      {
        title: "Date night at home",
        startDate: "2026-09-25",
        allDay: true,
        who: "Avery",
      },
      store,
    );
    expect(updated?.title).toBe("Date night at home");
    expect(updated?.who).toBe("Avery");

    expect(await deleteSharedEvent(event.id, store)).toBe(true);
    expect((await listSharedEvents(store)).some((item) => item.id === event.id)).toBe(false);
  });

  it("reads Redis env from Upstash or legacy KV names", () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://upstash.example");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "upstash-token");
    expect(readRedisEnv()).toEqual({
      url: "https://upstash.example",
      token: "upstash-token",
    });
  });

  it("writes through a Redis-shaped client on a separate key from payments", async () => {
    const map = new Map<string, unknown>();
    const client: CalendarKv = {
      get: async (key) => map.get(key) ?? null,
      set: async (key, value, opts) => {
        if (opts?.nx && map.has(key)) {
          return null;
        }
        map.set(key, value);
        return "OK";
      },
    };

    const store = createCalendarRedisStore(client);
    const events = await listSharedEvents(store);
    expect(events.map((event) => event.title)).toContain("Thailand trip");
    expect([...map.keys()]).toEqual([CALENDAR_KV_KEY]);
    expect(CALENDAR_KV_KEY).toBe("kusina:calendar:v1");
  });

  it("throws in production when Redis env is missing", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    vi.stubEnv("KV_REST_API_URL", "");
    vi.stubEnv("KV_REST_API_TOKEN", "");
    resetDefaultStoreForTests();

    expect(() => getDefaultStore()).toThrow(CalendarStoreUnavailableError);
  });
});
