export type HorsemanCard = {
  id: string;
  icon: string;
  horseman: string;
  definition: string;
  positive: string;
  positiveLooksLike: string;
  sayItLike: string;
  everydayHabit: string;
  gottmanAntidote: string;
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
    positive: "Raise it gently",
    positiveLooksLike:
      'Talk about the situation, not the person. Say how you feel and what you\'d like, starting with "I".',
    sayItLike: '"I felt stressed when the dishes piled up. Could we sort out who does them tonight?"',
    everydayHabit: "Bring small things up early and kindly, before they build up.",
    gottmanAntidote: "Gentle start-up",
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
    positive: "Show appreciation",
    positiveLooksLike:
      "Notice what they do right and say it out loud. Keep respect in your tone, even when you're annoyed.",
    sayItLike: '"Thank you for sorting dinner, I really noticed that."',
    everydayHabit: "Say one specific thanks or kind thing each day. Small things, often.",
    gottmanAntidote: "Appreciation",
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
    positive: "Get curious",
    positiveLooksLike:
      "Don't jump in to defend yourself. Put your view on hold and get curious about theirs. Ask questions until you really get it. Then test your own view against what you've learned, and let that become your new view, even if it means changing your mind. Own your part where it fits.",
    sayItLike: '"Help me understand how that felt for you. What am I missing?"',
    everydayHabit: 'Ask at least one "what\'s it like from your side?" question before giving your view.',
    gottmanAntidote: "Take responsibility",
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
    positive: "Pause and come back",
    positiveLooksLike:
      "When you feel flooded, say so and take a break of 20+ minutes. Do something calming, not replaying the argument, then come back.",
    sayItLike: '"I\'m getting overwhelmed. Can we take 20 minutes and pick this up at 8:30?"',
    everydayHabit: "Agree a pause signal ahead of time, and always come back when you said you would.",
    gottmanAntidote: "Self-soothe",
    originalDefinition: "Withdrawing to avoid conflict and convey disapproval, distance, and separation.",
    originalAntidote:
      "Physiological self-soothing: Take a break and spend that time doing something soothing and distracting.",
    soundsLike: "Silence, whatever, leaving without a return time, or shutting down.",
    tryInstead:
      "I'm feeling overwhelmed and I need to take a break. Can you give me twenty minutes and then we can talk?",
    exampleLabel: GENERIC,
  },
];
