export const HOMES_STORAGE_KEY = "kusina:homes:v1";
export const HOMES_KV_KEY = HOMES_STORAGE_KEY;
export const HOMES_VIEWER_STORAGE_KEY = "kusina:homes:viewer";

export type HomePerson = "ian" | "abby";
export type HomeVoteChoice = "no" | "maybe" | "yes";
export type HomeListingStatus = "live" | "gone" | "also";
export type HomesFilter = "all" | "matches" | "open" | "unvoted";

export type HomeVote = {
  choice: HomeVoteChoice;
  updatedAt: string;
};

export type HomeListing = {
  id: string;
  address: string;
  area: string;
  price: number;
  beds: number;
  type: string;
  url?: string;
  blurb: string;
  status?: HomeListingStatus;
  votes: {
    ian?: HomeVote;
    abby?: HomeVote;
  };
};

export type HomeWeek = {
  id: string;
  label: string;
  summary?: string;
  createdAt: string;
  listings: HomeListing[];
};

export type HomesDocument = {
  version: 1;
  weeks: HomeWeek[];
};

export type HomeVoteDraft = {
  listingId: string;
  person: HomePerson;
  choice: HomeVoteChoice;
};

export const HOME_PERSONS: HomePerson[] = ["ian", "abby"];
export const HOME_PERSON_LABELS: Record<HomePerson, string> = {
  ian: "Ian",
  abby: "Abby",
};
export const HOME_VOTE_CHOICES: HomeVoteChoice[] = ["no", "maybe", "yes"];
export const HOME_VOTE_LABELS: Record<HomeVoteChoice, string> = {
  no: "No",
  maybe: "Maybe",
  yes: "Yes",
};

const VOTE_RANK: Record<HomeVoteChoice, number> = {
  no: 0,
  maybe: 1,
  yes: 2,
};

export const SEED_HOMES_WEEK: HomeWeek = {
  id: "2026-W39",
  label: "Week of 21 Sep 2026",
  summary:
    "Still thin for genuine 4-beds under ~£290k in Kelvindale itself. Best live stock is strong 3-bed houses on the Knightswood / Anniesland edge, plus one true Kelvindale mid-terrace in band. Value’s sitting on the Knightswood edge right now. Kelvindale proper still starts ~£315k+ (Weymouth / Endfield / Manchester Drive). Dorchester Avenue £255k Sold STC.",
  createdAt: "2026-09-21T12:00:00.000Z",
  listings: [
    {
      id: "archerhill-road-knightswood",
      address: "Archerhill Road, Knightswood",
      area: "Knightswood",
      price: 269995,
      beds: 3,
      type: "semi",
      url: "https://www.rightmove.co.uk/properties/93127215",
      blurb:
        "Floored loft (possible 4th), gated multi-car driveway, big rear garden, by Knightswood Park.",
      status: "live",
      votes: {},
    },
    {
      id: "124-alderman-road-knightswood",
      address: "124 Alderman Road, Knightswood",
      area: "Knightswood",
      price: 260000,
      beds: 3,
      type: "semi",
      url: "https://www.rightmove.co.uk/properties/92586177",
      blurb: "Extended/refurbished ~1,023 sq ft, large driveway + wraparound garden.",
      status: "live",
      votes: {},
    },
    {
      id: "kelvindale-road-kelvindale",
      address: "Kelvindale Road, Kelvindale",
      area: "Kelvindale",
      price: 245000,
      beds: 3,
      type: "mid-terrace",
      url: "https://mqestateagents.co.uk/buy/103280010762",
      blurb: "Only true Kelvindale house clearly in £240–290k; attic potential, front & rear gardens.",
      status: "live",
      votes: {},
    },
    {
      id: "243-alderman-road",
      address: "243 Alderman Road",
      area: "Knightswood",
      price: 260000,
      beds: 3,
      type: "semi",
      blurb:
        "Offers over £260k. Was a 4-bed, now marketed as 3 — worth a peek if you want more space in that pocket.",
      status: "also",
      votes: {},
    },
  ],
};

function isHomePerson(value: unknown): value is HomePerson {
  return value === "ian" || value === "abby";
}

function isHomeVoteChoice(value: unknown): value is HomeVoteChoice {
  return value === "no" || value === "maybe" || value === "yes";
}

