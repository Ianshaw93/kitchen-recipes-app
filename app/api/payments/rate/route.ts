import { getThbGbpRate } from "@/lib/fx";
import { paymentsJson, runPaymentsRoute } from "@/lib/payments-http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  return runPaymentsRoute(request, async () => {
    const rate = await getThbGbpRate();
    if (!rate) {
      return paymentsJson({ error: "Couldn't fetch a THB to GBP rate." }, 503);
    }

    return paymentsJson(rate);
  });
}
