export const RELATIONSHIP_PATH = "/us";
export const RELATIONSHIP_KV_KEY = "kusina:relationship:v1";
export const RELATIONSHIP_STORAGE_KEY = RELATIONSHIP_KV_KEY;
export const LISTENING_CHECKLIST_KEY = "kusina:checked:steps:us-listening";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type Person = "Ian" | "Avery";
export type Whose = Person | "Both";
export type WorkStatus = "open" | "practising" | "parked";
export type BehaviourPerson = "ian" | "avery";

export type MustHave = {
  id: string;
  weNeed: string;
  whyItMatters: string;
};

export type WillNot = {
  id: string;
  weWillNotAccept: string;
};

export type PersonalItem = {
  id: string;
  text: string;
};

export type BehaviourExample = {
  id: string;
  text: string;
  date?: string;
  tag?: string;
};

export type Takeaway = {
  id: string;
  date: string;
  speaker: Person;
  whatIHeard: string;
  whatTheyNeed: string;
  oneThingIllDo: string;
  whatINeed?: string;
};

export type WorkOnItem = {
  id: string;
  whose: Whose;
  theme: string;
  observableTry: string;
  lastTalked?: string;
  status: WorkStatus;
};

export type NonNegotiables = {
  mustHaves: MustHave[];
  willNots: WillNot[];
  ianPersonal: PersonalItem[];
  averyPersonal: PersonalItem[];
};

export type ReviewedTogether = {
  id: string;
  date: string;
  takeaways: string;
  standardsAgreed: string;
};

export type CheckInStandard = {
  id: string;
  text: string;
  reviewId?: string;
};

export type RelationshipDocument = {
  version: 2;
  updatedAt: string;
  toxicDocUrl: string;
  nonNegotiables: NonNegotiables;
  behaviourExamples: {
    ian: BehaviourExample[];
    avery: BehaviourExample[];
  };
  takeaways: Takeaway[];
  thingsToWorkOn: WorkOnItem[];
  reviews: ReviewedTogether[];
  checkInStandards: CheckInStandard[];
};

export type BehaviourDraft = {
  text: string;
  date?: string;
  tag?: string;
};

export type TakeawayDraft = {
  date: string;
  speaker: Person;
  whatIHeard: string;
  whatTheyNeed: string;
  oneThingIllDo: string;
  whatINeed?: string;
};

export type WorkOnDraft = {
  whose: Whose;
  theme: string;
  observableTry: string;
  lastTalked?: string;
  status: WorkStatus;
};

export type ListeningStep = {
  id: string;
  text: string;
};

export type ListeningGroup = {
  id: string;
  title: string;
  steps: ListeningStep[];
};

export const NON_NEGOTIABLE_CATEGORY_PROMPTS = [
  "communication & conflict",
  "emotional safety",
  "honesty/trust",
  "parenting/baby",
  "money",
  "household load",
  "intimacy/affection",
  "family boundaries",
  "health/pregnancy support",
  "time together vs alone",
] as const;

export const STATE_OF_THE_UNION_STEPS = [
  "Five appreciations each (or 2–3 if short on time).",
  "What went right this week.",
  "One issue (Speaker-Listener + takeaways).",
  "What can I do next week to help you feel more loved? — one concrete ask each.",
] as const;

