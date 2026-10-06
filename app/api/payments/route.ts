import {
  isMinorUnits,
  parsePaymentDraft,
  resolveThbDraft,
  type PaymentDraft,
} from "@/lib/payments";
import { getThbGbpRate } from "@/lib/fx";
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

    const resolved = draft.currency === "THB" ? await convertThbDraft(draft) : draft;

    // The live rate can round a small baht amount down to 0p; storing that would
    // invalidate the whole ledger on the next read.
    if (!isMinorUnits(resolved.amountPence)) {
      return paymentsJson({ error: "Invalid payment" }, 400);
    }

    const { entry, created } = await createSharedPayment(resolved);
    return paymentsJson({ entry }, created ? 201 : 200);
  });
}

/** The live rate wins; otherwise the client's rate (manual or fallback) is used. */
async function convertThbDraft(draft: PaymentDraft): Promise<PaymentDraft> {
  const live = await getThbGbpRate();
  return resolveThbDraft(
    draft,
    live ? { rate: live.rate, source: "live" } : { source: "manual" },
  );
}
