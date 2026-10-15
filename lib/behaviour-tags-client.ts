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

let inFlightIds: Promise<string[]> | null = null;

/** The header pill and the Horsemen tab mount together; share one request between them. */
export function fetchBehaviourTagIds(): Promise<string[]> {
  inFlightIds ??= (async () => {
    try {
      const response = await fetch("/api/relationship/tags/latest", {
        headers: paymentsRequestHeaders(),
        cache: "no-store",
      });
      if (!response.ok) {
        return [];
      }
      const data = (await response.json()) as { ids?: unknown };
      return Array.isArray(data.ids) ? data.ids.filter((id): id is string => typeof id === "string") : [];
    } catch {
      return [];
    } finally {
      inFlightIds = null;
    }
  })();
  return inFlightIds;
}
