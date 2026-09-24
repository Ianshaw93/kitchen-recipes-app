import { parseWeekDraft } from "@/lib/homes";
import { homesJson, runHomesRoute } from "@/lib/homes-http";
import { appendSharedWeek, listSharedHomes } from "@/lib/homes-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  return runHomesRoute(request, async () => {
    const weeks = await listSharedHomes();
    return homesJson({ weeks });
  });
}

export async function POST(request: Request): Promise<Response> {
  return runHomesRoute(request, async () => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return homesJson({ error: "Invalid week" }, 400);
    }

    const draft = parseWeekDraft(body);
    if (!draft) {
      return homesJson({ error: "Invalid week" }, 400);
    }

    const { week, created, weeks } = await appendSharedWeek(draft);
    return homesJson({ week, weeks }, created ? 201 : 200);
  });
}
