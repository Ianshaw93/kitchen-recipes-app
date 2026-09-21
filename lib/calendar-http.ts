import { CalendarStoreUnavailableError } from "@/lib/calendar-store";
import { isPaymentsAuthorized } from "@/lib/payments-auth";

const NO_STORE = { "Cache-Control": "no-store" };

export function calendarJson(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: NO_STORE });
}

export async function runCalendarRoute(
  request: Request,
  run: () => Promise<Response>,
): Promise<Response> {
  if (!isPaymentsAuthorized(request)) {
    return calendarJson({ error: "Unauthorized" }, 401);
  }

  try {
    return await run();
  } catch (error) {
    if (error instanceof CalendarStoreUnavailableError) {
      return calendarJson({ error: error.message }, 503);
    }

    return calendarJson({ error: "Couldn't update the shared calendar." }, 500);
  }
}
