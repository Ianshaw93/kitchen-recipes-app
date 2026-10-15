import { parseBehaviourTagDraft } from "@/lib/behaviour-tags";
import { runTagsReadRoute, runTagsWriteRoute, tagsJson } from "@/lib/behaviour-tags-http";
import { addSharedBehaviourTag, listSharedBehaviourTags } from "@/lib/behaviour-tags-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  return runTagsReadRoute(request, async () => tagsJson({ tags: await listSharedBehaviourTags() }));
}

export async function POST(request: Request): Promise<Response> {
  return runTagsWriteRoute(request, async () => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return tagsJson({ error: "Send a JSON object." }, 400);
    }

    const parsed = parseBehaviourTagDraft(body);
    if (!parsed.ok) {
      return tagsJson({ error: parsed.error }, 400);
    }

    return tagsJson({ tag: await addSharedBehaviourTag(parsed.draft) }, 201);
  });
}