export const LISTENING_GROUPS: ListeningGroup[] = [
  {
    id: "setup",
    title: "Setup",
    steps: [
      {
        id: "setup-1",
        text: "Pick one topic. Put phones face-down except this page.",
      },
      {
        id: "setup-2",
        text: "Choose who Speaks first. Listener holds the floor.",
      },
      {
        id: "setup-3",
        text: "Agree: Listener does not rebut, advise, or defend until they have the floor.",
      },
    ],
  },
  {
    id: "speaker",
    title: "Speaker",
    steps: [
      {
        id: "speaker-1",
        text: "Use short I statements: I feel ___ about ___ and I need ___.",
      },
      {
        id: "speaker-2",
        text: "One issue only. Pause every 1–2 sentences so Listener can mirror.",
      },
    ],
  },
  {
    id: "listener",
    title: "Listener",
    steps: [
      {
        id: "listener-1",
        text: "Full attention. No interrupting. Optional: jot keywords.",
      },
      {
        id: "listener-2",
        text: "Mirror: What I heard you say is ___. Did I get that?",
      },
      {
        id: "listener-3",
        text: "If not quite right, Speaker clarifies; Listener mirrors again.",
      },
      {
        id: "listener-4",
        text: "Validate (not necessarily agree): It makes sense you’d feel ___ about ___.",
      },
      {
        id: "listener-5",
        text: "Empathy guess: I imagine you might be feeling ___. Is that right?",
      },
      {
        id: "listener-6",
        text: "Ask Is there more? until Speaker says that’s all.",
      },
    ],
  },
  {
    id: "swap",
    title: "Swap",
    steps: [
      {
        id: "swap-1",
        text: "Switch roles. Repeat Speaker and Listener steps.",
      },
    ],
  },
  {
    id: "takeaways",
    title: "Takeaways",
    steps: [
      {
        id: "takeaways-1",
        text: "Fill the takeaways together (or each fills their own).",
      },
      {
        id: "takeaways-2",
        text: "Optional: one appreciation each before you close.",
      },
    ],
  },
];

export function emptyNonNegotiables(): NonNegotiables {
  return {
    mustHaves: [],
    willNots: [],
    ianPersonal: [],
    averyPersonal: [],
  };
}

export function emptyRelationshipDocument(updatedAt: string): RelationshipDocument {
  return {
    version: 2,
    updatedAt,
    toxicDocUrl: "",
    nonNegotiables: emptyNonNegotiables(),
    behaviourExamples: { ian: [], avery: [] },
    takeaways: [],
    thingsToWorkOn: [],
    reviews: [],
    checkInStandards: [],
  };
}

function example(
  id: string,
  text: string,
  date?: string,
  tag?: string,
): BehaviourExample {
  const item: BehaviourExample = { id, text };
  if (date) {
    item.date = date;
  }
  if (tag) {
    item.tag = tag;
  }
  return item;
}

function workOn(
  id: string,
  whose: Whose,
  theme: string,
  observableTry: string,
  extra: { lastTalked?: string; status?: WorkStatus } = {},
): WorkOnItem {
  const item: WorkOnItem = {
    id,
    whose,
    theme,
    observableTry,
    status: extra.status ?? "open",
  };
  if (extra.lastTalked) {
    item.lastTalked = extra.lastTalked;
  }
  return item;
}

