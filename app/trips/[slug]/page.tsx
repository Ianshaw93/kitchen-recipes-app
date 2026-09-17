import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { TripBudget } from "@/components/TripBudget";
import { TripPhoto } from "@/components/TripPhoto";
import { TripSavings } from "@/components/TripSavings";
import { accentClass } from "@/lib/accents";
import { getTrip, getTripSlugs } from "@/lib/trips";

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

  return (
    <div className="pb-16">
      <SiteHeader compact />
      <article className="mx-auto max-w-xl px-4 sm:px-6">
        <div className="overflow-hidden rounded-3xl border-2 border-line/15 bg-cream card-shadow">
          <TripPhoto
            src={trip.hero.imageSrc}
            alt={trip.hero.imageAlt}
            credit={trip.hero.imageCredit}
            priority
          />
          <div className={`px-5 py-5 ${accent.wash}`}>
            <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.22em] text-ink-soft">
              {trip.status}
            </p>
            <h1 className="font-display text-3xl font-bold leading-tight">{trip.title}</h1>
            <p className="mt-3 text-lg font-semibold leading-snug">{trip.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-1.5 text-sm font-extrabold ${accent.chip}`}>
                {trip.duration}
              </span>
              <span className="rounded-full bg-cream px-3 py-1.5 text-sm font-extrabold text-ink">
                {trip.travellers}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <TripSavings trip={trip} />
        </div>

        <TripBudget trip={trip} />

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