function isHomeListingStatus(value: unknown): value is HomeListingStatus {
  return value === "live" || value === "gone" || value === "also";
}

function isHomeVote(value: unknown): value is HomeVote {
  if (!value || typeof value !== "object") {
    return false;
  }

  const vote = value as Partial<HomeVote>;
  return isHomeVoteChoice(vote.choice) && typeof vote.updatedAt === "string" && vote.updatedAt.length > 0;
}

function parseVotes(value: unknown): HomeListing["votes"] | null {
  if (value == null) {
    return {};
  }
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as { ian?: unknown; abby?: unknown };
  const votes: HomeListing["votes"] = {};
  if (raw.ian !== undefined) {
    if (!isHomeVote(raw.ian)) {
      return null;
    }
    votes.ian = raw.ian;
  }
  if (raw.abby !== undefined) {
    if (!isHomeVote(raw.abby)) {
      return null;
    }
    votes.abby = raw.abby;
  }

  return votes;
}

function isValidListing(value: unknown): value is HomeListing {
  if (!value || typeof value !== "object") {
    return false;
  }

  const listing = value as Partial<HomeListing>;
  if (typeof listing.id !== "string" || listing.id.length === 0) {
    return false;
  }
  if (typeof listing.address !== "string" || listing.address.trim().length === 0) {
    return false;
  }
  if (typeof listing.area !== "string" || listing.area.trim().length === 0) {
    return false;
  }
  if (typeof listing.price !== "number" || !Number.isFinite(listing.price) || listing.price <= 0) {
    return false;
  }
  if (typeof listing.beds !== "number" || !Number.isInteger(listing.beds) || listing.beds <= 0) {
    return false;
  }
  if (typeof listing.type !== "string" || listing.type.trim().length === 0) {
    return false;
  }
  if (listing.url !== undefined && (typeof listing.url !== "string" || listing.url.trim().length === 0)) {
    return false;
  }
  if (typeof listing.blurb !== "string" || listing.blurb.trim().length === 0) {
    return false;
  }
  if (listing.status !== undefined && !isHomeListingStatus(listing.status)) {
    return false;
  }
  if (parseVotes(listing.votes) == null) {
    return false;
  }

  return true;
}

function normalizeListing(value: HomeListing): HomeListing {
  const listing: HomeListing = {
    id: value.id,
    address: value.address.trim(),
    area: value.area.trim(),
    price: value.price,
    beds: value.beds,
    type: value.type.trim(),
    blurb: value.blurb.trim(),
    votes: parseVotes(value.votes) ?? {},
  };

  const url = value.url?.trim();
  if (url) {
    listing.url = url;
  }
  if (value.status) {
    listing.status = value.status;
  }

  return listing;
}

function isValidWeek(value: unknown): value is HomeWeek {
  if (!value || typeof value !== "object") {
    return false;
  }

  const week = value as Partial<HomeWeek>;
  if (typeof week.id !== "string" || week.id.length === 0) {
    return false;
  }
  if (typeof week.label !== "string" || week.label.trim().length === 0) {
    return false;
  }
  if (week.summary !== undefined && typeof week.summary !== "string") {
    return false;
  }
  if (typeof week.createdAt !== "string" || week.createdAt.length === 0) {
    return false;
  }
  if (!Array.isArray(week.listings) || week.listings.length === 0 || !week.listings.every(isValidListing)) {
    return false;
  }

  return true;
}

function normalizeWeek(week: HomeWeek): HomeWeek {
  const next: HomeWeek = {
    id: week.id,
    label: week.label.trim(),
    createdAt: week.createdAt,
    listings: week.listings.map(normalizeListing),
  };
  const summary = week.summary?.trim();
  if (summary) {
    next.summary = summary;
  }
  return next;
}

export function parseVoteDraft(value: unknown): HomeVoteDraft | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const draft = value as Partial<HomeVoteDraft>;
  if (typeof draft.listingId !== "string" || draft.listingId.trim().length === 0) {
    return null;
  }
  if (!isHomePerson(draft.person) || !isHomeVoteChoice(draft.choice)) {
    return null;
  }

  return {
    listingId: draft.listingId.trim(),
    person: draft.person,
    choice: draft.choice,
  };
}

