import { parsePaymentDraft } from "@/lib/payments";
import { paymentsJson, runPaymentsRoute } from "@/lib/payments-http";
import { createSharedPayment, listSharedPayments } from "@/lib/payments-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  return runPaymentsRoute(request, async () => {
    const entries = await listSharedPayments();
    return paymentsJson({ entries });
  });
}

export async function POST(request: Request): Promise<Response> {
  return runPaymentsRoute(request, async () => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return paymentsJson({ error: "Invalid payment" }, 400);
    }

    const draft = parsePaymentDraft(body);
    if (!draft) {
      return paymentsJson({ error: "Invalid payment" }, 400);
    }

    const { entry, created } = await createSharedPayment(draft);
    return paymentsJson({ entry }, created ? 201 : 200);
  });
}
