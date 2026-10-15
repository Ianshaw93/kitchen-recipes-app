import { describe, expect, it, vi } from "vitest";
import { parseTagsDocument } from "./behaviour-tags";
import { createBehaviourTagsMemoryStore, type BehaviourTagsStore } from "./behaviour-tags-store";
import { migratedExampleId } from "./moments";
import { addSharedMoment, deleteSharedMoment, listSharedMoments } from "./moments-store";
import { emptyRelationshipDocument, type RelationshipDocument } from "./relationship";
import { createRelationshipMemoryStore, type RelationshipStore } from "./relationship-store";

function household(): RelationshipDocument {
  return {
    ...emptyRelationshipDocument("2026-10-01T00:00:00.000Z"),
    behaviourExamples: {
      avery: [{ id: "a1", text: "Generic Avery example", date: "2026-02-24", tag: "kindness" }],
      ian: [{ id: "i1", text: "Generic Ian example", date: "2026-03-02" }],
    },
  };
}

function stores(tagsInitial: unknown = null): {
  tags: BehaviourTagsStore;
  relationship: RelationshipStore;
  tagWrites: () => number;
  householdWrites: () => number;
} {
  const tags = createBehaviourTagsMemoryStore(tagsInitial);
  const relationship = createRelationshipMemoryStore(household());
  const tagWrite = vi.spyOn(tags, "write");
  const householdWrite = vi.spyOn(relationship, "write");
  return {
    tags,
    relationship,
    tagWrites: () => tagWrite.mock.calls.length,
    householdWrites: () => householdWrite.mock.calls.length,
  };
}

describe("shared moments store", () => {
  it("migrates the household examples on first read, once, newest first, and never rewrites the household doc", async () => {
    const s = stores({
      version: 1,
      tags: [{ id: "scan", horseman: "criticism", kind: "slip", text: "Generic scan slip", date: "2026-10-05", createdAt: "c" }],
    });

    const first = await listSharedMoments(s);
    expect(first.map((item) => item.id)).toEqual(["scan", migratedExampleId("ian", "i1"), migratedExampleId("avery", "a1")]);
    expect(s.tagWrites()).toBe(1);

    const second = await listSharedMoments(s);
    expect(second).toEqual(first);
    expect(s.tagWrites()).toBe(1);

    expect(s.householdWrites()).toBe(0);
    expect(await s.relationship.read()).toEqual(household());
  });

  it("adds a moment typed in the app and lists it with the rest", async () => {
    const s = stores();
    const added = await addSharedMoment({ who: "both", kind: "slip", text: "Generic slip", horseman: "contempt" }, s);
    expect(added).toMatchObject({ who: "both", kind: "slip", text: "Generic slip", horseman: "contempt" });
    expect(added.id).toBeTruthy();
    expect(added.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect((await listSharedMoments(s)).map((item) => item.id)).toContain(added.id);
  });

  it("migrates before an add, so the first add can't hide the examples", async () => {
    const s = stores();
    await addSharedMoment({ who: "ian", kind: "win", text: "Generic win" }, s);
    const stored = parseTagsDocument(await s.tags.read());
    expect(stored.tags).toHaveLength(3);
    expect(stored.migratedExampleIds).toEqual(["avery:a1", "ian:i1"]);
  });

  it("deletes a migrated moment for good", async () => {
    const s = stores();
    await listSharedMoments(s);
    expect(await deleteSharedMoment(migratedExampleId("avery", "a1"), s)).toBe(true);
    expect(await deleteSharedMoment("missing", s)).toBe(false);
    expect((await listSharedMoments(s)).map((item) => item.id)).toEqual([migratedExampleId("ian", "i1")]);
  });
});
