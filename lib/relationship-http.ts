import { isPaymentsAuthorized } from "@/lib/payments-auth";
import { RelationshipStoreUnavailableError } from "@/lib/relationship-store";

const NO_STORE = { "Cache-Control": "no-store" };

export function relationshipJson(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: NO_STORE });
}

export async function runRelationshipRoute(
  request: Request,
  run: () => Promise<Response>,
): Promise<Response> {
  if (!isPaymentsAuthorized(request)) {
    return relationshipJson({ error: "Unauthorized" }, 401);
  }

  try {
    return await run();
  } catch (error) {
    if (error instanceof RelationshipStoreUnavailableError) {
      return relationshipJson({ error: error.message }, 503);
    }

    return relationshipJson({ error: "Couldn't update the shared notes." }, 500);
  }
}
