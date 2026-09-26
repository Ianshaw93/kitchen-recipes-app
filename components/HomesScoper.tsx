"use client";

import { useEffect, useState } from "react";
import {
  HOME_PERSONS,
  HOME_PERSON_LABELS,
  HOME_VOTE_CHOICES,
  HOME_VOTE_LABELS,
  filterListings,
  formatHomePrice,
  isListingMatch,
  isListingOpen,
  listingOpenLabel,
  loadViewer,
  saveViewer,
  type HomeListing,
  type HomePerson,
  type HomeVoteChoice,
  type HomesFilter,
} from "@/lib/homes";
import { useHomes } from "@/lib/use-homes";

const FILTERS: { id: HomesFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "matches", label: "Matches" },
  { id: "open", label: "Open" },
  { id: "unvoted", label: "Unvoted by me" },
];

const STATUS_LABELS: Record<string, string> = {
  live: "Live",
  gone: "Gone",
  also: "Also",
};

export function HomesScoper() {
  const { weeks, vote, hydrated, syncError } = useHomes();
  const [viewer, setViewer] = useState<HomePerson>("ian");
  const [filter, setFilter] = useState<HomesFilter>("all");

  useEffect(() => {
    setViewer(loadViewer());
  }, []);

  function onPickViewer(person: HomePerson) {
    setViewer(person);
    saveViewer(person);
  }

  return (
    <section className="mx-auto max-w-xl px-4 sm:px-6">
      <div className="mb-4">
        <h1 className="font-display text-3xl font-bold leading-tight">Homes</h1>
        <p className="mt-1 text-sm font-semibold text-ink-soft">
          Weekly Kelvindale-area shortlist. Ian and Abby vote independently — Match when you both say yes.
        </p>
      </div>

      {syncError ? (
        <p className="mb-4 rounded-3xl border-2 border-brick/30 bg-brick/10 px-5 py-3 text-base font-bold" role="alert">
          {syncError}
        </p>
      ) : null}

      <div className="sticky top-0 z-10 -mx-4 mb-5 border-b-2 border-line/10 bg-paper/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6">
        <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.22em] text-ink-soft">
          Who am I
        </p>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {HOME_PERSONS.map((person) => {
            const selected = viewer === person;
            return (
              <button
                key={person}
                type="button"
                aria-pressed={selected}
                onClick={() => onPickViewer(person)}
                className={`tap rounded-2xl border-2 text-lg font-extrabold ${
                  selected ? "border-brick bg-brick text-cream" : "border-line/20 bg-cream text-ink"
                }`}
              >
                I&apos;m {HOME_PERSON_LABELS[person]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter listings">
        {FILTERS.map((item) => {
          const selected = filter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setFilter(item.id)}
              className={`tap rounded-full border-2 px-4 text-sm font-extrabold uppercase tracking-wide ${
                selected ? "border-ocean bg-ocean text-cream" : "border-line/20 bg-cream text-ink"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="mt-8" aria-busy={!hydrated}>
        {!hydrated && weeks.length === 0 ? (
          <p className="rounded-3xl border-2 border-dashed border-line/20 bg-cream px-4 py-5 text-base font-semibold leading-snug text-ink-soft">
            Loading shared shortlist…
          </p>
        ) : weeks.length === 0 ? (
          <p className="rounded-3xl border-2 border-dashed border-line/20 bg-cream px-4 py-5 text-base font-semibold leading-snug text-ink-soft">
            No weeks yet. Seed a week via Redis or POST /api/homes.
          </p>
        ) : (
          <div className="space-y-10">
            {weeks.map((week) => {
              const listings = filterListings(week.listings, filter, viewer);
              return (
                <div key={week.id}>
                  <h2 className="font-display text-2xl font-bold">{week.label}</h2>
                  {week.summary ? (
                    <p className="mt-2 text-sm font-semibold leading-snug text-ink-soft">{week.summary}</p>
                  ) : null}
                  {listings.length === 0 ? (
                    <p className="mt-4 rounded-3xl border-2 border-dashed border-line/20 bg-cream px-4 py-5 text-base font-semibold text-ink-soft">
                      Nothing in this filter for {HOME_PERSON_LABELS[viewer]}.
                    </p>
                  ) : (
                    <ul className="mt-4 space-y-4">
                      {listings.map((listing) => (
                        <li key={listing.id}>
                          <ListingCard
                            listing={listing}
                            viewer={viewer}
                            onVote={(person, choice) => vote(listing.id, person, choice)}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function ListingCard({
  listing,
  viewer,
  onVote,
}: {
  listing: HomeListing;
  viewer: HomePerson;
  onVote: (person: HomePerson, choice: HomeVoteChoice) => void;
}) {
  const match = isListingMatch(listing);
  const open = isListingOpen(listing) && !match;
  const listingHref = listing.url;
  const meta = [
    formatHomePrice(listing.price),
    `${listing.beds}-bed`,
    listing.type,
    listing.area,
  ].join(" · ");

  return (
    <article
      aria-label={listing.address}
      className="overflow-hidden rounded-3xl border-2 border-line/15 bg-cream card-shadow"
    >
      {listing.imageUrl ? <ListingPhoto src={listing.imageUrl} alt={listing.address} /> : null}
      <div className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-display text-xl font-bold leading-tight">
          {listingHref ? (
            <a
              href={listingHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink underline decoration-2 decoration-brick/50 underline-offset-4"
            >
              {listing.address}
            </a>
          ) : (
            listing.address
          )}
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {listing.status ? (
            <span className="rounded-full border-2 border-line/15 bg-paper px-2.5 py-0.5 text-[0.7rem] font-extrabold uppercase tracking-wide text-ink-soft">
              {STATUS_LABELS[listing.status] ?? listing.status}
            </span>
          ) : null}
          {match ? (
            <span className="rounded-full border-2 border-leaf/30 bg-leaf/15 px-2.5 py-0.5 text-[0.7rem] font-extrabold uppercase tracking-wide text-leaf">
              Match
            </span>
          ) : null}
          {open ? (
            <span className="rounded-full border-2 border-gold/40 bg-gold/15 px-2.5 py-0.5 text-[0.7rem] font-extrabold uppercase tracking-wide text-ink">
              Both open
            </span>
          ) : null}
        </div>
      </div>
      <p className="mt-1 text-base font-bold">{meta}</p>
      <p className="mt-2 text-sm font-semibold leading-snug text-ink-soft">{listing.blurb}</p>
      {listingHref ? (
        <a
          href={listingHref}
          target="_blank"
          rel="noopener noreferrer"
          className="tap mt-4 flex w-full items-center justify-center rounded-2xl bg-brick text-lg font-extrabold text-cream"
        >
          {listingOpenLabel(listingHref)}
        </a>
      ) : null}

      <div className="mt-4 space-y-3">
        {HOME_PERSONS.map((person) => {
          const selected = listing.votes[person]?.choice;
          const mine = person === viewer;
          return (
            <div
              key={person}
              className={`rounded-2xl border-2 px-3 py-3 ${
                mine ? "border-brick/25 bg-brick/5" : "border-line/10 bg-paper"
              }`}
            >
              <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.18em] text-ink-soft">
                {HOME_PERSON_LABELS[person]}
                {mine ? " · you" : ""}
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {HOME_VOTE_CHOICES.map((choice) => {
                  const pressed = selected === choice;
                  return (
                    <button
                      key={choice}
                      type="button"
                      aria-pressed={pressed}
                      aria-label={`${HOME_PERSON_LABELS[person]}: ${HOME_VOTE_LABELS[choice]}`}
                      onClick={() => onVote(person, choice)}
                      className={`tap rounded-xl border-2 text-sm font-extrabold uppercase tracking-wide ${
                        pressed
                          ? choice === "yes"
                            ? "border-leaf bg-leaf text-cream"
                            : choice === "maybe"
                              ? "border-gold bg-gold text-ink"
                              : "border-brick bg-brick text-cream"
                          : "border-line/20 bg-cream text-ink"
                      }`}
                    >
                      {HOME_VOTE_LABELS[choice]}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </article>
  );
}

function ListingPhoto({ src, alt }: { src: string; alt: string }) {
  const [hidden, setHidden] = useState(false);
  if (hidden) {
    return null;
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHidden(true)}
      className="aspect-[16/10] w-full bg-paper object-cover sm:aspect-[2/1]"
    />
  );
}