export const SEED_RELATIONSHIP: RelationshipDocument = {
  version: 2,
  updatedAt: "2026-10-08T12:00:00.000Z",
  toxicDocUrl: "",
  nonNegotiables: emptyNonNegotiables(),
  behaviourExamples: {
    avery: [
      example(
        "avery-01",
        "Tuned in and offered a hug when Ian went quiet; they chilled watching Minority Report.",
        "2026-02-24",
        "kindness",
      ),
      example(
        "avery-02",
        "Bought into gratitude at dinner.",
        "2026-02-23",
        "gratitude",
      ),
      example(
        "avery-03",
        "Committed to gratitude at dinner times.",
        "2026-03-01",
        "gratitude",
      ),
      example(
        "avery-04",
        "Fun, kind, caring; does the lion's share of housework and wedding prep.",
        "2026-03-21",
        "support",
      ),
      example(
        "avery-05",
        "Caring; does the majority of cleaning and wedding organising.",
        "2026-03-24",
        "support",
      ),
      example(
        "avery-06",
        "Loving on a consistent basis.",
        "2026-03-25",
        "kindness",
      ),
      example(
        "avery-07",
        "Told Ian to get water when he coughed.",
        "2026-05-15",
        "kindness",
      ),
      example(
        "avery-08",
        "Grateful for Ian making her feel safe.",
        "2026-05-21",
        "gratitude",
      ),
      example(
        "avery-09",
        "Open to being consistent.",
        "2026-05-18",
      ),
      example(
        "avery-10",
        "Staying consistent with appreciation.",
        "2026-06-02",
        "gratitude",
      ),
      example(
        "avery-11",
        "Open to learning how best to eat (pregnancy).",
        "2026-06-15",
      ),
      example(
        "avery-12",
        "Not panicking / in control and comfortable about pregnancy.",
        "2026-06-17",
      ),
      example(
        "avery-13",
        "Strong mentally; lovingly took tonnes of chocolate out of her daily diet thinking about the baby.",
        "2026-06-29",
      ),
      example(
        "avery-14",
        "Feeling better about pregnancy.",
        "2026-06-10",
      ),
      example(
        "avery-15",
        "Staying strong / strong emotionally.",
        "2026-07-17",
      ),
      example(
        "avery-16",
        "Fun and loving consistently.",
        "2026-07-28",
        "kindness",
      ),
      example(
        "avery-17",
        "Open to thinking about Ian more / not just being in her head.",
        "2026-08-24",
      ),
      example(
        "avery-18",
        "Solid regroup — she's stopped thinking outside of her head.",
        "2026-08-23",
        "repair",
      ),
      example(
        "avery-19",
        "Open to being consistent with being loving.",
        "2026-08-30",
        "kindness",
      ),
      example(
        "avery-20",
        "Journaling (and later recording it / consistent).",
        "2026-08-29",
      ),
      example(
        "avery-21",
        "Being loving.",
        "2026-09-07",
        "kindness",
      ),
      example(
        "avery-22",
        "Filled in journaling calendar.",
        "2026-09-22",
      ),
      example(
        "avery-23",
        "Said thank you and was grateful when Ian spoke up about asking first (\"is it okay for you to do x\" vs \"you do x\").",
        "2026-09-22",
        "gratitude",
      ),
      example(
        "avery-24",
        "Open to active listening practice.",
        "2026-10-03",
      ),
      example(
        "avery-25",
        "Playful tickling / fun together — chasing up a street; Alex tickling Ian on Abby's behalf.",
      ),
      example(
        "avery-26",
        "Way more loving.",
        "2026-02-21",
        "kindness",
      ),
      example(
        "avery-27",
        "Supportive.",
        "2026-02-25",
        "support",
      ),
      example(
        "avery-28",
        "Trying to improve diet / do her best for the baby.",
        "2026-08-17",
      ),
      example(
        "avery-29",
        "Fun AF / loving / sweet / kind.",
        "2026-03-19",
        "kindness",
      ),
    ],
    ian: [
      example(
        "ian-01",
        "Approached Abby, asked how she was, waited until she moved to gratitude; coached Dan on positives + active listening.",
        "2026-05-21",
        "repair",
      ),
      example(
        "ian-02",
        "Wants feedback that Abby is being loving after \"I'm tired\" with no further communication.",
        "2026-02-21",
      ),
      example(
        "ian-03",
        "Lead grace/gratitude if Avery doesn't — big opportunity for her to build trust; can't be 5 days without.",
        "2026-05-20",
        "gratitude",
      ),
      example(
        "ian-04",
        "Pick up Avery's calls when possible — she's panicked about doing things right for the baby.",
        "2026-06-10",
        "support",
      ),
      example(
        "ian-05",
        "Learn from dad's anger; won't do that to kids; will work with wife if she ever does it.",
        "2026-07-25",
      ),
      example(
        "ian-06",
        "After regroup: remind Abby to assess thinking outside her head / communicate.",
        "2026-08-24",
        "repair",
      ),
      example(
        "ian-07",
        "Get Avery's loving calendar filled in; push physical/app calendar; check Abby consistent checking in with herself.",
        "2026-09-10",
      ),
      example(
        "ian-08",
        "Speak up about ask-before-tell (\"is it okay...\").",
        "2026-09-22",
        "repair",
      ),
      example(
        "ian-09",
        "Practice active listening (after Abby open to it).",
        "2026-10-03",
      ),
      example(
        "ian-10",
        "Bring relationship chats into Kusina — Google Doc, active listening + takeaways, things to work on, non-negotiables.",
        "2026-10-08",
      ),
      example(
        "ian-11",
        "Previously a lot of friction / pulling different directions; since they worked that out it's been so good; grown to work together / have fun.",
        undefined,
        "repair",
      ),
      example(
        "ian-12",
        "Avery love practice: remind herself she is loved; look for specific examples; feel the love; AND look at how she has been loving back.",
        "2026-06-08",
      ),
      example(
        "ian-13",
        "Connect appreciation practice with love.",
        "2026-06-29",
        "gratitude",
      ),
    ],
  },
  takeaways: [],
  thingsToWorkOn: [
    workOn(
      "work-gratitude-dinner",
      "Both",
      "Gratitude / grace at dinner",
      "Consistency; who leads.",
    ),
    workOn(
      "work-loving-calendar",
      "Both",
      "Loving calendar / journaling / \"am I thinking of Ian?\" check-ins",
      "Loving calendar / journaling / \"am I thinking of Ian?\" check-ins.",
    ),
    workOn(
      "work-active-listening",
      "Both",
      "Active listening practice",
      "Abby open as of 3 Oct.",
      { lastTalked: "2026-10-03" },
    ),
    workOn(
      "work-ask-before-tell",
      "Both",
      "Ask-before-tell vs directives",
      "\"Is it okay...\" vs \"you do x\".",
    ),
    workOn(
      "work-pick-up-calls",
      "Ian",
      "Pick up calls",
      "When Avery is anxious about baby tasks.",
    ),
    workOn(
      "work-anger",
      "Ian",
      "Anger management intergenerational commitment",
      "Learn from dad's anger; won't do that to kids; will work with wife if she ever does it.",
    ),
    workOn(
      "work-love-loop",
      "Avery",
      "Avery love loop",
      "Notice love received and love given back.",
      { lastTalked: "2026-06-08" },
    ),
  ],
  reviews: [],
  checkInStandards: [],
};

