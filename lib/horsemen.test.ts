import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { HORSEMEN } from "./horsemen";
import { EMPATHY_PROMPTS, GUIDE_PATH } from "./us-guide";

describe("horsemen reference", () => {
  it("keeps the summary chart and generic sounds-like / try-instead pairs", () => {
    expect(HORSEMEN.map((card) => [card.horseman, card.antidote])).toEqual([
      ["Criticism", "Gentle start-up"],
      ["Contempt", "Build culture of appreciation"],
      ["Defensiveness", "Take responsibility"],
      ["Stonewalling", "Physiological self-soothing"],
    ]);
    expect(HORSEMEN[0]?.definition).toMatch(/personality or character/i);
    expect(HORSEMEN[0]?.soundsLike).toMatch(/You always talk about yourself/);
    expect(HORSEMEN[0]?.tryInstead).toMatch(/I.m feeling left out/);
    expect(HORSEMEN[1]?.soundsLike).toMatch(/lazy/i);
    expect(HORSEMEN[2]?.tryInstead).toMatch(/more flexible/i);
    expect(HORSEMEN[3]?.tryInstead).toMatch(/twenty minutes/i);
    expect(HORSEMEN.every((card) => /generic/i.test(card.exampleLabel))).toBe(true);
  });

  it("does not seed horseman incidents or private doc text", () => {
    const bundled = [
      JSON.stringify(HORSEMEN),
      JSON.stringify(EMPATHY_PROMPTS),
      readFileSync(path.join(process.cwd(), "lib/horsemen.ts"), "utf8"),
      readFileSync(path.join(process.cwd(), "lib/us-guide.ts"), "utf8"),
    ].join("\n");
    expect(bundled).not.toMatch(/cinema/i);
    expect(bundled).not.toMatch(/karaoke/i);
    expect(bundled).not.toMatch(/8\/12\/25/);
    expect(GUIDE_PATH).toBe("/us/guide");
    expect(EMPATHY_PROMPTS.map((prompt) => prompt.prompt)).toEqual([
      "What might Ian have been feeling?",
      "What was going on for him that day?",
      "What would I want if I were in his shoes?",
      "What did I need, and did I ask for it gently?",
      "What will I bring to our next sit-down?",
    ]);
  });
});