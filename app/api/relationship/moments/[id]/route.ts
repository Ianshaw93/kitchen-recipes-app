import { momentsJson, runMomentsRoute } from "@/lib/moments-http";
import { deleteSharedMoment } from "@/lib/moments-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  return runMomentsRoute(request, async () => {
    const { id } = await context.params;
    if (!(await deleteSharedMoment(id))) {
      return momentsJson({ error: "Not found" }, 404);
    }
    return momentsJson({ ok: true });
  });
}
