import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { HORSEMEN } from "./horsemen";
import { EMPATHY_PROMPTS, GUIDE_PATH } from "./us-guide";

describe("horsemen reference", () => {
  it("pairs each horseman with a positive equivalent in plain words", () => {
    expect(HORSEMEN.map((card) => [card.horseman, card.positive])).toEqual([
      ["Criticism", "Raise it gently"],
      ["Contempt", "Show appreciation"],
      ["Defensiveness", "Get curious"],
      ["Stonewalling", "Pause and come back"],
    ]);
    expect(HORSEMEN.map((card) => card.positiveLooksLike)).toEqual([
      'Talk about the situation, not the person. Say how you feel and what you\'d like, starting with "I".',
      "Notice what they do right and say it out loud. Keep respect in your tone, even when you're annoyed.",
      "Don't jump in to defend yourself. Put your view on hold and get curious about theirs. Ask questions until you really get it. Then test your own view against what you've learned, and let that become your new view, even if it means changing your mind. Own your part where it fits.",
      "When you feel flooded, say so and take a break of 20+ minutes. Do something calming, not replaying the argument, then come back.",
    ]);
    expect(HORSEMEN.map((card) => card.sayItLike)).toEqual([
      '"I felt stressed when the dishes piled up. Could we sort out who does them tonight?"',
      '"Thank you for sorting dinner, I really noticed that."',
      '"Help me understand how that felt for you. What am I missing?"',
      '"I\'m getting overwhelmed. Can we take 20 minutes and pick this up at 8:30?"',
    ]);
    expect(HORSEMEN.map((card) => card.everydayHabit)).toEqual([
      "Bring small things up early and kindly, before they build up.",
      "Say one specific thanks or kind thing each day. Small things, often.",
      'Ask at least one "what\'s it like from your side?" question before giving your view.',
      "Agree a pause signal ahead of time, and always come back when you said you would.",
    ]);
  });

  it("keeps Gottman's antidote names for the original wording", () => {
    expect(HORSEMEN.map((card) => card.gottmanAntidote)).toEqual([
      "Gentle start-up",
      "Appreciation",
      "Take responsibility",
      "Self-soothe",
    ]);
  });

  it("keeps the summary chart and generic sounds-like / try-instead pairs", () => {
    expect(HORSEMEN.map((card) => card.definition)).toEqual([
      "Attacking who they are, not what they did.",
      "Putting them down: mocking, eye-rolling, sarcasm, name-calling.",
      "Excuses or blaming back to dodge it.",
      "Shutting down or going silent to avoid it.",
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