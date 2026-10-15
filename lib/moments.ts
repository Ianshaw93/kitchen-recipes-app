import {
  HORSEMAN_IDS,
  MAX_TAG_TEXT,
  TAG_KINDS,
  TAG_WHO,
  isOneOf,
  isRealDate,
  type BehaviourTag,
  type BehaviourTagsDocument,
  type HorsemanId,
  type TagKind,
  type TagWho,
} from "./behaviour-tags";
import { HORSEMEN } from "./horsemen";
import type { BehaviourPerson, RelationshipDocument } from "./relationship";

export type MomentDraft = {
  who: TagWho;
  kind: TagKind;
  text: string;
  date?: string;
  horseman?: HorsemanId;
};

export type MomentFilter = "all" | BehaviourPerson;

export type MomentDraftResult = { ok: true; draft: MomentDraft } | { ok: false; error: string };

export function parseMomentDraft(body: unknown): MomentDraftResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Send a JSON object." };
  }
  const input = body as Record<string, unknown>;

  if (!isOneOf(TAG_WHO, input.who)) {
    return { ok: false, error: `who must be one of: ${TAG_WHO.join(", ")}.` };
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
  if (input.date !== undefined && (typeof input.date !== "string" || !isRealDate(input.date))) {
    return { ok: false, error: "date must be a real YYYY-MM-DD date." };
  }
  if (input.horseman !== undefined && !isOneOf(HORSEMAN_IDS, input.horseman)) {
    return { ok: false, error: `horseman must be one of: ${HORSEMAN_IDS.join(", ")}.` };
  }

  const draft: MomentDraft = { who: input.who, kind: input.kind, text };
  if (typeof input.date === "string") {
    draft.date = input.date;
  }
  if (input.horseman !== undefined) {
    draft.horseman = input.horseman;
  }
  return { ok: true, draft };
}

export function addMoment(
  document: BehaviourTagsDocument,
  draft: MomentDraft,
  { id, now }: { id: string; now: Date },
): { document: BehaviourTagsDocument; moment: BehaviourTag } {
  const createdAt = now.toISOString();
  const moment: BehaviourTag = {
    id,
    kind: draft.kind,
    text: draft.text,
    who: draft.who,
    date: draft.date ?? createdAt.slice(0, 10),
    createdAt,
  };
  if (draft.horseman) {
    moment.horseman = draft.horseman;
  }
  return { document: { ...document, tags: [...document.tags, moment] }, moment };
}

export function migratedExampleId(person: BehaviourPerson, exampleId: string): string {
  return `example-${person}-${exampleId}`;
}

const PEOPLE: readonly BehaviourPerson[] = ["avery", "ian"];

/**
 * Copies household behaviour examples in as wins. Each example is recorded once in
 * `migratedExampleIds`, so re-running is a no-op and a deleted moment never comes back.
 * The household document itself is left untouched.
 */
export function migrateBehaviourExamples(
  document: BehaviourTagsDocument,
  examples: RelationshipDocument["behaviourExamples"],
  now: Date,
): { document: BehaviourTagsDocument; changed: boolean } {
  const done = new Set(document.migratedExampleIds ?? []);
  const createdAt = now.toISOString();
  const added: BehaviourTag[] = [];
  const addedKeys: string[] = [];

  for (const person of PEOPLE) {
    for (const example of examples[person]) {
      const key = `${person}:${example.id}`;
      if (done.has(key)) {
        continue;
      }
      done.add(key);
      addedKeys.push(key);
      const moment: BehaviourTag = {
        id: migratedExampleId(person, example.id),
        kind: "win",
        who: person,
        text: example.text,
        createdAt,
      };
      if (example.date) {
        moment.date = example.date;
      }
      if (example.tag) {
        moment.label = example.tag;
      }
      added.push(moment);
    }
  }

  if (addedKeys.length === 0) {
    return { document, changed: false };
  }
  const existingIds = new Set(document.tags.map((tag) => tag.id));
  return {
    document: {
      ...document,
      tags: [...document.tags, ...added.filter((moment) => !existingIds.has(moment.id))],
      migratedExampleIds: [...(document.migratedExampleIds ?? []), ...addedKeys],
    },
    changed: true,
  };
}

export function filterMoments(moments: readonly BehaviourTag[], filter: MomentFilter): BehaviourTag[] {
  if (filter === "all") {
    return [...moments];
  }
  return moments.filter((moment) => moment.who === filter || moment.who === "both");
}

export function momentPatternLabel(moment: BehaviourTag): string | null {
  const card = moment.horseman ? HORSEMEN.find((item) => item.id === moment.horseman) : undefined;
  if (!card) {
    return null;
  }
  return moment.kind === "slip" ? card.horseman : card.positive;
}
