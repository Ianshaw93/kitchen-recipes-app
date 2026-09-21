import { parseCalendarEventDraft } from "@/lib/calendar";
import { calendarJson, runCalendarRoute } from "@/lib/calendar-http";
import { createSharedEvent, listSharedEvents } from "@/lib/calendar-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  return runCalendarRoute(request, async () => {
    const events = await listSharedEvents();
    return calendarJson({ events });
  });
}

export async function POST(request: Request): Promise<Response> {
  return runCalendarRoute(request, async () => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return calendarJson({ error: "Invalid event" }, 400);
    }

    const draft = parseCalendarEventDraft(body);
    if (!draft) {
      return calendarJson({ error: "Invalid event" }, 400);
    }

    const { event } = await createSharedEvent(draft);
    return calendarJson({ event }, 201);
  });
}
