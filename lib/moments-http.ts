import { BehaviourTagsStoreUnavailableError } from "@/lib/behaviour-tags-store";
import { isPaymentsAuthorized } from "@/lib/payments-auth";
import { RelationshipStoreUnavailableError } from "@/lib/relationship-store";

const NO_STORE = { "Cache-Control": "no-store" };

export function momentsJson(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: NO_STORE });
}

/** In-app reads and writes use the same optional household token as the shared notes. */
export async function runMomentsRoute(request: Request, run: () => Promise<Response>): Promise<Response> {
  if (!isPaymentsAuthorized(request)) {
    return momentsJson({ error: "Unauthorized" }, 401);
  }
  try {
    return await run();
  } catch (error) {
    if (error instanceof BehaviourTagsStoreUnavailableError || error instanceof RelationshipStoreUnavailableError) {
      return momentsJson({ error: error.message }, 503);
    }
    return momentsJson({ error: "Couldn't update the moments." }, 500);
  }
}
