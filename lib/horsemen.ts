export type HorsemanCard = {
  id: string;
  icon: string;
  horseman: string;
  definition: string;
  antidote: string;
  antidoteDefinition: string;
  originalDefinition: string;
  originalAntidote: string;
  soundsLike: string;
  tryInstead: string;
  exampleLabel: string;
};

const GENERIC = "Generic examples — not our words.";

export const HORSEMEN: HorsemanCard[] = [
  {
    id: "criticism",
    icon: "💬",
    horseman: "Criticism",
    definition: "Attacking who they are, not what they did.",
    antidote: "Gentle start-up",
    antidoteDefinition: "Say how you feel and what you need, using I.",
    originalDefinition: "Verbally attacking personality or character.",
    originalAntidote:
      "Gentle start-up: Talk about your feelings using I statements and express a positive need.",
    soundsLike: "You always talk about yourself. Why are you always so selfish?",
    tryInstead:
      "I'm feeling left out of our talk tonight and I need to vent. Can we please talk about my day?",
    exampleLabel: GENERIC,
  },
  {
    id: "contempt",
    icon: "🙄",
    horseman: "Contempt",
    definition: "Putting them down: mocking, eye-rolling, sarcasm, name-calling.",
    antidote: "Appreciation",
    antidoteDefinition: "Notice and say the good things, often.",
    originalDefinition: "Attacking sense of self with an intent to insult or abuse.",
    originalAntidote:
      "Build culture of appreciation: Remind yourself of your partner's positive qualities and find gratitude for positive actions.",
    soundsLike: "You forgot again? Ugh. You are so incredibly lazy.",
    tryInstead:
      "I understand you've been busy lately, but could you please remember to load the dishwasher when I work late? I'd appreciate it.",
    exampleLabel: GENERIC,
  },
  {
    id: "defensiveness",
    icon: "🛡️",
    horseman: "Defensiveness",
    definition: "Excuses or blaming back to dodge it.",
    antidote: "Take responsibility",
    antidoteDefinition: "Own your part, even a small bit, and say sorry.",
    originalDefinition: "Victimizing yourself to ward off a perceived attack and reverse the blame.",
    originalAntidote:
      "Take responsibility: Accept your partner's perspective and offer an apology for any wrongdoing.",
    soundsLike:
      "It's not my fault we're late. It's your fault since you always get dressed at the last second.",
    tryInstead:
      "I don't like being late, but you're right. We don't always have to leave so early. I can be a little more flexible.",
    exampleLabel: GENERIC,
  },
  {
    id: "stonewalling",
    icon: "🧱",
    horseman: "Stonewalling",
    definition: "Shutting down or going silent to avoid it.",
    antidote: "Self-soothe",
    antidoteDefinition: "Say you need a break (20+ mins), calm down, then come back.",
    originalDefinition: "Withdrawing to avoid conflict and convey disapproval, distance, and separation.",
    originalAntidote:
      "Physiological self-soothing: Take a break and spend that time doing something soothing and distracting.",
    soundsLike: "Silence, whatever, leaving without a return time, or shutting down.",
    tryInstead:
      "I'm feeling overwhelmed and I need to take a break. Can you give me twenty minutes and then we can talk?",
    exampleLabel: GENERIC,
  },
];
