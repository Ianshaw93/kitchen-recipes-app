import { describe, expect, it } from "vitest";
import {
  addBehaviourTag,
  parseBehaviourTagDraft,
  parseTagsDocument,
  sortTagsNewestFirst,
  type BehaviourTag,
  type BehaviourTagsDocument,
} from "./behaviour-tags";
import {
  filterMoments,
  migrateBehaviourExamples,
  migratedExampleId,
  momentPatternLabel,
  parseMomentDraft,
} from "./moments";
import type { RelationshipDocument } from "./relationship";

const NOW = new Date("2026-10-15T08:00:00.000Z");

function examples(
  avery: RelationshipDocument["behaviourExamples"]["avery"],
  ian: RelationshipDocument["behaviourExamples"]["ian"] = [],
): RelationshipDocument["behaviourExamples"] {
  return { avery, ian };
}

function moment(overrides: Partial<BehaviourTag>): BehaviourTag {
  return { id: "m", kind: "win", text: "Generic", createdAt: "2026-10-01T00:00:00.000Z", ...overrides };
}

describe("moment drafts typed in the app", () => {
  it("needs who, win or slip, and text; date and horseman are optional", () => {
    expect(parseMomentDraft({ who: "avery", kind: "win", text: "  Generic kind act  " })).toEqual({
      ok: true,
      draft: { who: "avery", kind: "win", text: "Generic kind act" },
    });
    expect(
      parseMomentDraft({ who: "both", kind: "slip", text: "Generic", date: "2026-10-02", horseman: "contempt" }),
    ).toEqual({
      ok: true,
      draft: { who: "both", kind: "slip", text: "Generic", date: "2026-10-02", horseman: "contempt" },
    });
  });

  it("rejects a missing who, a bad kind, empty text, a fake date, or an unknown horseman", () => {
    const base = { who: "ian", kind: "win", text: "Generic" };
    expect(parseMomentDraft({ kind: "win", text: "Generic" })).toEqual({
      ok: false,
      error: "who must be one of: ian, avery, both.",
    });
    expect(parseMomentDraft({ ...base, kind: "meh" }).ok).toBe(false);
    expect(parseMomentDraft({ ...base, text: "  " }).ok).toBe(false);
    expect(parseMomentDraft({ ...base, date: "2026-02-30" }).ok).toBe(false);
    expect(parseMomentDraft({ ...base, horseman: "grumpy" }).ok).toBe(false);
    expect(parseMomentDraft("nope").ok).toBe(false);
  });

  it("leaves the bearer-token draft rules alone: the weekly scan still names a horseman", () => {
    expect(parseBehaviourTagDraft({ kind: "win", text: "Generic" }).ok).toBe(false);
  });
});

describe("stored moments", () => {
  it("keep optional horseman, date, and label, and the migrated example ids", () => {
    const parsed = parseTagsDocument({
      version: 1,
      migratedExampleIds: ["avery:a1", 3],
      tags: [
        { id: "x", kind: "win", text: "Generic", who: "avery", label: "kindness", createdAt: NOW.toISOString() },
        { id: "y", kind: "slip", text: "Generic", horseman: "contempt", date: "2026-10-02", createdAt: "c" },
      ],
    });
    expect(parsed.migratedExampleIds).toEqual(["avery:a1"]);
    expect(parsed.tags).toEqual([
      { id: "x", kind: "win", text: "Generic", who: "avery", label: "kindness", createdAt: NOW.toISOString() },
      { id: "y", kind: "slip", text: "Generic", horseman: "contempt", date: "2026-10-02", createdAt: "c" },
    ]);
  });

  it("sort dated moments newest first and undated ones after them", () => {
    const sorted = sortTagsNewestFirst([
      moment({ id: "undated" }),
      moment({ id: "old", date: "2026-01-01" }),
      moment({ id: "new", date: "2026-10-01" }),
    ]);
    expect(sorted.map((item) => item.id)).toEqual(["new", "old", "undated"]);
  });

  it("still default a bearer tag's date to today", () => {
    const next = addBehaviourTag(
      { version: 1, tags: [] },
      { horseman: "criticism", kind: "win", text: "Generic" },
      { id: "t", now: NOW },
    );
    expect(next.tags[0]?.date).toBe("2026-10-15");
  });
});

