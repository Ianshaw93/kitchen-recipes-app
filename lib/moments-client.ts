import { parseTagsDocument, type BehaviourTag } from "./behaviour-tags";
import type { MomentDraft } from "./moments";
import { paymentsRequestHeaders } from "./payments-client";

const MOMENTS_URL = "/api/relationship/moments";

export async function fetchMoments(): Promise<BehaviourTag[]> {
  const response = await fetch(MOMENTS_URL, { headers: paymentsRequestHeaders(), cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Couldn't load moments (${response.status}).`);
  }
  const data = (await response.json()) as { moments?: unknown };
  return parseTagsDocument({ tags: data.moments }).tags;
}

export async function createMoment(draft: MomentDraft): Promise<BehaviourTag> {
  const response = await fetch(MOMENTS_URL, {
    method: "POST",
    headers: paymentsRequestHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(draft),
  });
  if (!response.ok) {
    throw new Error(`Couldn't add the moment (${response.status}).`);
  }
  const data = (await response.json()) as { moment?: unknown };
  const [moment] = parseTagsDocument({ tags: [data.moment] }).tags;
  if (!moment) {
    throw new Error("The server sent back an unreadable moment.");
  }
  return moment;
}

export async function deleteMoment(id: string): Promise<void> {
  const response = await fetch(`${MOMENTS_URL}/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: paymentsRequestHeaders(),
  });
  if (!response.ok && response.status !== 404) {
    throw new Error(`Couldn't delete the moment (${response.status}).`);
  }
}
