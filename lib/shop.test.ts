import { describe, expect, it } from "vitest";
import {
  SEED_SHOP,
  SHOP_KV_KEY,
  addShopItem,
  applyShopMutation,
  clearShopTicks,
  parseShopDocument,
  parseShopMutation,
  shopDocument,
  toggleShopItem,
} from "./shop";

const mealListPattern = /chicken breast|broccoli|hipon|tinola|ginisang/i;

describe("shop list helpers", () => {
  it("seeds restocks, an empty specials list, and the Asian run", () => {
    expect(SHOP_KV_KEY).toBe("kusina:shop:v1");
    expect(SEED_SHOP.sections.fewWeeks.map((item) => item.label)).toEqual([
      "Soap refill",
      "Black bin bags",
      "Olive oil",
      "Coconut oil",
    ]);
    expect(SEED_SHOP.sections.thisWeek).toEqual([]);
    expect(SEED_SHOP.sections.asian.map((item) => item.label)).toEqual([
      "Fish sauce (patis)",
      "Tamarind paste (or sugar-free sinigang mix)",
      "Calamansi if available",
    ]);
    expect(SEED_SHOP.sections.asian[1]?.note).toMatch(/ran out/i);
    expect(SEED_SHOP.sections.fewWeeks.every((item) => item.done === false)).toBe(true);

    const labels = [
      ...SEED_SHOP.sections.fewWeeks,
      ...SEED_SHOP.sections.thisWeek,
      ...SEED_SHOP.sections.asian,
    ].map((item) => item.label);
    expect(labels.join(" ")).not.toMatch(mealListPattern);
  });

  it("toggles one item and leaves the other sections alone", () => {
    const ticked = toggleShopItem(SEED_SHOP.sections, "fewWeeks", "seed-soap-refill");
    expect(ticked.fewWeeks.find((item) => item.id === "seed-soap-refill")?.done).toBe(true);
    expect(ticked.fewWeeks.find((item) => item.id === "seed-olive-oil")?.done).toBe(false);
    expect(ticked.asian).toEqual(SEED_SHOP.sections.asian);
    expect(ticked.thisWeek).toEqual([]);

    const cleared = toggleShopItem(ticked, "fewWeeks", "seed-soap-refill");
    expect(cleared.fewWeeks.find((item) => item.id === "seed-soap-refill")?.done).toBe(false);
  });

  it("adds a trimmed item and clears ticks without deleting labels", () => {
    const added = addShopItem(
      SEED_SHOP.sections,
      "thisWeek",
      { label: "  Birthday cake candles  " },
      "candles",
    );
    expect(added.thisWeek).toEqual([
      { id: "candles", label: "Birthday cake candles", done: false },
    ]);

    const ticked = toggleShopItem(added, "fewWeeks", "seed-olive-oil");
    const uncleared = clearShopTicks(ticked, "fewWeeks");
    expect(uncleared.fewWeeks.find((item) => item.id === "seed-olive-oil")).toMatchObject({
      label: "Olive oil",
      done: false,
    });
    expect(uncleared.fewWeeks.map((item) => item.label)).toEqual(
      SEED_SHOP.sections.fewWeeks.map((item) => item.label),
    );
    expect(uncleared.thisWeek).toHaveLength(1);
  });

  it("parses documents and applies toggle, add, and clear mutations", () => {
    const doc = shopDocument(SEED_SHOP.sections, "2026-09-26T00:00:00.000Z");
    expect(parseShopDocument(doc)).toEqual(doc);
    expect(parseShopDocument({ nope: true })).toBeNull();
    expect(parseShopDocument(null)).toBeNull();

    expect(parseShopMutation({ op: "toggle", section: "asian", id: "seed-fish-sauce" })).toEqual({
      op: "toggle",
      section: "asian",
      id: "seed-fish-sauce",
    });
    expect(parseShopMutation({ op: "add", section: "thisWeek", label: "  " })).toBeNull();
    expect(parseShopMutation({ op: "nope" })).toBeNull();

    const toggled = applyShopMutation(
      doc,
      { op: "toggle", section: "asian", id: "seed-fish-sauce" },
      "2026-09-26T01:00:00.000Z",
    );
    expect(toggled?.updatedAt).toBe("2026-09-26T01:00:00.000Z");
    expect(toggled?.sections.asian[0]).toMatchObject({ id: "seed-fish-sauce", done: true });
    expect(applyShopMutation(doc, { op: "toggle", section: "asian", id: "missing" })).toBeNull();

    const added = applyShopMutation(
      doc,
      { op: "add", section: "thisWeek", label: "Lemons", note: " for the weekend " },
      "2026-09-26T02:00:00.000Z",
    );
    expect(added?.sections.thisWeek).toEqual([
      { id: expect.any(String), label: "Lemons", done: false, note: "for the weekend" },
    ]);

    const cleared = applyShopMutation(
      toggled!,
      { op: "clear", section: "asian" },
      "2026-09-26T03:00:00.000Z",
    );
    expect(cleared?.sections.asian.find((item) => item.id === "seed-fish-sauce")?.done).toBe(false);
    expect(cleared?.sections.asian).toHaveLength(doc.sections.asian.length);
  });

  it("copies a standing item into this week without removing or unchecking the source", () => {
    const doc = shopDocument(SEED_SHOP.sections, "2026-09-26T00:00:00.000Z");
    const ticked = applyShopMutation(
      doc,
      { op: "toggle", section: "fewWeeks", id: "seed-olive-oil" },
      "2026-09-26T01:00:00.000Z",
    );
    expect(ticked).not.toBeNull();

    expect(parseShopMutation({ op: "needThisWeek", section: "fewWeeks", id: "seed-olive-oil" })).toEqual({
      op: "needThisWeek",
      section: "fewWeeks",
      id: "seed-olive-oil",
    });
    expect(parseShopMutation({ op: "needThisWeek", section: "thisWeek", id: "seed-olive-oil" })).toBeNull();

    const copied = applyShopMutation(
      ticked!,
      { op: "needThisWeek", section: "fewWeeks", id: "seed-olive-oil" },
      "2026-09-26T02:00:00.000Z",
    );
    expect(copied?.sections.fewWeeks.find((item) => item.id === "seed-olive-oil")).toMatchObject({
      label: "Olive oil",
      done: true,
    });
    expect(copied?.sections.fewWeeks).toHaveLength(doc.sections.fewWeeks.length);
    expect(copied?.sections.thisWeek).toEqual([
      { id: expect.any(String), label: "Olive oil", done: false },
    ]);

    const withNote = applyShopMutation(
      doc,
      { op: "needThisWeek", section: "asian", id: "seed-tamarind" },
      "2026-09-26T03:00:00.000Z",
    );
    expect(withNote?.sections.asian.find((item) => item.id === "seed-tamarind")).toMatchObject({
      label: "Tamarind paste (or sugar-free sinigang mix)",
      done: false,
      note: "Ran out",
    });
    expect(withNote?.sections.thisWeek[0]).toMatchObject({
      label: "Tamarind paste (or sugar-free sinigang mix)",
      done: false,
      note: "Ran out",
    });
    expect(withNote?.sections.asian).toHaveLength(doc.sections.asian.length);
  });

  it("does not duplicate a label already on this week, and ticks stay independent", () => {
    const doc = shopDocument(SEED_SHOP.sections, "2026-09-26T00:00:00.000Z");
    const copied = applyShopMutation(
      doc,
      { op: "needThisWeek", section: "fewWeeks", id: "seed-soap-refill" },
      "2026-09-26T01:00:00.000Z",
    );
    expect(copied).not.toBeNull();
    const copyId = copied!.sections.thisWeek[0]!.id;

    const again = applyShopMutation(
      copied!,
      { op: "needThisWeek", section: "fewWeeks", id: "seed-soap-refill" },
      "2026-09-26T02:00:00.000Z",
    );
    expect(again?.sections.thisWeek).toHaveLength(1);
    expect(again?.sections.fewWeeks.map((item) => item.id)).toEqual(
      doc.sections.fewWeeks.map((item) => item.id),
    );

    const lower = applyShopMutation(
      doc,
      { op: "add", section: "thisWeek", label: "soap refill" },
      "2026-09-26T03:00:00.000Z",
    );
    const noDupe = applyShopMutation(
      lower!,
      { op: "needThisWeek", section: "fewWeeks", id: "seed-soap-refill" },
      "2026-09-26T04:00:00.000Z",
    );
    expect(noDupe?.sections.thisWeek).toHaveLength(1);
    expect(noDupe?.sections.thisWeek[0]?.label).toBe("soap refill");

    const tickedCopy = applyShopMutation(
      copied!,
      { op: "toggle", section: "thisWeek", id: copyId },
      "2026-09-26T05:00:00.000Z",
    );
    expect(tickedCopy?.sections.thisWeek[0]?.done).toBe(true);
    expect(tickedCopy?.sections.fewWeeks.find((item) => item.id === "seed-soap-refill")?.done).toBe(
      false,
    );
    expect(applyShopMutation(doc, { op: "needThisWeek", section: "asian", id: "missing" })).toBeNull();
  });
});
