import { describe, expect, it } from "vitest";
import {
  allocateGbp,
  BUDGET_CATEGORY_SPLIT,
  categoryAmountsForBand,
  formatGbp,
  getTrip,
  routeLegShares,
  selectedBandAmount,
  summariseSavings,
  trips,
} from "./trips";

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

describe("trips bank", () => {
  it("seeds Thailand honey / baby moon with the agreed budget bands", () => {
    const trip = getTrip("thailand");

    expect(trip).toBeDefined();
    expect(trip?.slug).toBe("thailand");
    expect(trip?.title).toBe("Thailand (honey / baby moon)");
    expect(trip?.travellers).toBe("Ian + Abby");
    expect(trip?.duration).toMatch(/2 weeks/i);
    expect(trip?.status).toBe("planning");
    expect(trip?.budgetOnGroundLeanGbp).toBe(1200);
    expect(trip?.budgetOnGroundComfortGbp).toBe(1500);
    expect(trip?.budgetBufferGbp).toBe(2000);
    expect(trip?.selectedBand).toBe("buffer");
    expect(trip?.spendOn).toMatch(/RBS Platinum/i);
    expect(trip?.spendOn).toMatch(/Going Abroad/i);
    expect(trip?.spendOn).toMatch(/0% FX/i);

    const notes = trip?.notes.join(" ") ?? "";
    expect(notes).toMatch(/flights already paid/i);
    expect(notes).toMatch(/no Phuket/i);
    expect(notes).toMatch(/no alcohol/i);
    expect(notes).toMatch(/Bangkok/);
    expect(notes).toMatch(/Chiang Mai/);
    expect(notes).toMatch(/Chiang Rai|Koh Kood/);
  });

  it("formats whole-pound budget bands with a pounds sign", () => {
    expect(formatGbp(400)).toBe("£400");
    expect(formatGbp(1200)).toBe("£1,200");
    expect(formatGbp(1500)).toBe("£1,500");
    expect(formatGbp(2000)).toBe("£2,000");
  });

  it("lists Thailand in the trips bank", () => {
    expect(trips.map((trip) => trip.slug)).toEqual(["thailand"]);
  });
});

describe("budget split", () => {
  it("uses the documented on-ground category mix and sums to 100%", () => {
    expect(BUDGET_CATEGORY_SPLIT).toEqual({
      rooms: 0.4,
      food: 0.25,
      transport: 0.15,
      activities: 0.1,
      misc: 0.05,
      contingency: 0.05,
    });
    expect(sum(Object.values(BUDGET_CATEGORY_SPLIT))).toBe(1);
  });

  it("allocates each band into whole pounds that sum to the band total", () => {
    const trip = getTrip("thailand");
    expect(trip).toBeDefined();
    if (!trip) {
      return;
    }

    for (const band of ["lean", "comfort", "buffer"] as const) {
      const amounts = categoryAmountsForBand(trip, band);
      expect(sum(Object.values(amounts))).toBe(selectedBandAmount(trip, band));
    }

    expect(categoryAmountsForBand(trip, "buffer").rooms).toBe(800);
    expect(categoryAmountsForBand(trip, "buffer").contingency).toBe(100);
    expect(categoryAmountsForBand(trip, "lean").rooms).toBe(480);
  });

  it("keeps contingency as its own category, not misc", () => {
    expect(Object.keys(BUDGET_CATEGORY_SPLIT)).toContain("contingency");
    expect(Object.keys(BUDGET_CATEGORY_SPLIT)).toContain("misc");
  });

  it("splits route legs (not the Koh Kood alt) across the selected band", () => {
    const trip = getTrip("thailand");
    expect(trip).toBeDefined();
    if (!trip) {
      return;
    }

    const shares = routeLegShares(trip);
    expect(sum(Object.values(shares))).toBeCloseTo(1);
    expect(allocateGbp(2000, shares)).toMatchObject({
      bangkok: 440,
      sleeper: 160,
      "chiang-mai": 760,
      "chiang-rai": 640,
    });
    expect(sum(Object.values(allocateGbp(2000, shares)))).toBe(2000);

    const names = trip.legs.map((leg) => leg.name);
    expect(names).toEqual(
      expect.arrayContaining(["Bangkok", "Overnight sleeper", "Chiang Mai", "Chiang Rai", "Koh Kood"]),
    );
    expect(trip.legs.find((leg) => leg.id === "chiang-rai")?.kind).toBe("route");
    expect(trip.legs.find((leg) => leg.id === "koh-kood")?.kind).toBe("alt");
  });
});

describe("shared savings", () => {
  it("seeds Ian £400 and Abby £200 toward the £2,000 buffer target, Abby-soft split", () => {
    const trip = getTrip("thailand");
    expect(trip).toBeDefined();
    if (!trip) {
      return;
    }

    expect(trip.savingsSplit).toEqual({ Ian: 0.6, Abby: 0.4 });
    const summary = summariseSavings(trip.contributions, selectedBandAmount(trip, trip.selectedBand), trip.savingsSplit);

    expect(summary.ianSavedGbp).toBe(400);
    expect(summary.abbySavedGbp).toBe(200);
    expect(summary.combinedGbp).toBe(600);
    expect(summary.targetGbp).toBe(2000);
    expect(summary.gapGbp).toBe(1400);
    expect(summary.ianShareOfTargetGbp).toBe(1200);
    expect(summary.abbyShareOfTargetGbp).toBe(800);
  });

  it("does not put paid flights into the save target", () => {
    const trip = getTrip("thailand");
    expect(trip?.alreadyPaid.some((item) => /flights/i.test(item.label) && item.status === "paid")).toBe(
      true,
    );
    expect(selectedBandAmount(trip!, "buffer")).toBe(2000);
  });
});

describe("place photos", () => {
  it("seeds a hero and per-leg Unsplash images with alt text", () => {
    const trip = getTrip("thailand");
    expect(trip).toBeDefined();
    if (!trip) {
      return;
    }

    expect(trip.hero.imageSrc).toMatch(/^https:\/\/images\.unsplash\.com\//);
    expect(trip.hero.imageAlt.length).toBeGreaterThan(8);

    for (const leg of trip.legs) {
      expect(leg.imageSrc).toMatch(/^https:\/\/images\.unsplash\.com\//);
      expect(leg.imageAlt.length).toBeGreaterThan(8);
    }
  });
});
