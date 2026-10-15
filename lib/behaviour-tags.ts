/**
 * Behaviour tags ("moments"): real wins and slips from the couple's notes. The weekly scan
 * posts them with a horseman; moments typed in the app or migrated from the old behaviour
 * examples may have none. The words are private, so they live only in Redis under their own
 * key, never in the repo.
 */

export const BEHAVIOUR_TAGS_KV_KEY = "relationship:tags";

export const HORSEMAN_IDS = ["criticism", "contempt", "defensiveness", "stonewalling"] as const;
export const TAG_KINDS = ["slip", "win"] as const;
export const TAG_WHO = ["ian", "avery", "both"] as const;
export const MAX_TAG_TEXT = 500;

export type HorsemanId = (typeof HORSEMAN_IDS)[number];
export type TagKind = (typeof TAG_KINDS)[number];
export type TagWho = (typeof TAG_WHO)[number];

export type BehaviourTagDraft = {
  horseman: HorsemanId;
  kind: TagKind;
  text: string;
  who?: TagWho;
  date?: string;
};

export type BehaviourTag = {
  id: string;
  horseman?: HorsemanId;
  kind: TagKind;
  text: string;
  who?: TagWho;
  /** Missing only for migrated behaviour examples that never had a date. */
  date?: string;
  /** Free-text tag carried over from a migrated behaviour example, e.g. "kindness". */
  label?: string;
  createdAt: string;
};

export type BehaviourTagsDocument = {
  version: 1;
  tags: BehaviourTag[];
  /** `person:id` of every household behaviour example already copied in, so deletes stick. */
  migratedExampleIds?: string[];
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isRealDate(value: string): boolean {
  if (!ISO_DATE.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function isOneOf<T extends string>(options: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (options as readonly string[]).includes(value);
}

export function emptyTagsDocument(): BehaviourTagsDocument {
  return { version: 1, tags: [] };
}

export type DraftResult = { ok: true; draft: BehaviourTagDraft } | { ok: false; error: string };

export function parseBehaviourTagDraft(body: unknown): DraftResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Send a JSON object." };
  }
  const input = body as Record<string, unknown>;

  if (!isOneOf(HORSEMAN_IDS, input.horseman)) {
    return { ok: false, error: `horseman must be one of: ${HORSEMAN_IDS.join(", ")}.` };
  }
  if (!isOneOf(TAG_KINDS, input.kind)) {
    return { ok: false, error: `kind must be one of: ${TAG_KINDS.join(", ")}.` };
  }
  if (typeof input.text !== "string" || !input.text.trim()) {
    return { ok: false, error: "text is required." };
  }
  const text = input.text.trim();
  if (text.length > MAX_TAG_TEXT) {
    return { ok: false, error: `text must be ${MAX_TAG_TEXT} characters or fewer.` };
  }
  if (input.who !== undefined && !isOneOf(TAG_WHO, input.who)) {
    return { ok: false, error: `who must be one of: ${TAG_WHO.join(", ")}.` };
  }
  if (input.date !== undefined && (typeof input.date !== "string" || !isRealDate(input.date))) {
    return { ok: false, error: "date must be a real YYYY-MM-DD date." };
  }

  const draft: BehaviourTagDraft = { horseman: input.horseman, kind: input.kind, text };
  if (input.who !== undefined) {
    draft.who = input.who;
  }
  if (typeof input.date === "string") {
    draft.date = input.date;
  }
  return { ok: true, draft };
}

function parseStoredTag(raw: unknown): BehaviourTag | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const value = raw as Record<string, unknown>;
  if (
    typeof value.id !== "string" ||
    !value.id ||
    !isOneOf(TAG_KINDS, value.kind) ||
    typeof value.text !== "string" ||
    !value.text.trim() ||
    typeof value.createdAt !== "string"
  ) {
    return null;
  }
  const tag: BehaviourTag = { id: value.id, kind: value.kind, text: value.text.trim(), createdAt: value.createdAt };
  if (isOneOf(HORSEMAN_IDS, value.horseman)) {
    tag.horseman = value.horseman;
  }
  if (isOneOf(TAG_WHO, value.who)) {
    tag.who = value.who;
  }
  if (typeof value.date === "string" && isRealDate(value.date)) {
    tag.date = value.date;
  }
  if (typeof value.label === "string" && value.label.trim()) {
    tag.label = value.label.trim();
  }
  return tag;
}

export function parseTagsDocument(raw: unknown): BehaviourTagsDocument {
  if (!raw || typeof raw !== "object" || !Array.isArray((raw as { tags?: unknown }).tags)) {
    return emptyTagsDocument();
  }
  const tags = (raw as { tags: unknown[] }).tags
    .map(parseStoredTag)
    .filter((tag): tag is BehaviourTag => tag !== null);
  const migrated = (raw as { migratedExampleIds?: unknown }).migratedExampleIds;
  if (!Array.isArray(migrated)) {
    return { version: 1, tags };
  }
  return {
    version: 1,
    tags,
    migratedExampleIds: migrated.filter((id): id is string => typeof id === "string" && id.length > 0),
  };
}

export function addBehaviourTag(
  document: BehaviourTagsDocument,
  draft: BehaviourTagDraft,
  { id, now }: { id: string; now: Date },
): BehaviourTagsDocument {
  const createdAt = now.toISOString();
  const tag: BehaviourTag = {
    id,
    horseman: draft.horseman,
    kind: draft.kind,
    text: draft.text,
    date: draft.date ?? createdAt.slice(0, 10),
    createdAt,
  };
  if (draft.who) {
    tag.who = draft.who;
  }
  return { ...document, tags: [...document.tags, tag] };
}

export function removeBehaviourTag(
  document: BehaviourTagsDocument,
  id: string,
): { document: BehaviourTagsDocument; removed: boolean } {
  const tags = document.tags.filter((tag) => tag.id !== id);
  if (tags.length === document.tags.length) {
    return { document, removed: false };
  }
  return { document: { ...document, tags }, removed: true };
}

export function sortTagsNewestFirst(tags: readonly BehaviourTag[]): BehaviourTag[] {
  return [...tags].sort((a, b) => {
    if (a.date !== b.date) {
      if (!a.date) {
        return 1;
      }
      if (!b.date) {
        return -1;
      }
      return b.date.localeCompare(a.date);
    }
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function tagIds(document: BehaviourTagsDocument): string[] {
  return sortTagsNewestFirst(document.tags).map((tag) => tag.id);
}
