import { checkBehaviourTagsWrite } from "@/lib/behaviour-tags-auth";
import { BehaviourTagsStoreUnavailableError } from "@/lib/behaviour-tags-store";
import { isPaymentsAuthorized } from "@/lib/payments-auth";

const NO_STORE = { "Cache-Control": "no-store" };

export function tagsJson(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: NO_STORE });
}

async function guarded(run: () => Promise<Response>): Promise<Response> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof BehaviourTagsStoreUnavailableError) {
      return tagsJson({ error: error.message }, 503);
    }
    return tagsJson({ error: "Couldn't update the behaviour tags." }, 500);
  }
}

/** Reads sit behind the same optional household token as the shared notes. */
export function runTagsReadRoute(request: Request, run: () => Promise<Response>): Promise<Response> {
  if (!isPaymentsAuthorized(request)) {
    return Promise.resolve(tagsJson({ error: "Unauthorized" }, 401));
  }
  return guarded(run);
}

export function runTagsWriteRoute(request: Request, run: () => Promise<Response>): Promise<Response> {
  const access = checkBehaviourTagsWrite(request);
  if (access === "disabled") {
    return Promise.resolve(tagsJson({ error: "Behaviour tag writes are disabled." }, 503));
  }
  if (access === "unauthorized") {
    return Promise.resolve(tagsJson({ error: "Unauthorized" }, 401));
  }
  return guarded(run);
}
