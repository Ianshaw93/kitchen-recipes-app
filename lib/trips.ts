export type TripStatus = "planning" | "booked" | "done";
export type Traveller = "Ian" | "Abby";
export type BudgetBandId = "lean" | "comfort" | "buffer";
export type TripLegKind = "route" | "alt";

export type BudgetCategoryId =
  | "rooms"
  | "food"
  | "transport"
  | "activities"
  | "misc"
  | "contingency";

export type TripPhoto = {
  imageSrc: string;
  imageAlt: string;
  imageCredit: string;
};

export type TripContribution = {
  id: string;
  traveller: Traveller;
  amountGbp: number;
  date: string;
  note?: string;
};

export type AlreadyPaidItem = {
  label: string;
  status: "paid";
  note: string;
};

export type TripLeg = TripPhoto & {
  id: string;
  name: string;
  nights: number;
  share: number;
  kind: TripLegKind;
  altOf?: string;
  note: string;
};

export type Trip = {
  slug: string;
  title: string;
  travellers: string;
  duration: string;
  status: TripStatus;
  accent: "brick" | "leaf" | "gold" | "ocean" | "ginger" | "chili";
  summary: string;
  notes: string[];
  budgetOnGroundLeanGbp: number;
  budgetOnGroundComfortGbp: number;
  budgetBufferGbp: number;
  selectedBand: BudgetBandId;
  spendOn: string;
  hero: TripPhoto;
  alreadyPaid: AlreadyPaidItem[];
  savingsSplit: Record<Traveller, number>;
  contributions: TripContribution[];
  legs: TripLeg[];
};

export type SavingsSummary = {
  ianSavedGbp: number;
  abbySavedGbp: number;
  combinedGbp: number;
  targetGbp: number;
  remainingGbp: number;
  gapGbp: number;
  ianShareOfTargetGbp: number;
  abbyShareOfTargetGbp: number;
  ianPct: number;
  abbyPct: number;
  remainingPct: number;
};

export type ContributionDraft = {
  traveller: Traveller;
  amountGbp: number;
  note?: string;
};

/*
  On-ground category mix for two people ~2 weeks in north Thailand (midrange).
  Percents are of the selected on-ground band (lean £1,200 / comfort £1,500 /
  buffer £2,000). Flights are already paid and sit outside this split.

  Rooms / accommodation  40%
  Food                   25%
  Local transport        15%  (sleeper, songthaews, Grab)
  Activities             10%
  Misc / tips / SIM       5%
  Contingency             5%  (kept as its own line, not Misc)
*/
export const BUDGET_CATEGORY_SPLIT: Record<BudgetCategoryId, number> = {
  rooms: 0.4,
  food: 0.25,
  transport: 0.15,
  activities: 0.1,
  misc: 0.05,
  contingency: 0.05,
};

export const BUDGET_CATEGORY_LABELS: Record<BudgetCategoryId, string> = {
  rooms: "Rooms / accommodation",
  food: "Food",
  transport: "Local transport",
  activities: "Activities",
  misc: "Misc / tips / SIM",
  contingency: "Contingency",
};

export const BUDGET_CATEGORY_ORDER: BudgetCategoryId[] = [
  "rooms",
  "food",
  "transport",
  "activities",
  "misc",
  "contingency",
];

export const BUDGET_BANDS: {
  id: BudgetBandId;
  label: string;
  hint: string;
}[] = [
  { id: "lean", label: "Lean on-ground", hint: "Tight, still covers beds and bowls." },
  { id: "comfort", label: "Comfort", hint: "A bit more room for food and taxis." },
  {
    id: "buffer",
    label: "Buffer / stretch",
    hint: "Between us both — Ian's 28 Aug note.",
  },
];