describe("migrating hand-added behaviour examples", () => {
  const household = examples(
    [
      { id: "a1", text: "Generic Avery example", date: "2026-02-24", tag: "kindness" },
      { id: "a2", text: "Generic undated Avery example" },
    ],
    [{ id: "i1", text: "Generic Ian example", date: "2026-03-02" }],
  );

  it("copies every example in as a win, keeping who, text, date, and the old tag as a label", () => {
    const { document, changed } = migrateBehaviourExamples({ version: 1, tags: [] }, household, NOW);
    expect(changed).toBe(true);
    expect(document.tags).toEqual([
      {
        id: migratedExampleId("avery", "a1"),
        kind: "win",
        who: "avery",
        text: "Generic Avery example",
        date: "2026-02-24",
        label: "kindness",
        createdAt: NOW.toISOString(),
      },
      {
        id: migratedExampleId("avery", "a2"),
        kind: "win",
        who: "avery",
        text: "Generic undated Avery example",
        createdAt: NOW.toISOString(),
      },
      {
        id: migratedExampleId("ian", "i1"),
        kind: "win",
        who: "ian",
        text: "Generic Ian example",
        date: "2026-03-02",
        createdAt: NOW.toISOString(),
      },
    ]);
    expect(document.migratedExampleIds).toEqual(["avery:a1", "avery:a2", "ian:i1"]);
  });

  it("keeps the moments that were already there", () => {
    const start: BehaviourTagsDocument = {
      version: 1,
      tags: [moment({ id: "scan-1", horseman: "criticism", date: "2026-10-01" })],
    };
    const { document } = migrateBehaviourExamples(start, household, NOW);
    expect(document.tags[0]).toEqual(start.tags[0]);
    expect(document.tags).toHaveLength(4);
  });

  it("is idempotent: a second run changes nothing", () => {
    const first = migrateBehaviourExamples({ version: 1, tags: [] }, household, NOW).document;
    const second = migrateBehaviourExamples(first, household, new Date("2026-10-16T00:00:00.000Z"));
    expect(second.changed).toBe(false);
    expect(second.document).toBe(first);
  });

  it("never brings back a migrated moment that was deleted", () => {
    const first = migrateBehaviourExamples({ version: 1, tags: [] }, household, NOW).document;
    const deleted = { ...first, tags: first.tags.filter((tag) => tag.id !== migratedExampleId("ian", "i1")) };
    const again = migrateBehaviourExamples(deleted, household, NOW);
    expect(again.changed).toBe(false);
    expect(again.document.tags.map((tag) => tag.id)).not.toContain(migratedExampleId("ian", "i1"));
  });

  it("picks up an example added later without touching earlier ones", () => {
    const first = migrateBehaviourExamples({ version: 1, tags: [] }, household, NOW).document;
    const later = examples([...household.avery, { id: "a3", text: "Generic later example" }], household.ian);
    const again = migrateBehaviourExamples(first, later, NOW);
    expect(again.changed).toBe(true);
    expect(again.document.tags).toHaveLength(4);
    expect(again.document.migratedExampleIds).toContain("avery:a3");
  });
});

describe("moment helpers", () => {
  it("filters by person, counting shared moments for both", () => {
    const list = [
      moment({ id: "i", who: "ian" }),
      moment({ id: "a", who: "avery" }),
      moment({ id: "b", who: "both" }),
      moment({ id: "n" }),
    ];
    expect(filterMoments(list, "all").map((item) => item.id)).toEqual(["i", "a", "b", "n"]);
    expect(filterMoments(list, "ian").map((item) => item.id)).toEqual(["i", "b"]);
    expect(filterMoments(list, "avery").map((item) => item.id)).toEqual(["a", "b"]);
  });

  it("names the horseman for a slip and its positive for a win", () => {
    expect(momentPatternLabel(moment({ kind: "slip", horseman: "criticism" }))).toBe("Criticism");
    expect(momentPatternLabel(moment({ kind: "win", horseman: "criticism" }))).toBe("Raise it gently");
    expect(momentPatternLabel(moment({ kind: "win" }))).toBeNull();
  });
});
