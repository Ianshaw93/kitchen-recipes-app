export const SPEAKER_LISTENER_CREDIT = "From our therapist's Speaker-Listener handout";

export const SPEAKER_PROMPT =
  "Raising something? Use I statements about one specific situation, say how you feel, no blame.";

export const PLAN_NOTEPAD_PROMPT = "Write: what I'll do, by when, and when we'll check in";

export type ListeningStep = {
  id: string;
  text: string;
  optional?: boolean;
};

export type ListeningCallout = {
  tone: "do" | "dont";
  label: "Do" | "Don't";
  tickable: boolean;
  steps: ListeningStep[];
};

export type ListeningGroup = {
  id: string;
  title: string;
  note?: string;
  steps: ListeningStep[];
  callouts?: ListeningCallout[];
};

export const LISTENING_GROUPS: ListeningGroup[] = [
  {
    id: "prepare",
    title: "Listener step 1 · Prepare yourself",
    note: "Your job is to listen, not to argue your side.",
    steps: [
      { id: "prepare-agenda", text: "Postpone your own agenda." },
      { id: "prepare-tune", text: "Tune into your partner's world." },
      {
        id: "prepare-pain",
        text: "Hear their pain, even if you disagree with the details.",
      },
      {
        id: "prepare-perspective",
        text: "Understand from their perspective, not your own.",
      },
    ],
  },
  {
    id: "attune",
    title: "Listener step 2 · Attune",
    note: "Stay with what they're feeling. You only need to understand.",
    steps: [],
    callouts: [
      {
        tone: "do",
        label: "Do",
        tickable: true,
        steps: [
          { id: "attune-open", text: "Ask open-ended questions." },
          {
            id: "attune-clarify",
            text: "Ask them to say more. “Tell me the story of that.” “What do your values tell you about this?”",
          },
        ],
      },
      {
        tone: "dont",
        label: "Don't",
        tickable: false,
        steps: [
          { id: "attune-critical", text: "Don't be critical, judgmental, or defensive." },
          { id: "attune-minimise", text: "Don't minimise their feelings." },
          { id: "attune-fix", text: "Don't try to fix or cheer them up." },
          { id: "attune-superior", text: "No put-downs, and don't speak from a place of superiority." },
        ],
      },
    ],
  },
  {
    id: "summarise",
    title: "Listener step 3 · Summarise and reflect",
    steps: [
      {
        id: "summarise-reflect",
        text: "Summarise and reflect back what you hear, in your own words, until the speaker is satisfied.",
      },
    ],
  },
  {
    id: "validate",
    title: "Listener step 4 · Validate and show empathy",
    note: "Validating isn't agreeing.",
    steps: [
      {
        id: "validate-example",
        text: "“It makes sense to me how you saw this. I get it. I can see why this upset you.”",
      },
      { id: "validate-understood", text: "Ask “Do you feel understood?”" },
      {
        id: "validate-better",
        text: "If not: “What do I need to know to understand your perspective better?”",
      },
      { id: "validate-else", text: "Then ask “Did I get it?” and “Is there anything else?”" },
    ],
  },
  {
    id: "if-relevant",
    title: "If relevant",
    note: "Only if this conversation needs it. Skipping these does not leave the talk unfinished.",
    steps: [
      {
        id: "if-accountability",
        optional: true,
        text: "Take accountability. Own your part, even a slice. Apologise for the impact, without “but”.",
      },
      {
        id: "if-plan",
        optional: true,
        text: "Plan to stop it happening again. Agree specific actions, who does each, and when you'll check back in.",
      },
    ],
  },
];

export function tickableListeningSteps(groups: ListeningGroup[] = LISTENING_GROUPS): ListeningStep[] {
  return groups.flatMap((group) => [
    ...group.steps,
    ...(group.callouts ?? []).filter((callout) => callout.tickable).flatMap((callout) => callout.steps),
  ]);
}

export function requiredListeningSteps(groups: ListeningGroup[] = LISTENING_GROUPS): ListeningStep[] {
  return tickableListeningSteps(groups).filter((step) => !step.optional);
}

export function listeningStepCount(): number {
  return requiredListeningSteps().length;
}