function isPerson(value: unknown): value is Person {
  return value === "Ian" || value === "Avery";
}

function isWhose(value: unknown): value is Whose {
  return value === "Ian" || value === "Avery" || value === "Both";
}

function isWorkStatus(value: unknown): value is WorkStatus {
  return value === "open" || value === "practising" || value === "parked";
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parsedOptionalDate(value: unknown): { ok: boolean; date?: string } {
  if (value === undefined || value === "") {
    return { ok: true };
  }
  if (typeof value === "string" && ISO_DATE_PATTERN.test(value)) {
    return { ok: true, date: value };
  }
  return { ok: false };
}

function parseMustHave(value: unknown): MustHave | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const item = value as Partial<MustHave>;
  if (!isNonEmptyString(item.id) || !isNonEmptyString(item.weNeed) || !isNonEmptyString(item.whyItMatters)) {
    return null;
  }
  return { id: item.id, weNeed: item.weNeed.trim(), whyItMatters: item.whyItMatters.trim() };
}

function parseWillNot(value: unknown): WillNot | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const item = value as Partial<WillNot>;
  if (!isNonEmptyString(item.id) || !isNonEmptyString(item.weWillNotAccept)) {
    return null;
  }
  return { id: item.id, weWillNotAccept: item.weWillNotAccept.trim() };
}

function parsePersonal(value: unknown): PersonalItem | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const item = value as Partial<PersonalItem>;
  if (!isNonEmptyString(item.id) || !isNonEmptyString(item.text)) {
    return null;
  }
  return { id: item.id, text: item.text.trim() };
}

