import { parseTagsDocument, type BehaviourTag } from "./behaviour-tags";
import { paymentsRequestHeaders } from "./payments-client";

export async function fetchBehaviourTags(): Promise<BehaviourTag[]> {
  const response = await fetch("/api/relationship/tags", {
    headers: paymentsRequestHeaders(),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Couldn't load behaviour tags (${response.status}).`);
  }
  const data = (await response.json()) as { tags?: unknown };
  return parseTagsDocument({ tags: data.tags }).tags;
}
