import { describe, expect, it } from "vitest";
import {
  LISTENING_GROUPS,
  PLAN_NOTEPAD_PROMPT,
  SPEAKER_LISTENER_CREDIT,
  SPEAKER_PROMPT,
  listeningStepCount,
  requiredListeningSteps,
} from "./speaker-listener";

function group(id: string) {
  const found = LISTENING_GROUPS.find((item) => item.id === id);
  expect(found).toBeDefined();
  return found!;
}

describe("speaker-listener handout", () => {
  it("credits the therapist handout without naming a therapist", () => {
    expect(SPEAKER_LISTENER_CREDIT).toBe("From our therapist's Speaker-Listener handout");
  });

  it("keeps a short speaker line and the listener steps, without the drill", () => {
    expect(SPEAKER_PROMPT).toBe(
      "Raising something? Use I statements about one specific situation, say how you feel, no blame.",
    );
    expect(LISTENING_GROUPS.map((item) => item.id)).toEqual([
      "prepare",
      "attune",
      "summarise",
      "validate",
      "if-relevant",
    ]);
    expect(LISTENING_GROUPS.map((item) => item.title)).not.toContain("Speaker rules");
    expect(LISTENING_GROUPS.map((item) => item.title)).not.toContain("Switch roles");
    const required = requiredListeningSteps();
    expect(listeningStepCount()).toBe(required.length);
    expect(required.map((step) => step.id)).toEqual(
      expect.not.arrayContaining(["if-accountability", "if-plan", "speaker-honest", "switch-roles"]),
    );
    expect(new Set(required.map((step) => step.id)).size).toBe(required.length);
  });

  it("lists listener step 1, prepare yourself", () => {
    const text = group("prepare").steps.map((step) => step.text).join("\n");
    expect(text).toMatch(/postpone your own agenda/i);
    expect(text).toMatch(/tune into your partner's world/i);
    expect(text).toMatch(/hear their pain, even if you disagree with the details/i);
    expect(text).toMatch(/understand from their perspective, not your own/i);
  });

  it("splits attune into DO and DON'T callouts", () => {
    const attune = group("attune");
    expect(attune.callouts?.map((callout) => callout.tone)).toEqual(["do", "dont"]);
    const dos = attune.callouts![0].steps.map((step) => step.text).join("\n");
    const donts = attune.callouts![1].steps.map((step) => step.text).join("\n");
    expect(dos).toMatch(/ask open-ended questions/i);
    expect(dos).toMatch(/Tell me the story of that/);
    expect(dos).toMatch(/What do your values tell you about this/);
    expect(donts).toMatch(/critical, judgmental, or defensive/i);
    expect(donts).toMatch(/minimise their feelings/i);
    expect(donts).toMatch(/fix or cheer them up/i);
    expect(donts).toMatch(/superiority/i);
  });

  it("asks the listener to reflect until the speaker is satisfied", () => {
    const text = group("summarise").steps.map((step) => step.text).join("\n");
    expect(text).toMatch(/summarise and reflect back what you hear, in your own words/i);
    expect(text).toMatch(/until the speaker is satisfied/i);
  });

  it("treats validation as understanding, then checks it landed", () => {
    const validate = group("validate");
    expect(validate.note).toMatch(/validating isn't agreeing/i);
    const text = validate.steps.map((step) => step.text).join("\n");
    expect(text).toMatch(/It makes sense to me how you saw this/);
    expect(text).toMatch(/I can see why this upset you/);
    expect(text).toMatch(/Do you feel understood/);
    expect(text).toMatch(/What do I need to know to understand your perspective better/);
    expect(text).toMatch(/Did I get it/);
    expect(text).toMatch(/Is there anything else/);
  });

  it("marks accountability and a follow-up plan as optional", () => {
    const relevant = group("if-relevant");
    expect(relevant.title).toMatch(/if relevant/i);
    const text = relevant.steps.map((step) => step.text).join("\n");
    expect(text).toMatch(/take accountability/i);
    expect(text).toMatch(/own your part/i);
    expect(text).toMatch(/without “but”/i);
    expect(text).toMatch(/plan to stop it happening again/i);
    expect(text).toMatch(/who does each/i);
    expect(text).toMatch(/check back in/i);
    expect(relevant.steps.every((step) => step.optional)).toBe(true);
    expect(requiredListeningSteps().map((step) => step.id)).toEqual(
      expect.not.arrayContaining(relevant.steps.map((step) => step.id)),
    );
  });

  it("keeps Don't lines as reminders, not steps you tick", () => {
    const dont = group("attune").callouts?.find((callout) => callout.tone === "dont");
    expect(dont?.tickable).toBe(false);
    expect(PLAN_NOTEPAD_PROMPT).toBe("Write: what I'll do, by when, and when we'll check in");
  });
});