function parseBehaviour(value: unknown): BehaviourExample | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const item = value as Partial<BehaviourExample>;
  if (!isNonEmptyString(item.id) || !isNonEmptyString(item.text)) {
    return null;
  }
  const date = parsedOptionalDate(item.date);
  if (!date.ok) {
    return null;
  }
  if (item.tag !== undefined && typeof item.tag !== "string") {
    return null;
  }
  const parsed: BehaviourExample = { id: item.id, text: item.text.trim() };
  if (date.date) {
    parsed.date = date.date;
  }
  const tag = item.tag?.trim();
  if (tag) {
    parsed.tag = tag;
  }
  return parsed;
}

function parseTakeaway(value: unknown): Takeaway | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const item = value as Partial<Takeaway>;
  if (!isNonEmptyString(item.id)) {
    return null;
  }
  if (typeof item.date !== "string" || !ISO_DATE_PATTERN.test(item.date)) {
    return null;
  }
  if (!isPerson(item.speaker)) {
    return null;
  }
  if (
    !isNonEmptyString(item.whatIHeard) ||
    !isNonEmptyString(item.whatTheyNeed) ||
    !isNonEmptyString(item.oneThingIllDo)
  ) {
    return null;
  }
  if (item.whatINeed !== undefined && typeof item.whatINeed !== "string") {
    return null;
  }
  const parsed: Takeaway = {
    id: item.id,
    date: item.date,
    speaker: item.speaker,
    whatIHeard: item.whatIHeard.trim(),
    whatTheyNeed: item.whatTheyNeed.trim(),
    oneThingIllDo: item.oneThingIllDo.trim(),
  };
  const need = item.whatINeed?.trim();
  if (need) {
    parsed.whatINeed = need;
  }
  return parsed;
}

function parseWorkOn(value: unknown): WorkOnItem | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const item = value as Partial<WorkOnItem>;
  if (!isNonEmptyString(item.id) || !isWhose(item.whose) || !isWorkStatus(item.status)) {
    return null;
  }
  if (!isNonEmptyString(item.theme) || !isNonEmptyString(item.observableTry)) {
    return null;
  }
  const lastTalked = parsedOptionalDate(item.lastTalked);
  if (!lastTalked.ok) {
    return null;
  }
  const parsed: WorkOnItem = {
    id: item.id,
    whose: item.whose,
    theme: item.theme.trim(),
    observableTry: item.observableTry.trim(),
    status: item.status,
  };
  if (lastTalked.date) {
    parsed.lastTalked = lastTalked.date;
  }
  return parsed;
}

function parseReview(value: unknown): ReviewedTogether | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const item = value as Partial<ReviewedTogether>;
  if (!isNonEmptyString(item.id) || !isNonEmptyString(item.takeaways)) {
    return null;
  }
  if (typeof item.date !== "string" || !ISO_DATE_PATTERN.test(item.date)) {
    return null;
  }
  if (typeof item.standardsAgreed !== "string") {
    return null;
  }
  return {
    id: item.id,
    date: item.date,
    takeaways: item.takeaways.trim(),
    standardsAgreed: item.standardsAgreed.trim(),
  };
}

function parseCheckInStandard(value: unknown): CheckInStandard | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const item = value as Partial<CheckInStandard>;
  if (!isNonEmptyString(item.id) || !isNonEmptyString(item.text)) {
    return null;
  }
  if (item.reviewId !== undefined && typeof item.reviewId !== "string") {
    return null;
  }
  const parsed: CheckInStandard = { id: item.id, text: item.text.trim() };
  if (item.reviewId) {
    parsed.reviewId = item.reviewId;
  }
  return parsed;
}

function parseList<T>(value: unknown, parseItem: (item: unknown) => T | null): T[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const items: T[] = [];
  for (const entry of value) {
    const parsed = parseItem(entry);
    if (!parsed) {
      return null;
    }
    items.push(parsed);
  }
  return items;
}

