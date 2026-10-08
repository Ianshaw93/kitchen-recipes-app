export const SPEAKER_LISTENER_CREDIT = "From our therapist's Speaker-Listener handout";

export type ListeningStep = {
  id: string;
  text: string;
};

export type ListeningCallout = {
  tone: "do" | "dont";
  label: "Do" | "Don't";
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
    id: "speaker",
    title: "Speaker rules",
    note: "Your task is to honestly talk about your feelings and beliefs on this one issue.",
    steps: [
      {
        id: "speaker-honest",
        text: "Honestly share your feelings and beliefs on this one issue.",
      },
      {
        id: "speaker-no-blame",
        text: "No blaming, criticism, or contempt.",
      },
      {
        id: "speaker-no-you",
        text: "No “you” statements.",
      },
      {
        id: "speaker-i",
        text: "Only “I” statements about a specific situation.",
      },
      {
        id: "speaker-feelings",
        text: "Talk about your feelings.",
      },
    ],
  },
  {
    id: "prepare",
    title: "Listener step 1 · Prepare yourself",
    note: "Do not argue for your point of view. Your task is to listen and ask questions.",
    steps: [
      {
        id: "prepare-agenda",
        text: "Postpone your own agenda.",
      },
      {
        id: "prepare-tune",
        text: "Tune into your partner's world.",
      },
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
    note: "Hear the speaker's feelings and be present. Your goal is just to understand.",
    steps: [],
    callouts: [
      {
        tone: "do",
        label: "Do",
        steps: [
          {
            id: "attune-open",
            text: "Ask open-ended questions.",
          },
          {
            id: "attune-clarify",
            text: "Ask for clarification and elaboration. “Tell me the story of that.” “What do your values tell you about this?”",
          },
        ],
      },
      {
        tone: "dont",
        label: "Don't",
        steps: [
          {
            id: "attune-critical",
            text: "Be critical, judgmental, or defensive.",
          },
          {
            id: "attune-minimise",
            text: "Minimise their feelings.",
          },
          {
            id: "attune-fix",
            text: "Take responsibility for their feelings, or try to fix or cheer them up.",
          },
          {
            id: "attune-superior",
            text: "Put-downs, or approaching the discussion from a place of superiority.",
          },
        ],
      },
    ],
  },
  {
    id: "summarise",
    title: "Listener step 3 · Summarise and reflect",
    note: "Witness what you heard. Restate it in your own words.",
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
    note: "Validating isn't agreeing. It means you can understand even a part of their experience.",
    steps: [
      {
        id: "validate-example",
        text: "“It makes sense to me how you saw this and what your perceptions and needs were. I get it. I can see why this upset you.”",
      },
      {
        id: "validate-understood",
        text: "Ask “Do you feel understood?”",
      },
      {
        id: "validate-better",
        text: "If not: “What do I need to know to understand your perspective better?”",
      },
      {
        id: "validate-else",
        text: "Then ask “Did I get it?” and “Is there anything else?”",
      },
    ],
  },
  {
    id: "switch",
    title: "Switch roles",
    note: "When the speaker feels understood, swap. Run the same steps with the other person speaking.",
    steps: [
      {
        id: "switch-roles",
        text: "Switch roles.",
      },
    ],
  },
];

export function listeningSteps(groups: ListeningGroup[] = LISTENING_GROUPS): ListeningStep[] {
  return groups.flatMap((group) => [
    ...group.steps,
    ...(group.callouts ?? []).flatMap((callout) => callout.steps),
  ]);
}

export function listeningStepCount(): number {
  return listeningSteps().length;
}
