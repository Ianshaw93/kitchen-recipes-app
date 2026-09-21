import { paymentsJson, runPaymentsRoute } from "@/lib/payments-http";
import { deleteSharedPayment } from "@/lib/payments-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  return runPaymentsRoute(request, async () => {
    const { id } = await context.params;
    if (!id) {
      return paymentsJson({ error: "Missing payment id" }, 400);
    }

    const deleted = await deleteSharedPayment(id);
    if (!deleted) {
      return paymentsJson({ error: "Not found" }, 404);
    }

    return paymentsJson({ ok: true });
  });
}
