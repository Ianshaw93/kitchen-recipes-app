import { runTagsReadRoute, tagsJson } from "@/lib/behaviour-tags-http";
import { listSharedBehaviourTagIds } from "@/lib/behaviour-tags-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Ids only, newest first: lets every page's header check for unseen tags without loading their text. */
export async function GET(request: Request): Promise<Response> {
  return runTagsReadRoute(request, async () => tagsJson({ ids: await listSharedBehaviourTagIds() }));
}
