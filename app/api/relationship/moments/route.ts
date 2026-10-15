import { parseMomentDraft } from "@/lib/moments";
import { momentsJson, runMomentsRoute } from "@/lib/moments-http";
import { addSharedMoment, listSharedMoments } from "@/lib/moments-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  return runMomentsRoute(request, async () => momentsJson({ moments: await listSharedMoments() }));
}

export async function POST(request: Request): Promise<Response> {
  return runMomentsRoute(request, async () => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return momentsJson({ error: "Send a JSON object." }, 400);
    }

    const parsed = parseMomentDraft(body);
    if (!parsed.ok) {
      return momentsJson({ error: parsed.error }, 400);
    }

    return momentsJson({ moment: await addSharedMoment(parsed.draft) }, 201);
  });
}
