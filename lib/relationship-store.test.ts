import { afterEach, describe, expect, it, vi } from "vitest";
import { SEED_RELATIONSHIP, addMustHave } from "./relationship";
import {
  createRelationshipMemoryStore,
  listSharedRelationship,
  resetRelationshipStoreForTests,
  writeSharedRelationship,
} from "./relationship-store";

describe("relationship store", () => {
  afterEach(() => {
    resetRelationshipStoreForTests();
    vi.unstubAllEnvs();
  });

  it("returns the committed seed on an empty store", async () => {
    const store = createRelationshipMemoryStore();
    const document = await listSharedRelationship(store);
    expect(document.behaviourExamples.avery).toHaveLength(SEED_RELATIONSHIP.behaviourExamples.avery.length);
    expect(document.thingsToWorkOn.map((item) => item.theme)).toEqual(
      SEED_RELATIONSHIP.thingsToWorkOn.map((item) => item.theme),
    );
  });

  it("layers writes over the seed so later reads keep edits", async () => {
    const store = createRelationshipMemoryStore();
    await listSharedRelationship(store);

    const edited = addMustHave(SEED_RELATIONSHIP, {
      weNeed: "We need: phones down for the check-in",
      whyItMatters: "Why it matters: so we can actually hear each other",
    });
    await writeSharedRelationship(edited, store);

    const reread = await listSharedRelationship(store);
    expect(reread.nonNegotiables.mustHaves).toHaveLength(1);
    expect(reread.nonNegotiables.mustHaves[0]?.weNeed).toMatch(/phones down/i);
  });
});
