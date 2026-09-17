import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecipeMark } from "@/components/RecipeMark";
import { SiteHeader } from "@/components/SiteHeader";
import { accentClass } from "@/lib/accents";
import { formatGbp, getTrip, getTripSlugs } from "@/lib/trips";

export function generateStaticParams() {
  return getTripSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/trips/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const trip = getTrip(slug);
  if (!trip) {
    return { title: "Trip" };
  }
  return {
    title: trip.title,
    description: trip.summary,
  };
}

export default async function TripPage({
  params,
}: PageProps<"/trips/[slug]">) {
  const { slug } = await params;
  const trip = getTrip(slug);
  if (!trip) {
    notFound();
  }

  const accent = accentClass[trip.accent];
  const bands = [
    {
      label: "On the ground · lean",
      amount: trip.budgetOnGroundLeanGbp,
    },
    {
      label: "On the ground · comfort",
      amount: trip.budgetOnGroundComfortGbp,
    },
    {
      label: "Buffer · between us both",
      amount: trip.budgetBufferGbp,
    },
  ];

  return (
    <div className="pb-16">
      <SiteHeader compact />
      <article className="mx-auto max-w-xl px-4 sm:px-6">
        <div className={`rounded-3xl border-2 border-line/15 ${accent.wash} px-5 py-6`}>
          <div className="flex items-start gap-3">
            <RecipeMark accent={trip.accent} className="h-16 w-16 shrink-0" />
            <div>
              <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.22em] text-ink-soft">
                {trip.status}
              </p>
              <h1 className="font-display text-3xl font-bold leading-tight">{trip.title}</h1>
            </div>
          </div>
          <p className="mt-4 text-lg font-semibold leading-snug">{trip.summary}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1.5 text-sm font-extrabold ${accent.chip}`}>
              {trip.duration}
            </span>
            <span className="rounded-full bg-cream px-3 py-1.5 text-sm font-extrabold text-ink">
              {trip.travellers}
            </span>
          </div>
        </div>

        <section className="mt-8">
          <h2 className="font-display text-2xl font-bold">Budget</h2>
          <p className="mt-1 text-sm font-semibold text-ink-soft">
            Flights are already paid. These bands are on-the-ground only. Ian&apos;s 28 Aug note
            is the ceiling.
          </p>
          <ol className="mt-4 overflow-hidden rounded-3xl border-2 border-line/15 bg-cream card-shadow">
            {bands.map((band, index) => (
              <li
                key={band.label}
                className={`flex items-baseline justify-between gap-3 px-4 py-4 ${
                  index === 0 ? "" : "border-t-2 border-line/10"
                }`}
              >
                <p className="text-base font-semibold leading-snug">{band.label}</p>
                <p className="shrink-0 font-display text-2xl font-bold">{formatGbp(band.amount)}</p>
              </li>
            ))}
          </ol>
        </section>

        <aside className="mt-6 rounded-3xl border-2 border-gold/40 bg-gold/15 px-4 py-4">
          <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.22em] text-ink-soft">
            Spend on
          </p>
          <p className="mt-1 text-base font-semibold leading-snug">{trip.spendOn}</p>
        </aside>

        <section className="mt-8">
          <h2 className="font-display text-2xl font-bold">Notes</h2>
          <ul className="mt-3 space-y-3">
            {trip.notes.map((note) => (
              <li
                key={note}
                className="rounded-3xl border-2 border-line/15 bg-cream px-4 py-4 text-base font-semibold leading-snug"
              >
                {note}
              </li>
            ))}
          </ul>
        </section>
      </article>
    </div>
  );
}