export function parseRelationshipDocument(value: unknown): RelationshipDocument | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const raw = value as {
    version?: unknown;
    updatedAt?: unknown;
    toxicDocUrl?: unknown;
    nonNegotiables?: NonNegotiables;
    behaviourExamples?: RelationshipDocument["behaviourExamples"];
    takeaways?: unknown;
    thingsToWorkOn?: unknown;
    reviews?: unknown;
    checkInStandards?: unknown;
  };
  if ((raw.version !== 1 && raw.version !== 2) || typeof raw.updatedAt !== "string" || raw.updatedAt.length === 0) {
    return null;
  }
  const version = raw.version;
  if (typeof raw.toxicDocUrl !== "string") {
    return null;
  }
  const lists = raw.nonNegotiables;
  if (!lists || typeof lists !== "object") {
    return null;
  }
  const mustHaves = parseList(lists.mustHaves, parseMustHave);
  const willNots = parseList(lists.willNots, parseWillNot);
  const ianPersonal = parseList(lists.ianPersonal, parsePersonal);
  const averyPersonal = parseList(lists.averyPersonal, parsePersonal);
  const examples = raw.behaviourExamples;
  if (!examples || typeof examples !== "object") {
    return null;
  }
  const ian = parseList(examples.ian, parseBehaviour);
  const avery = parseList(examples.avery, parseBehaviour);
  const takeaways = parseList(raw.takeaways, parseTakeaway);
  const thingsToWorkOn = parseList(raw.thingsToWorkOn, parseWorkOn);
  const reviews = version === 1 ? [] : parseList(raw.reviews, parseReview);
  const checkInStandards = version === 1 ? [] : parseList(raw.checkInStandards, parseCheckInStandard);
  if (
    !mustHaves ||
    !willNots ||
    !ianPersonal ||
    !averyPersonal ||
    !ian ||
    !avery ||
    !takeaways ||
    !thingsToWorkOn ||
    !reviews ||
    !checkInStandards
  ) {
    return null;
  }

  return {
    version: 2,
    updatedAt: raw.updatedAt,
    toxicDocUrl: raw.toxicDocUrl.trim(),
    nonNegotiables: { mustHaves, willNots, ianPersonal, averyPersonal },
    behaviourExamples: { ian, avery },
    takeaways,
    thingsToWorkOn,
    reviews,
    checkInStandards,
  };
}

export function relationshipNeedsMigration(value: unknown): boolean {
  return Boolean(value && typeof value === "object" && (value as { version?: unknown }).version === 1);
}

function stamp(document: RelationshipDocument): RelationshipDocument {
  return { ...document, updatedAt: new Date().toISOString() };
}

export function addMustHave(
  document: RelationshipDocument,
  draft: { weNeed: string; whyItMatters: string },
): RelationshipDocument {
  const item: MustHave = {
    id: crypto.randomUUID(),
    weNeed: draft.weNeed.trim(),
    whyItMatters: draft.whyItMatters.trim(),
  };
  return stamp({
    ...document,
    nonNegotiables: {
      ...document.nonNegotiables,
      mustHaves: [item, ...document.nonNegotiables.mustHaves],
    },
  });
}

export function addWillNot(
  document: RelationshipDocument,
  weWillNotAccept: string,
): RelationshipDocument {
  const item: WillNot = { id: crypto.randomUUID(), weWillNotAccept: weWillNotAccept.trim() };
  return stamp({
    ...document,
    nonNegotiables: {
      ...document.nonNegotiables,
      willNots: [item, ...document.nonNegotiables.willNots],
    },
  });
}

export function addPersonalItem(
  document: RelationshipDocument,
  whose: "ianPersonal" | "averyPersonal",
  text: string,
): RelationshipDocument {
  const item: PersonalItem = { id: crypto.randomUUID(), text: text.trim() };
  return stamp({
    ...document,
    nonNegotiables: {
      ...document.nonNegotiables,
      [whose]: [item, ...document.nonNegotiables[whose]],
    },
  });
}

