import { parseRelationshipDocument } from "@/lib/relationship";
import { relationshipJson, runRelationshipRoute } from "@/lib/relationship-http";
import { listSharedRelationship, writeSharedRelationship } from "@/lib/relationship-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  return runRelationshipRoute(request, async () => {
    const document = await listSharedRelationship();
    return relationshipJson({ document });
  });
}

export async function PUT(request: Request): Promise<Response> {
  return runRelationshipRoute(request, async () => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return relationshipJson({ error: "Invalid relationship notes" }, 400);
    }

    const parsed = parseRelationshipDocument(body);
    if (!parsed) {
      return relationshipJson({ error: "Invalid relationship notes" }, 400);
    }

    const document = await writeSharedRelationship({
      ...parsed,
      updatedAt: new Date().toISOString(),
    });
    return relationshipJson({ document });
  });
}
