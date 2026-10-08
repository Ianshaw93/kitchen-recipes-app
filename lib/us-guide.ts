export const GUIDE_PATH = "/us/guide";

/** Solo journaling ticks stay on this phone. They do not share the Together checklist. */
export const GUIDE_LISTENING_KEY = "kusina:checked:steps:us-guide-listening";

export const GUIDE_PATTERN_LINE = "Name the pattern, not the person.";

export type EmpathyPrompt = {
  id: string;
  prompt: string;
};

export const EMPATHY_PROMPTS: EmpathyPrompt[] = [
  { id: "feeling", prompt: "What might Ian have been feeling?" },
  { id: "day", prompt: "What was going on for him that day?" },
  { id: "shoes", prompt: "What would I want if I were in his shoes?" },
  { id: "asked", prompt: "What did I need, and did I ask for it gently?" },
  { id: "next", prompt: "What will I bring to our next sit-down?" },
];
