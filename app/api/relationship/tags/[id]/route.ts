import { runTagsWriteRoute, tagsJson } from "@/lib/behaviour-tags-http";
import { deleteSharedBehaviourTag } from "@/lib/behaviour-tags-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  return runTagsWriteRoute(request, async () => {
    const { id } = await context.params;
    if (!(await deleteSharedBehaviourTag(id))) {
      return tagsJson({ error: "Not found" }, 404);
    }
    return tagsJson({ ok: true });
  });
}