export function parseWeekDraft(value: unknown): HomeWeek | null {
  if (!isValidWeek(value)) {
    return null;
  }

  return normalizeWeek(value);
}

export function parseHomesWeeks(value: unknown): HomeWeek[] | null {
  if (!Array.isArray(value) || !value.every(isValidWeek)) {
    return null;
  }

  return sortWeeksNewestFirst(value.map(normalizeWeek));
}

export function parseHomesDocument(value: unknown): HomesDocument | null {
  if (value == null) {
    return null;
  }

  if (Array.isArray(value)) {
    const weeks = parseHomesWeeks(value);
    return weeks ? { version: 1, weeks } : null;
  }

  if (typeof value !== "object") {
    return null;
  }

  const doc = value as Partial<HomesDocument> & { weeks?: unknown };
  if (doc.version !== undefined && doc.version !== 1) {
    return null;
  }

  const weeks = parseHomesWeeks(doc.weeks);
  if (!weeks) {
    return null;
  }

  return { version: 1, weeks };
}

export function homesDocument(weeks: HomeWeek[]): HomesDocument {
  return { version: 1, weeks: sortWeeksNewestFirst(weeks) };
}

export function sortWeeksNewestFirst(weeks: HomeWeek[]): HomeWeek[] {
  return [...weeks].sort((left, right) => {
    if (left.createdAt !== right.createdAt) {
      return left.createdAt < right.createdAt ? 1 : -1;
    }
    return left.id < right.id ? 1 : -1;
  });
}

export function isListingMatch(listing: HomeListing): boolean {
  return listing.votes.ian?.choice === "yes" && listing.votes.abby?.choice === "yes";
}

export function isListingOpen(listing: HomeListing): boolean {
  const ian = listing.votes.ian?.choice;
  const abby = listing.votes.abby?.choice;
  return Boolean(ian && abby && VOTE_RANK[ian] >= 1 && VOTE_RANK[abby] >= 1);
}

export function isUnvotedBy(listing: HomeListing, person: HomePerson): boolean {
  return listing.votes[person] == null;
}

export function filterListings(
  listings: HomeListing[],
  filter: HomesFilter,
  viewer: HomePerson,
): HomeListing[] {
  if (filter === "matches") {
    return listings.filter(isListingMatch);
  }
  if (filter === "open") {
    return listings.filter(isListingOpen);
  }
  if (filter === "unvoted") {
    return listings.filter((listing) => isUnvotedBy(listing, viewer));
  }
  return listings;
}

export function applyVote(
  weeks: HomeWeek[],
  listingId: string,
  person: HomePerson,
  choice: HomeVoteChoice,
  updatedAt: string = new Date().toISOString(),
): HomeWeek[] {
  return weeks.map((week) => ({
    ...week,
    listings: week.listings.map((listing) => {
      if (listing.id !== listingId) {
        return listing;
      }

      return {
        ...listing,
        votes: {
          ...listing.votes,
          [person]: { choice, updatedAt },
        },
      };
    }),
  }));
}

export function findListing(weeks: HomeWeek[], listingId: string): HomeListing | undefined {
  for (const week of weeks) {
    const listing = week.listings.find((item) => item.id === listingId);
    if (listing) {
      return listing;
    }
  }
  return undefined;
}

export function formatHomePrice(pounds: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(pounds);
}

export function loadHomes(): HomeWeek[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(HOMES_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    return parseHomesDocument(JSON.parse(raw))?.weeks ?? [];
  } catch {
    return [];
  }
}

export function saveHomes(weeks: HomeWeek[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(HOMES_STORAGE_KEY, JSON.stringify(homesDocument(weeks)));
  } catch {
    // Ignore quota / private mode.
  }
}

export function loadViewer(): HomePerson {
  if (typeof window === "undefined") {
    return "ian";
  }

  try {
    const raw = window.localStorage.getItem(HOMES_VIEWER_STORAGE_KEY);
    return isHomePerson(raw) ? raw : "ian";
  } catch {
    return "ian";
  }
}

export function saveViewer(person: HomePerson): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(HOMES_VIEWER_STORAGE_KEY, person);
  } catch {
    // Ignore quota / private mode.
  }
}
