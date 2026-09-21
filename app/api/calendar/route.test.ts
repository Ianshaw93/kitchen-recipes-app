import { afterEach, describe, expect, it, vi } from "vitest";
import { DELETE, PATCH } from "@/app/api/calendar/[id]/route";
import { GET, POST } from "@/app/api/calendar/route";
import { SEED_EVENTS } from "@/lib/calendar";
import { createMemoryStore, resetDefaultStoreForTests, setCalendarStoreForTests } from "@/lib/calendar-store";

function request(path = "http://localhost/api/calendar", init?: RequestInit): Request {
  return new Request(path, init);
}

describe("calendar API routes", () => {
  afterEach(() => {
    resetDefaultStoreForTests();
    vi.unstubAllEnvs();
  });

  it("GET seeds Thailand and the midwife placeholder on an empty store", async () => {
    setCalendarStoreForTests(createMemoryStore());

    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");

    const body = (await response.json()) as { events: typeof SEED_EVENTS };
    expect(body.events.map((event) => event.title)).toEqual(["Midwife appointment", "Thailand trip"]);
    expect(body.events).toHaveLength(2);
    expect(body.events.find((event) => event.title === "Thailand trip")?.startDate).toBe("2026-10-06");
    expect(body.events.find((event) => event.title === "Midwife appointment")?.startTime).toBe("10:30");
  });

  it("POST adds an event that GET then returns", async () => {
    setCalendarStoreForTests(createMemoryStore());
    await GET(request());

    const created = await POST(
      request("http://localhost/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Date night",
          startDate: "2026-09-25",
          allDay: true,
          who: "Both",
        }),
      }),
    );

    expect(created.status).toBe(201);
    const listed = await GET(request());
    const body = (await listed.json()) as { events: Array<{ title: string }> };
    expect(body.events.map((event) => event.title)).toContain("Date night");
  });

  it("rejects invalid POST bodies", async () => {
    setCalendarStoreForTests(createMemoryStore());
    const response = await POST(
      request("http://localhost/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "nope" }),
      }),
    );
    expect(response.status).toBe(400);
  });

  it("PATCH updates and DELETE removes a seeded event", async () => {
    setCalendarStoreForTests(createMemoryStore());
    const listed = await GET(request());
    const body = (await listed.json()) as { events: Array<{ id: string; title: string }> };
    const midwife = body.events.find((event) => event.title === "Midwife appointment");
    expect(midwife).toBeDefined();

    const updated = await PATCH(
      request(`http://localhost/api/calendar/${midwife!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Midwife follow-up",
          startDate: "2026-09-28",
          allDay: false,
          startTime: "11:00",
          who: "Ian",
        }),
      }),
      { params: Promise.resolve({ id: midwife!.id }) },
    );
    expect(updated.status).toBe(200);
    const afterPatch = (await (await GET(request())).json()) as { events: Array<{ title: string }> };
    expect(afterPatch.events.map((event) => event.title)).toContain("Midwife follow-up");

    const deleted = await DELETE(request(`http://localhost/api/calendar/${midwife!.id}`), {
      params: Promise.resolve({ id: midwife!.id }),
    });
    expect(deleted.status).toBe(200);

    const after = await GET(request());
    const remaining = (await after.json()) as { events: Array<{ title: string }> };
    expect(remaining.events.map((event) => event.title)).toEqual(["Thailand trip"]);
  });

  it("returns 401 when the household token does not match", async () => {
    vi.stubEnv("PAYMENTS_HOUSEHOLD_TOKEN", "household-secret");
    setCalendarStoreForTests(createMemoryStore());

    const response = await GET(request());
    expect(response.status).toBe(401);

    const allowed = await GET(
      request("http://localhost/api/calendar", {
        headers: { Authorization: "Bearer household-secret" },
      }),
    );
    expect(allowed.status).toBe(200);
  });
});
