import { describe, expect, it } from "vitest";
import {
  HOMES_STORAGE_KEY,
  HOMES_VIEWER_STORAGE_KEY,
  SEED_HOMES_WEEK,
  applyVote,
  filterListings,
  formatHomePrice,
  homesDocument,
  isListingMatch,
  isListingOpen,
  isUnvotedBy,
  loadViewer,
  parseHomesDocument,
  parseVoteDraft,
  parseWeekDraft,
  saveViewer,
  sortWeeksNewestFirst,
} from "./homes";

describe("homes seed week", () => {
  it("includes the 21 Sep 2026 Kelvindale-area shortlist", () => {
    expect(SEED_HOMES_WEEK.id).toBe("2026-W39");
    expect(SEED_HOMES_WEEK.label).toMatch(/week of 21 sep 2026/i);
    expect(SEED_HOMES_WEEK.summary).toMatch(/kelvindale/i);
    expect(SEED_HOMES_WEEK.summary).toMatch(/dorchester avenue/i);
    expect(SEED_HOMES_WEEK.listings.map((listing) => listing.address)).toEqual([
      "Archerhill Road, Knightswood",
      "124 Alderman Road, Knightswood",
      "Kelvindale Road, Kelvindale",
      "243 Alderman Road",
    ]);
    expect(SEED_HOMES_WEEK.listings[0]).toEqual(
      expect.objectContaining({
        price: 269995,
        beds: 3,
        type: "semi",
        area: "Knightswood",
        status: "live",
        url: "https://www.rightmove.co.uk/properties/93127215",
      }),
    );
    expect(SEED_HOMES_WEEK.listings[2]?.area).toBe("Kelvindale");
    expect(SEED_HOMES_WEEK.listings[3]?.status).toBe("also");
    expect(SEED_HOMES_WEEK.listings[3]?.url).toBeUndefined();
  });
});

describe("vote upsert and match detection", () => {
  it("upserts one person's vote without touching the other", () => {
    const weeks = applyVote([SEED_HOMES_WEEK], SEED_HOMES_WEEK.listings[0]!.id, "ian", "yes");
    const listing = weeks[0]?.listings[0];

    expect(listing?.votes.ian?.choice).toBe("yes");
    expect(listing?.votes.ian?.updatedAt).toEqual(expect.any(String));
    expect(listing?.votes.abby).toBeUndefined();

    const next = applyVote(weeks, listing!.id, "ian", "maybe");
    expect(next[0]?.listings[0]?.votes.ian?.choice).toBe("maybe");
    expect(next[0]?.listings[0]?.votes.abby).toBeUndefined();
  });

  it("is a match only when both voted yes", () => {
    const listingId = SEED_HOMES_WEEK.listings[0]!.id;
    let weeks = applyVote([SEED_HOMES_WEEK], listingId, "ian", "yes");
    expect(isListingMatch(weeks[0]!.listings[0]!)).toBe(false);

    weeks = applyVote(weeks, listingId, "abby", "maybe");
    expect(isListingMatch(weeks[0]!.listings[0]!)).toBe(false);
    expect(isListingOpen(weeks[0]!.listings[0]!)).toBe(true);

    weeks = applyVote(weeks, listingId, "abby", "yes");
    expect(isListingMatch(weeks[0]!.listings[0]!)).toBe(true);
    expect(isListingOpen(weeks[0]!.listings[0]!)).toBe(true);
  });

  it("treats both-maybe as open but not a match", () => {
    const listingId = SEED_HOMES_WEEK.listings[1]!.id;
    let weeks = applyVote([SEED_HOMES_WEEK], listingId, "ian", "maybe");
    weeks = applyVote(weeks, listingId, "abby", "maybe");

    expect(isListingOpen(weeks[0]!.listings[1]!)).toBe(true);
    expect(isListingMatch(weeks[0]!.listings[1]!)).toBe(false);
  });

  it("is not open when either person voted no", () => {
    const listingId = SEED_HOMES_WEEK.listings[0]!.id;
    let weeks = applyVote([SEED_HOMES_WEEK], listingId, "ian", "yes");
    weeks = applyVote(weeks, listingId, "abby", "no");

    expect(isListingOpen(weeks[0]!.listings[0]!)).toBe(false);
    expect(isListingMatch(weeks[0]!.listings[0]!)).toBe(false);
  });

  it("tracks unvoted-by-me independently", () => {
    const listing = SEED_HOMES_WEEK.listings[0]!;
    expect(isUnvotedBy(listing, "ian")).toBe(true);

    const weeks = applyVote([SEED_HOMES_WEEK], listing.id, "ian", "no");
    expect(isUnvotedBy(weeks[0]!.listings[0]!, "ian")).toBe(false);
    expect(isUnvotedBy(weeks[0]!.listings[0]!, "abby")).toBe(true);
  });

  it("leaves other listings unchanged when the id is unknown", () => {
    const weeks = applyVote([SEED_HOMES_WEEK], "missing-listing", "ian", "yes");
    expect(weeks[0]?.listings.every((listing) => !listing.votes.ian)).toBe(true);
  });
});