function unsplashPhoto(id: string) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`;
}

export const trips: Trip[] = [
  {
    slug: "thailand",
    title: "Thailand (honey / baby moon)",
    travellers: "Ian + Abby",
    duration: "~2 weeks",
    status: "planning",
    accent: "ocean",
    summary:
      "Honey / baby moon. Flights paid. Bangkok, then north — skip Phuket.",
    notes: [
      "Flights already paid.",
      "No Phuket. No alcohol.",
      "Route idea: Bangkok → overnight sleeper → Chiang Mai → Chiang Rai or Koh Kood.",
    ],
    budgetOnGroundLeanGbp: 1200,
    budgetOnGroundComfortGbp: 1500,
    budgetBufferGbp: 2000,
    selectedBand: "buffer",
    spendOn: "RBS Platinum joint + Going Abroad (0% FX)",
    // Photo: Wat Arun at sunset from the Chao Phraya — Unsplash
    hero: {
      imageSrc: unsplashPhoto("photo-1575348021159-aa1d0d95eac5"),
      imageAlt: "Wat Arun on the Chao Phraya at sunset in Bangkok",
      imageCredit: "Photo on Unsplash",
    },
    alreadyPaid: [
      {
        label: "Flights",
        status: "paid",
        note: "Already paid — not in the save target.",
      },
    ],
    // Default fair-share is 50/50 of the chosen band. Thailand seed is Abby-soft:
    // Ian takes 60% of the buffer (£1,200), Abby 40% (£800).
    savingsSplit: { Ian: 0.6, Abby: 0.4 },
    contributions: [
      {
        id: "seed-ian-400",
        traveller: "Ian",
        amountGbp: 400,
        date: "2026-08-28",
        note: "Example log — not a bank feed.",
      },
      {
        id: "seed-abby-200",
        traveller: "Abby",
        amountGbp: 200,
        date: "2026-09-01",
        note: "Example log — not a bank feed.",
      },
    ],
    /*
      Route-leg shares of the selected on-ground band (not the Koh Kood alt):
      Bangkok 22% · sleeper 8% · Chiang Mai 38% · Chiang Rai 32%.
      ~14 nights: 3 Bangkok + 1 sleeper + 5 Chiang Mai + 5 Chiang Rai.
    */
    legs: [
      {
        id: "bangkok",
        name: "Bangkok",
        nights: 3,
        share: 0.22,
        kind: "route",
        note: "Arrive, recover, street food. No big nightlife.",
        imageSrc: unsplashPhoto("photo-1668107678791-125a58552942"),
        imageAlt: "Wat Arun prang glowing in a Bangkok sunset",
        imageCredit: "Photo on Unsplash",
      },
      {
        id: "sleeper",
        name: "Overnight sleeper",
        nights: 1,
        share: 0.08,
        kind: "route",
        note: "Bangkok to Chiang Mai. Berths count as the night's bed.",
        imageSrc: unsplashPhoto("photo-1675856900136-dac1bb128262"),
        imageAlt: "Train platforms and tracks at a Bangkok station",
        imageCredit: "Photo on Unsplash",
      },
      {
        id: "chiang-mai",
        name: "Chiang Mai",
        nights: 5,
        share: 0.38,
        kind: "route",
        note: "Old town, temples, slower days.",
        imageSrc: unsplashPhoto("photo-1682826556362-2c06b7ac75c5"),
        imageAlt: "Golden chedi and wooden temple halls in Chiang Mai old town",
        imageCredit: "Photo on Unsplash",
      },
      {
        id: "chiang-rai",
        name: "Chiang Rai",
        nights: 5,
        share: 0.32,
        kind: "route",
        note: "North option after Chiang Mai.",
        imageSrc: unsplashPhoto("photo-1671188893377-ee825a53d27f"),
        imageAlt: "White Temple reflected in still water in Chiang Rai",
        imageCredit: "Photo on Unsplash",
      },
      {
        id: "koh-kood",
        name: "Koh Kood",
        nights: 5,
        share: 0.32,
        kind: "alt",
        altOf: "chiang-rai",
        note: "Island alternative to Chiang Rai. Pick one — not both.",
        imageSrc: unsplashPhoto("photo-1483683804023-6ccdb62f86ef"),
        imageAlt: "Turquoise water and a sandy spit on a Thai island, standing in for Koh Kood",
        imageCredit: "Photo on Unsplash",
      },
    ],
  },
];

const bySlug = new Map(trips.map((trip) => [trip.slug, trip]));

export function getTrip(slug: string) {
  return bySlug.get(slug);
}

export function getTripSlugs() {
  return trips.map((trip) => trip.slug);
}

export function formatGbp(amount: number) {
  return `£${amount.toLocaleString("en-GB")}`;
}

export function selectedBandAmount(trip: Trip, band: BudgetBandId = trip.selectedBand) {
  if (band === "lean") {
    return trip.budgetOnGroundLeanGbp;
  }
  if (band === "comfort") {
    return trip.budgetOnGroundComfortGbp;
  }
  return trip.budgetBufferGbp;
}

export function allocateGbp<K extends string>(
  total: number,
  shares: Record<K, number>,
): Record<K, number> {
  const keys = Object.keys(shares) as K[];
  const rows = keys.map((key) => {
    const exact = total * shares[key];
    const amount = Math.floor(exact + Number.EPSILON);
    return { key, amount, remainder: exact - amount };
  });

  let leftover = total - rows.reduce((sum, row) => sum + row.amount, 0);
  const ranked = [...rows].sort((left, right) => right.remainder - left.remainder);
  let index = 0;
  while (leftover > 0 && ranked.length > 0) {
    ranked[index % ranked.length].amount += 1;
    leftover -= 1;
    index += 1;
  }

  const result = {} as Record<K, number>;
  for (const row of rows) {
    result[row.key] = row.amount;
  }
  return result;
}

export function categoryAmountsForBand(trip: Trip, band: BudgetBandId) {
  return allocateGbp(selectedBandAmount(trip, band), BUDGET_CATEGORY_SPLIT);
}

export function routeLegShares(trip: Trip) {
  const shares: Record<string, number> = {};
  for (const leg of trip.legs) {
    if (leg.kind === "route") {
      shares[leg.id] = leg.share;
    }
  }
  return shares;
}

export function legAmountForBand(trip: Trip, leg: TripLeg, band: BudgetBandId) {
  const amounts = allocateGbp(selectedBandAmount(trip, band), routeLegShares(trip));
  if (leg.kind === "alt" && leg.altOf) {
    return amounts[leg.altOf] ?? 0;
  }
  return amounts[leg.id] ?? 0;
}

export function summariseSavings(
  contributions: TripContribution[],
  targetGbp: number,
  split: Record<Traveller, number>,
): SavingsSummary {
  let ianSavedGbp = 0;
  let abbySavedGbp = 0;
  for (const row of contributions) {
    if (row.traveller === "Ian") {
      ianSavedGbp += row.amountGbp;
    } else {
      abbySavedGbp += row.amountGbp;
    }
  }

  const combinedGbp = ianSavedGbp + abbySavedGbp;
  const remainingGbp = Math.max(0, targetGbp - combinedGbp);
  const ianShareOfTargetGbp = Math.round(targetGbp * split.Ian);
  const abbyShareOfTargetGbp = targetGbp - ianShareOfTargetGbp;
  const denom = Math.max(targetGbp, 1);

  return {
    ianSavedGbp,
    abbySavedGbp,
    combinedGbp,
    targetGbp,
    remainingGbp,
    gapGbp: remainingGbp,
    ianShareOfTargetGbp,
    abbyShareOfTargetGbp,
    ianPct: (ianSavedGbp / denom) * 100,
    abbyPct: (abbySavedGbp / denom) * 100,
    remainingPct: (remainingGbp / denom) * 100,
  };
}

export function addContribution(
  extras: TripContribution[],
  draft: ContributionDraft,
): TripContribution[] {
  const entry: TripContribution = {
    id: crypto.randomUUID(),
    traveller: draft.traveller,
    amountGbp: draft.amountGbp,
    date: todayISODate(),
  };
  const note = draft.note?.trim();
  if (note) {
    entry.note = note;
  }
  return [...extras, entry];
}

export function todayISODate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parsePounds(input: string): number | null {
  const trimmed = input.trim().replace(/^£\s?/, "").replace(/,/g, "");
  if (!trimmed) {
    return null;
  }
  const pounds = Number(trimmed);
  if (!Number.isFinite(pounds) || pounds <= 0) {
    return null;
  }
  return Math.round(pounds);
}
