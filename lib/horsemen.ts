export type HorsemanCard = {
  id: string;
  horseman: string;
  definition: string;
  antidote: string;
  antidoteDefinition: string;
  soundsLike: string;
  tryInstead: string;
  exampleLabel: string;
};

const GENERIC = "Generic examples — not our words.";

export const HORSEMEN: HorsemanCard[] = [
  {
    id: "criticism",
    horseman: "Criticism",
    definition: "Verbally attacking personality or character.",
    antidote: "Gentle start-up",
    antidoteDefinition: "Talk about your feelings using I statements and express a positive need.",
    soundsLike: "You always talk about yourself. Why are you always so selfish?",
    tryInstead:
      "I'm feeling left out of our talk tonight and I need to vent. Can we please talk about my day?",
    exampleLabel: GENERIC,
  },
  {
    id: "contempt",
    horseman: "Contempt",
    definition: "Attacking sense of self with an intent to insult or abuse.",
    antidote: "Build culture of appreciation",
    antidoteDefinition:
      "Remind yourself of your partner's positive qualities and find gratitude for positive actions.",
    soundsLike: "You forgot again? Ugh. You are so incredibly lazy.",
    tryInstead:
      "I understand you've been busy lately, but could you please remember to load the dishwasher when I work late? I'd appreciate it.",
    exampleLabel: GENERIC,
  },
  {
    id: "defensiveness",
    horseman: "Defensiveness",
    definition: "Victimizing yourself to ward off a perceived attack and reverse the blame.",
    antidote: "Take responsibility",
    antidoteDefinition: "Accept your partner's perspective and offer an apology for any wrongdoing.",
    soundsLike:
      "It's not my fault we're late. It's your fault since you always get dressed at the last second.",
    tryInstead:
      "I don't like being late, but you're right. We don't always have to leave so early. I can be a little more flexible.",
    exampleLabel: GENERIC,
  },
  {
    id: "stonewalling",
    horseman: "Stonewalling",
    definition: "Withdrawing to avoid conflict and convey disapproval, distance, and separation.",
    antidote: "Physiological self-soothing",
    antidoteDefinition: "Take a break and spend that time doing something soothing and distracting.",
    soundsLike: "Silence, whatever, leaving without a return time, or shutting down.",
    tryInstead:
      "I'm feeling overwhelmed and I need to take a break. Can you give me twenty minutes and then we can talk?",
    exampleLabel: GENERIC,
  },
];
