import { parseCalendarEventDraft } from "@/lib/calendar";
import { calendarJson, runCalendarRoute } from "@/lib/calendar-http";
import { deleteSharedEvent, updateSharedEvent } from "@/lib/calendar-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  return runCalendarRoute(request, async () => {
    const { id } = await context.params;
    if (!id) {
      return calendarJson({ error: "Missing event id" }, 400);
    }

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

    const event = await updateSharedEvent(id, draft);
    if (!event) {
      return calendarJson({ error: "Not found" }, 404);
    }

    return calendarJson({ event });
  });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  return runCalendarRoute(request, async () => {
    const { id } = await context.params;
    if (!id) {
      return calendarJson({ error: "Missing event id" }, 400);
    }

    const deleted = await deleteSharedEvent(id);
    if (!deleted) {
      return calendarJson({ error: "Not found" }, 404);
    }

    return calendarJson({ ok: true });
  });
}