export function addBehaviourExample(
  document: RelationshipDocument,
  person: BehaviourPerson,
  draft: BehaviourDraft,
): RelationshipDocument {
  const item = example(crypto.randomUUID(), draft.text.trim(), draft.date, draft.tag?.trim());
  return stamp({
    ...document,
    behaviourExamples: {
      ...document.behaviourExamples,
      [person]: [item, ...document.behaviourExamples[person]],
    },
  });
}

export function addTakeaway(
  document: RelationshipDocument,
  draft: TakeawayDraft,
): RelationshipDocument {
  const item: Takeaway = {
    id: crypto.randomUUID(),
    date: draft.date,
    speaker: draft.speaker,
    whatIHeard: draft.whatIHeard.trim(),
    whatTheyNeed: draft.whatTheyNeed.trim(),
    oneThingIllDo: draft.oneThingIllDo.trim(),
  };
  const need = draft.whatINeed?.trim();
  if (need) {
    item.whatINeed = need;
  }
  return stamp({
    ...document,
    takeaways: [item, ...document.takeaways],
  });
}

export function addWorkOn(document: RelationshipDocument, draft: WorkOnDraft): RelationshipDocument {
  const item = workOn(
    crypto.randomUUID(),
    draft.whose,
    draft.theme.trim(),
    draft.observableTry.trim(),
    { lastTalked: draft.lastTalked, status: draft.status },
  );
  return stamp({
    ...document,
    thingsToWorkOn: [item, ...document.thingsToWorkOn],
  });
}

export function removeMustHave(document: RelationshipDocument, id: string): RelationshipDocument {
  return stamp({
    ...document,
    nonNegotiables: {
      ...document.nonNegotiables,
      mustHaves: document.nonNegotiables.mustHaves.filter((item) => item.id !== id),
    },
  });
}

export function removeWillNot(document: RelationshipDocument, id: string): RelationshipDocument {
  return stamp({
    ...document,
    nonNegotiables: {
      ...document.nonNegotiables,
      willNots: document.nonNegotiables.willNots.filter((item) => item.id !== id),
    },
  });
}

export function removePersonalItem(
  document: RelationshipDocument,
  whose: "ianPersonal" | "averyPersonal",
  id: string,
): RelationshipDocument {
  return stamp({
    ...document,
    nonNegotiables: {
      ...document.nonNegotiables,
      [whose]: document.nonNegotiables[whose].filter((item) => item.id !== id),
    },
  });
}

export function removeBehaviourExample(
  document: RelationshipDocument,
  person: BehaviourPerson,
  id: string,
): RelationshipDocument {
  return stamp({
    ...document,
    behaviourExamples: {
      ...document.behaviourExamples,
      [person]: document.behaviourExamples[person].filter((item) => item.id !== id),
    },
  });
}

export function removeTakeaway(document: RelationshipDocument, id: string): RelationshipDocument {
  return stamp({
    ...document,
    takeaways: document.takeaways.filter((item) => item.id !== id),
  });
}

export function removeWorkOn(document: RelationshipDocument, id: string): RelationshipDocument {
  return stamp({
    ...document,
    thingsToWorkOn: document.thingsToWorkOn.filter((item) => item.id !== id),
  });
}

export function updateMustHave(
  document: RelationshipDocument,
  id: string,
  draft: { weNeed: string; whyItMatters: string },
): RelationshipDocument {
  return stamp({
    ...document,
    nonNegotiables: {
      ...document.nonNegotiables,
      mustHaves: document.nonNegotiables.mustHaves.map((item) =>
        item.id === id
          ? { ...item, weNeed: draft.weNeed.trim(), whyItMatters: draft.whyItMatters.trim() }
          : item,
      ),
    },
  });
}