describe("homes filters", () => {
  it("filters matches, open, and unvoted by viewer", () => {
    const listingId = SEED_HOMES_WEEK.listings[0]!.id;
    let weeks = applyVote([SEED_HOMES_WEEK], listingId, "ian", "yes");
    weeks = applyVote(weeks, listingId, "abby", "yes");

    const listings = weeks[0]!.listings;
    expect(filterListings(listings, "matches", "ian")).toHaveLength(1);
    expect(filterListings(listings, "open", "ian")).toHaveLength(1);
    expect(filterListings(listings, "unvoted", "abby")).toHaveLength(3);
    expect(filterListings(listings, "all", "ian")).toHaveLength(4);
  });
});

describe("homes parsing and sorting", () => {
  it("parses a vote draft and rejects junk", () => {
    expect(
      parseVoteDraft({
        listingId: "archerhill-road-knightswood",
        person: "abby",
        choice: "yes",
      }),
    ).toEqual({
      listingId: "archerhill-road-knightswood",
      person: "abby",
      choice: "yes",
    });

    expect(parseVoteDraft({ listingId: "x", person: "avery", choice: "yes" })).toBeNull();
    expect(parseVoteDraft({ listingId: "x", person: "ian", choice: "love" })).toBeNull();
    expect(parseVoteDraft({ listingId: "", person: "ian", choice: "no" })).toBeNull();
    expect(parseVoteDraft(null)).toBeNull();
  });

  it("parses a week draft and a versioned document", () => {
    const week = parseWeekDraft(SEED_HOMES_WEEK);
    expect(week?.id).toBe("2026-W39");
    expect(week?.listings).toHaveLength(4);

    expect(parseHomesDocument(homesDocument([SEED_HOMES_WEEK]))).toEqual({
      version: 1,
      weeks: [SEED_HOMES_WEEK],
    });
    expect(parseHomesDocument({ weeks: [SEED_HOMES_WEEK] })?.weeks[0]?.id).toBe("2026-W39");
    expect(parseHomesDocument(null)).toBeNull();
    expect(parseHomesDocument({ version: 1, weeks: [{ nope: true }] })).toBeNull();
  });

  it("sorts weeks newest first", () => {
    const older = { ...SEED_HOMES_WEEK, id: "2026-W38", createdAt: "2026-09-14T12:00:00.000Z" };
    const newer = { ...SEED_HOMES_WEEK, id: "2026-W40", createdAt: "2026-09-28T12:00:00.000Z" };

    expect(sortWeeksNewestFirst([older, newer]).map((week) => week.id)).toEqual([
      "2026-W40",
      "2026-W38",
    ]);
  });
});

describe("homes helpers", () => {
  it("formats pound prices without pence", () => {
    expect(formatHomePrice(269995)).toBe("£269,995");
    expect(formatHomePrice(260000)).toBe("£260,000");
  });

  it("persists the who-am-I viewer", () => {
    expect(window.localStorage.getItem(HOMES_VIEWER_STORAGE_KEY)).toBeNull();
    expect(loadViewer()).toBe("ian");

    saveViewer("abby");
    expect(loadViewer()).toBe("abby");
    expect(window.localStorage.getItem(HOMES_VIEWER_STORAGE_KEY)).toBe("abby");
  });

  it("uses the shared Redis key name", () => {
    expect(HOMES_STORAGE_KEY).toBe("kusina:homes:v1");
  });
});
