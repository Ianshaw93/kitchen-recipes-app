import { describe, expect, it } from "vitest";
import { formatGbp, getTrip, trips } from "./trips";

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
    expect(formatGbp(1200)).toBe("£1,200");
    expect(formatGbp(1500)).toBe("£1,500");
    expect(formatGbp(2000)).toBe("£2,000");
  });

  it("lists Thailand in the trips bank", () => {
    expect(trips.map((trip) => trip.slug)).toEqual(["thailand"]);
  });
});