export function updateWillNot(
  document: RelationshipDocument,
  id: string,
  weWillNotAccept: string,
): RelationshipDocument {
  return stamp({
    ...document,
    nonNegotiables: {
      ...document.nonNegotiables,
      willNots: document.nonNegotiables.willNots.map((item) =>
        item.id === id ? { ...item, weWillNotAccept: weWillNotAccept.trim() } : item,
      ),
    },
  });
}

export function updatePersonalItem(
  document: RelationshipDocument,
  whose: "ianPersonal" | "averyPersonal",
  id: string,
  text: string,
): RelationshipDocument {
  return stamp({
    ...document,
    nonNegotiables: {
      ...document.nonNegotiables,
      [whose]: document.nonNegotiables[whose].map((item) =>
        item.id === id ? { ...item, text: text.trim() } : item,
      ),
    },
  });
}

export function updateBehaviourExample(
  document: RelationshipDocument,
  person: BehaviourPerson,
  id: string,
  draft: BehaviourDraft,
): RelationshipDocument {
  return stamp({
    ...document,
    behaviourExamples: {
      ...document.behaviourExamples,
      [person]: document.behaviourExamples[person].map((item) => {
        if (item.id !== id) {
          return item;
        }
        return example(item.id, draft.text.trim(), draft.date, draft.tag?.trim());
      }),
    },
  });
}

export function updateWorkOn(
  document: RelationshipDocument,
  id: string,
  draft: WorkOnDraft,
): RelationshipDocument {
  return stamp({
    ...document,
    thingsToWorkOn: document.thingsToWorkOn.map((item) =>
      item.id === id
        ? workOn(item.id, draft.whose, draft.theme.trim(), draft.observableTry.trim(), {
            lastTalked: draft.lastTalked,
            status: draft.status,
          })
        : item,
    ),
  });
}

export function addReview(
  document: RelationshipDocument,
  draft: { date: string; takeaways: string; standardsAgreed?: string },
): RelationshipDocument {
  const item: ReviewedTogether = {
    id: crypto.randomUUID(),
    date: draft.date,
    takeaways: draft.takeaways.trim(),
    standardsAgreed: draft.standardsAgreed?.trim() ?? "",
  };
  return stamp({
    ...document,
    reviews: [item, ...document.reviews],
  });
}

export function addStandardsFromReview(
  document: RelationshipDocument,
  reviewId: string,
): RelationshipDocument {
  const review = document.reviews.find((item) => item.id === reviewId);
  if (!review) {
    return document;
  }
  const existing = new Set(document.checkInStandards.map((item) => item.text));
  const added: CheckInStandard[] = [];
  for (const line of review.standardsAgreed.split("\n")) {
    const text = line.trim();
    if (!text || existing.has(text)) {
      continue;
    }
    existing.add(text);
    added.push({ id: crypto.randomUUID(), text, reviewId });
  }
  if (added.length === 0) {
    return document;
  }
  return stamp({
    ...document,
    checkInStandards: [...document.checkInStandards, ...added],
  });
}

export function setToxicDocUrl(document: RelationshipDocument, url: string): RelationshipDocument {
  return stamp({ ...document, toxicDocUrl: url.trim() });
}

export function todayISODate(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatISODate(date: string): string {
  if (!ISO_DATE_PATTERN.test(date)) {
    return date;
  }
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const year = date.slice(0, 4);
  const monthName = months[Number(date.slice(5, 7)) - 1];
  const day = Number(date.slice(8, 10));
  if (!monthName) {
    return date;
  }
  return `${day} ${monthName} ${year}`;
}

export function loadRelationship(): RelationshipDocument | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(RELATIONSHIP_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return parseRelationshipDocument(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveRelationship(document: RelationshipDocument): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(RELATIONSHIP_STORAGE_KEY, JSON.stringify(document));
  } catch {
    // Ignore quota / private mode.
  }
}

export function listeningStepCount(): number {
  return LISTENING_GROUPS.reduce((total, group) => total + group.steps.length, 0);
}
