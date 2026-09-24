import { parseVoteDraft } from "@/lib/homes";
import { homesJson, runHomesRoute } from "@/lib/homes-http";
import { voteSharedHome } from "@/lib/homes-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  return runHomesRoute(request, async () => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return homesJson({ error: "Invalid vote" }, 400);
    }

    const draft = parseVoteDraft(body);
    if (!draft) {
      return homesJson({ error: "Invalid vote" }, 400);
    }

    const { listing, weeks } = await voteSharedHome(draft);
    if (!listing) {
      return homesJson({ error: "Listing not found" }, 404);
    }

    return homesJson({ listing, weeks });
  });
}
