import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { HORSEMEN } from "./horsemen";
import { EMPATHY_PROMPTS, GUIDE_PATH } from "./us-guide";

describe("horsemen reference", () => {
  it("keeps the summary chart and generic sounds-like / try-instead pairs", () => {
    expect(HORSEMEN.map((card) => [card.horseman, card.antidote])).toEqual([
      ["Criticism", "Gentle start-up"],
      ["Contempt", "Appreciation"],
      ["Defensiveness", "Take responsibility"],
      ["Stonewalling", "Self-soothe"],
    ]);
    expect(HORSEMEN.map((card) => card.definition)).toEqual([
      "Attacking who they are, not what they did.",
      "Putting them down: mocking, eye-rolling, sarcasm, name-calling.",
      "Excuses or blaming back to dodge it.",
      "Shutting down or going silent to avoid it.",
    ]);
    expect(HORSEMEN.map((card) => card.antidoteDefinition)).toEqual([
      "Say how you feel and what you need, using I.",
      "Notice and say the good things, often.",
      "Own your part, even a small bit, and say sorry.",
      "Say you need a break (20+ mins), calm down, then come back.",
    ]);
    expect(HORSEMEN[0]?.originalDefinition).toMatch(/personality or character/i);
    expect(HORSEMEN[1]?.originalAntidote).toMatch(/Build culture of appreciation/i);
    expect(HORSEMEN[3]?.originalAntidote).toMatch(/Physiological self-soothing/i);
    expect(HORSEMEN.every((card) => card.icon.length > 0)).toBe(true);
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