import { isPaymentsAuthorized } from "@/lib/payments-auth";
import { ShopStoreUnavailableError } from "@/lib/shop-store";

const NO_STORE = { "Cache-Control": "no-store" };

export function shopJson(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: NO_STORE });
}

export async function runShopRoute(
  request: Request,
  run: () => Promise<Response>,
): Promise<Response> {
  if (!isPaymentsAuthorized(request)) {
    return shopJson({ error: "Unauthorized" }, 401);
  }

  try {
    return await run();
  } catch (error) {
    if (error instanceof ShopStoreUnavailableError) {
      return shopJson({ error: error.message }, 503);
    }

    return shopJson({ error: "Couldn't update the shared shop list." }, 500);
  }
}
