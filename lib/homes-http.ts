import { HomesStoreUnavailableError } from "@/lib/homes-store";
import { isPaymentsAuthorized } from "@/lib/payments-auth";

const NO_STORE = { "Cache-Control": "no-store" };

export function homesJson(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: NO_STORE });
}

export async function runHomesRoute(
  request: Request,
  run: () => Promise<Response>,
): Promise<Response> {
  if (!isPaymentsAuthorized(request)) {
    return homesJson({ error: "Unauthorized" }, 401);
  }

  try {
    return await run();
  } catch (error) {
    if (error instanceof HomesStoreUnavailableError) {
      return homesJson({ error: error.message }, 503);
    }

    return homesJson({ error: "Couldn't update the shared homes list." }, 500);
  }
}
