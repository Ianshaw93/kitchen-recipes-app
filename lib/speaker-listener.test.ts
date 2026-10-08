import { describe, expect, it } from "vitest";
import {
  LISTENING_GROUPS,
  SPEAKER_LISTENER_CREDIT,
  listeningStepCount,
  listeningSteps,
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

  it("replaces the old 14 steps with the handout groups", () => {
    expect(LISTENING_GROUPS.map((item) => item.title)).toEqual([
      "Speaker rules",
      "Listener step 1 · Prepare yourself",
      "Listener step 2 · Attune",
      "Listener step 3 · Summarise and reflect",
      "Listener step 4 · Validate and show empathy",
      "Switch roles",
    ]);
    const steps = listeningSteps();
    expect(listeningStepCount()).toBe(steps.length);
    expect(steps.length).toBeGreaterThan(14);
    expect(new Set(steps.map((step) => step.id)).size).toBe(steps.length);
    expect(steps.map((step) => step.id)).not.toContain("setup-1");
  });

  it("lists the speaker rules", () => {
    const text = group("speaker").steps.map((step) => step.text).join("\n");
    expect(text).toMatch(/honestly share your feelings and beliefs on this one issue/i);
    expect(text).toMatch(/no blaming, criticism, or contempt/i);
    expect(text).toMatch(/no “you” statements/i);
    expect(text).toMatch(/only “I” statements about a specific situation/i);
    expect(text).toMatch(/talk about your feelings/i);
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

  it("ends with a clear switch-roles step", () => {
    const step = group("switch").steps[0];
    expect(step.text).toMatch(/switch roles/i);
  });
});
