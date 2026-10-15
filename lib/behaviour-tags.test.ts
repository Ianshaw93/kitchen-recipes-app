import { describe, expect, it } from "vitest";
import { HORSEMEN } from "./horsemen";
import {
  badgeCountLabel,
  BEHAVIOUR_TAGS_KV_KEY,
  HORSEMAN_IDS,
  MAX_TAG_TEXT,
  addBehaviourTag,
  emptyTagsDocument,
  parseBehaviourTagDraft,
  parseTagsDocument,
  removeBehaviourTag,
  sortTagsNewestFirst,
  tagIds,
  type BehaviourTag,
} from "./behaviour-tags";

function tag(overrides: Partial<BehaviourTag> = {}): BehaviourTag {
  return {
    id: "tag-1",
    horseman: "criticism",
    kind: "win",
    text: "Raised a small thing early and kindly",
    date: "2026-10-01",
    createdAt: "2026-10-01T09:00:00.000Z",
    ...overrides,
  };
}

describe("behaviour tag drafts", () => {
  it("uses its own Redis key, separate from the household notes", () => {
    expect(BEHAVIOUR_TAGS_KV_KEY).toBe("relationship:tags");
  });

  it("matches the horseman ids on the cards", () => {
    expect(HORSEMAN_IDS).toEqual(HORSEMEN.map((card) => card.id));
  });

  it("accepts a valid draft, trims text, and keeps optional who and date", () => {
    expect(
      parseBehaviourTagDraft({
        horseman: "contempt",
        kind: "slip",
        text: "  Eye-roll during a small disagreement  ",
        who: "both",
        date: "2026-10-04",
      }),
    ).toEqual({
      ok: true,
      draft: {
        horseman: "contempt",
        kind: "slip",
        text: "Eye-roll during a small disagreement",
        who: "both",
        date: "2026-10-04",
      },
    });
    expect(parseBehaviourTagDraft({ horseman: "stonewalling", kind: "win", text: "Took a break and came back" })).toEqual({
      ok: true,
      draft: { horseman: "stonewalling", kind: "win", text: "Took a break and came back" },
    });
  });

  it("rejects bad horseman, kind, who, date, text, and non-objects with a reason", () => {
    const bad: unknown[] = [
      null,
      "text",
      [],
      { horseman: "sarcasm", kind: "win", text: "x" },
      { horseman: "criticism", kind: "maybe", text: "x" },
      { horseman: "criticism", kind: "win", text: "   " },
      { horseman: "criticism", kind: "win", text: 42 },
      { horseman: "criticism", kind: "win", text: "x".repeat(MAX_TAG_TEXT + 1) },
      { horseman: "criticism", kind: "win", text: "x", who: "someone" },
      { horseman: "criticism", kind: "win", text: "x", date: "01/10/2026" },
      { horseman: "criticism", kind: "win", text: "x", date: "2026-02-31" },
    ];
    for (const body of bad) {
      const result = parseBehaviourTagDraft(body);
      expect(result.ok, JSON.stringify(body)).toBe(false);
      if (!result.ok) {
        expect(result.error.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("behaviour tag document", () => {
  it("adds a tag with a server id, date default, and createdAt", () => {
    const now = new Date("2026-10-12T08:30:00.000Z");
    const next = addBehaviourTag(
      emptyTagsDocument(),
      { horseman: "defensiveness", kind: "win", text: "Asked what I was missing" },
      { id: "new-id", now },
    );
    expect(next.tags).toEqual([
      {
        id: "new-id",
        horseman: "defensiveness",
        kind: "win",
        text: "Asked what I was missing",
        date: "2026-10-12",
        createdAt: "2026-10-12T08:30:00.000Z",
      },
    ]);
    expect(next.version).toBe(1);
  });

  it("removes by id and reports whether anything was removed", () => {
    const doc = { version: 1 as const, tags: [tag({ id: "a" }), tag({ id: "b" })] };
    expect(removeBehaviourTag(doc, "a")).toEqual({ document: { version: 1, tags: [tag({ id: "b" })] }, removed: true });
    expect(removeBehaviourTag(doc, "missing")).toEqual({ document: doc, removed: false });
  });

  it("sorts newest first by date, then by createdAt", () => {
    const tags = [
      tag({ id: "old", date: "2026-09-01", createdAt: "2026-10-10T00:00:00.000Z" }),
      tag({ id: "new-early", date: "2026-10-05", createdAt: "2026-10-05T08:00:00.000Z" }),
      tag({ id: "new-late", date: "2026-10-05", createdAt: "2026-10-05T20:00:00.000Z" }),
    ];
    expect(sortTagsNewestFirst(tags).map((item) => item.id)).toEqual(["new-late", "new-early", "old"]);
    expect(tags[0]?.id).toBe("old");
  });

  it("parses stored data tolerantly, dropping invalid tags", () => {
    expect(parseTagsDocument(null)).toEqual(emptyTagsDocument());
    expect(parseTagsDocument("garbage")).toEqual(emptyTagsDocument());
    expect(
      parseTagsDocument({
        version: 1,
        tags: [tag(), { id: "broken", horseman: "nope" }, tag({ id: "two", who: "ian" })],
      }),
    ).toEqual({ version: 1, tags: [tag(), tag({ id: "two", who: "ian" })] });
  });

  it("lists ids newest first for the cheap badge check", () => {
    const doc = {
      version: 1 as const,
      tags: [tag({ id: "a", date: "2026-09-01" }), tag({ id: "b", date: "2026-10-01" })],
    };
    expect(tagIds(doc)).toEqual(["b", "a"]);
  });
});

describe("badge count label", () => {
  it("shows the number up to 9, 9+ above, and nothing for 0", () => {
    expect(badgeCountLabel(0)).toBeNull();
    expect(badgeCountLabel(-1)).toBeNull();
    expect(badgeCountLabel(1)).toBe("1");
    expect(badgeCountLabel(9)).toBe("9");
    expect(badgeCountLabel(10)).toBe("9+");
    expect(badgeCountLabel(250)).toBe("9+");
  });
});
