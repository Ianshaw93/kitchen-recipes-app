export type TripStatus = "planning" | "booked" | "done";

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
  spendOn: string;
};

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
    spendOn: "RBS Platinum joint + Going Abroad (0% FX)",
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
