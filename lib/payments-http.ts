import { isPaymentsAuthorized } from "@/lib/payments-auth";
import { PaymentsStoreUnavailableError } from "@/lib/payments-store";

const NO_STORE = { "Cache-Control": "no-store" };

export function paymentsJson(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: NO_STORE });
}

export async function runPaymentsRoute(
  request: Request,
  run: () => Promise<Response>,
): Promise<Response> {
  if (!isPaymentsAuthorized(request)) {
    return paymentsJson({ error: "Unauthorized" }, 401);
  }

  try {
    return await run();
  } catch (error) {
    if (error instanceof PaymentsStoreUnavailableError) {
      return paymentsJson({ error: error.message }, 503);
    }

    return paymentsJson({ error: "Couldn't update the shared ledger." }, 500);
  }
}
