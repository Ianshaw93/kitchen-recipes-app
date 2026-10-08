import { describe, expect, it } from "vitest";
import {
  NON_NEGOTIABLE_CATEGORY_PROMPTS,
  RELATIONSHIP_KV_KEY,
  RELATIONSHIP_PATH,
  SEED_RELATIONSHIP,
  addBehaviourExample,
  addMustHave,
  addReview,
  addStandardsFromReview,
  addTakeaway,
  addWorkOn,
  parseRelationshipDocument,
} from "./relationship";

describe("relationship seed and schema", () => {
  it("uses an unlinked /us path and its own Redis key", () => {
    expect(RELATIONSHIP_PATH).toBe("/us");
    expect(RELATIONSHIP_KV_KEY).toBe("kusina:relationship:v1");
  });

  it("seeds all Avery positives and Ian behaviours from the research notes", () => {
    expect(SEED_RELATIONSHIP.behaviourExamples.avery).toHaveLength(29);
    expect(SEED_RELATIONSHIP.behaviourExamples.ian).toHaveLength(13);

    const avery = SEED_RELATIONSHIP.behaviourExamples.avery.map((item) => item.text).join("\n");
    expect(avery).toMatch(/offered a hug/i);
    expect(avery).toMatch(/Minority Report/);
    expect(avery).toMatch(/gratitude at dinner/i);
    expect(avery).toMatch(/get water/i);
    expect(avery).toMatch(/active listening/i);
    expect(avery).toMatch(/Fun AF/i);

    const ian = SEED_RELATIONSHIP.behaviourExamples.ian.map((item) => item.text).join("\n");
    expect(ian).toMatch(/waited until she moved to gratitude/i);
    expect(ian).toMatch(/Pick up Avery's calls/i);
    expect(ian).toMatch(/ask-before-tell/i);
    expect(ian).toMatch(/won't do that to kids/i);

    expect(SEED_RELATIONSHIP.behaviourExamples.avery[0]?.date).toBe("2026-02-24");
    expect(SEED_RELATIONSHIP.behaviourExamples.avery.find((item) => /get water/i.test(item.text))?.date).toBe(
      "2026-05-15",
    );
    expect(
      SEED_RELATIONSHIP.behaviourExamples.avery.find((item) => /Playful tickling/i.test(item.text))?.date,
    ).toBeUndefined();
  });

  it("seeds things to work on from the research notes and leaves non-negotiables empty", () => {
    expect(SEED_RELATIONSHIP.nonNegotiables.mustHaves).toEqual([]);
    expect(SEED_RELATIONSHIP.nonNegotiables.willNots).toEqual([]);
    expect(SEED_RELATIONSHIP.nonNegotiables.ianPersonal).toEqual([]);
    expect(SEED_RELATIONSHIP.nonNegotiables.averyPersonal).toEqual([]);
    expect(SEED_RELATIONSHIP.toxicDocUrl).toBe("");
    expect(SEED_RELATIONSHIP.takeaways).toEqual([]);

    expect(NON_NEGOTIABLE_CATEGORY_PROMPTS).toContain("communication & conflict");
    expect(NON_NEGOTIABLE_CATEGORY_PROMPTS).toContain("health/pregnancy support");

    const themes = SEED_RELATIONSHIP.thingsToWorkOn.map((item) => item.theme);
    expect(themes).toHaveLength(7);
    expect(themes.join("\n")).toMatch(/Gratitude \/ grace at dinner/i);
    expect(themes.join("\n")).toMatch(/Loving calendar/i);
    expect(themes.join("\n")).toMatch(/Active listening/i);
    expect(themes.join("\n")).toMatch(/Ask-before-tell/i);
    expect(themes.join("\n")).toMatch(/Pick up calls/i);
    expect(themes.join("\n")).toMatch(/Anger management/i);
    expect(themes.join("\n")).toMatch(/love loop/i);
  });

  it("keeps saved takeaways on the same fields", () => {
    const saved = addTakeaway(SEED_RELATIONSHIP, {
      date: "2026-10-08",
      speaker: "Avery",
      whatIHeard: "Need more warning",
      whatTheyNeed: "A pause",
      oneThingIllDo: "Mirror first",
      whatINeed: "A softer start",
    });
    expect(saved.takeaways[0]).toMatchObject({
      date: "2026-10-08",
      speaker: "Avery",
      whatIHeard: "Need more warning",
      whatTheyNeed: "A pause",
      oneThingIllDo: "Mirror first",
      whatINeed: "A softer start",
    });
  });

  it("parses a valid document and rejects invalid PUT bodies", () => {
    expect(parseRelationshipDocument(SEED_RELATIONSHIP)).toEqual(SEED_RELATIONSHIP);
    expect(SEED_RELATIONSHIP.version).toBe(2);
    expect(SEED_RELATIONSHIP.reviews).toEqual([]);
    expect(SEED_RELATIONSHIP.checkInStandards).toEqual([]);
    expect(parseRelationshipDocument(null)).toBeNull();
    expect(parseRelationshipDocument({ version: 1 })).toBeNull();
    expect(parseRelationshipDocument({ version: 2 })).toBeNull();
  });

  it("migrates a version 1 document without dropping notes or seeding horseman incidents", () => {
    const legacy = {
      version: 1 as const,
      updatedAt: "2026-10-08T00:00:00.000Z",
      toxicDocUrl: "",
      nonNegotiables: {
        mustHaves: [],
        willNots: [],
        ianPersonal: [],
        averyPersonal: [],
      },
      behaviourExamples: SEED_RELATIONSHIP.behaviourExamples,
      takeaways: [],
      thingsToWorkOn: SEED_RELATIONSHIP.thingsToWorkOn,
    };

    const migrated = parseRelationshipDocument(legacy);
    expect(migrated?.version).toBe(2);
    expect(migrated?.behaviourExamples.avery).toHaveLength(29);
    expect(migrated?.reviews).toEqual([]);
    expect(migrated?.checkInStandards).toEqual([]);
    expect(JSON.stringify(migrated)).not.toMatch(/cinema/i);
  });

  it("adds editable rows onto the seed document", () => {
    const withMust = addMustHave(SEED_RELATIONSHIP, {
      weNeed: "We need: one weekly check-in",
      whyItMatters: "Why it matters: so nothing piles up",
    });
    expect(withMust.nonNegotiables.mustHaves).toHaveLength(1);

    const withBehaviour = addBehaviourExample(SEED_RELATIONSHIP, "avery", {
      text: "Example: made tea unprompted",
      tag: "kindness",
    });
    expect(withBehaviour.behaviourExamples.avery[0]?.text).toBe("Example: made tea unprompted");

    const withTakeaway = addTakeaway(SEED_RELATIONSHIP, {
      date: "2026-10-08",
      speaker: "Ian",
      whatIHeard: "Need more warning before plans change",
      whatTheyNeed: "A pause before answering",
      oneThingIllDo: "Ask is it okay before I jump in",
    });
    expect(withTakeaway.takeaways[0]?.whatIHeard).toMatch(/warning/);

    const withWork = addWorkOn(SEED_RELATIONSHIP, {
      whose: "Both",
      theme: "Evening phones-down",
      observableTry: "Phones face-down during the check-in",
      status: "open",
    });
    expect(withWork.thingsToWorkOn[0]?.theme).toBe("Evening phones-down");
  });

  it("saves a reviewed-together entry and can append its standards to the check-in list", () => {
    const reviewed = addReview(SEED_RELATIONSHIP, {
      date: "2026-10-08",
      takeaways: "We named the pattern, not the person.",
      standardsAgreed: "One appreciation before we start\nPhones face-down",
    });
    expect(reviewed.reviews).toHaveLength(1);
    expect(reviewed.reviews[0]?.takeaways).toMatch(/pattern/);

    const withStandards = addStandardsFromReview(reviewed, reviewed.reviews[0]!.id);
    expect(withStandards.checkInStandards.map((item) => item.text)).toEqual([
      "One appreciation before we start",
      "Phones face-down",
    ]);

    const again = addStandardsFromReview(withStandards, reviewed.reviews[0]!.id);
    expect(again.checkInStandards).toHaveLength(2);
  });
});
