import Link from "next/link";
import { accentClass } from "@/lib/accents";
import type { Trip } from "@/lib/trips";
import { TripPhoto } from "./TripPhoto";

export function TripCard({ trip }: { trip: Trip }) {
  const accent = accentClass[trip.accent];

  return (
    <Link
      href={`/trips/${trip.slug}`}
      className="card-shadow tap flex min-h-[7.5rem] items-stretch overflow-hidden rounded-3xl border-2 border-line/15 bg-cream"
    >
      <span className={`w-2 shrink-0 ${accent.bar}`} aria-hidden="true" />
      <div className="relative w-28 shrink-0 self-stretch overflow-hidden bg-paper-deep">
        <TripPhoto
          src={trip.hero.imageSrc}
          alt={trip.hero.imageAlt}
          className="absolute inset-0"
        />
      </div>
      <div className="flex min-w-0 flex-1 items-center px-4 py-4">
        <div className="min-w-0 flex-1">
          <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.2em] text-ink-soft">
            {trip.status}
          </p>
          <h3 className="font-display text-xl font-bold leading-tight">{trip.title}</h3>
          <p className="mt-1 text-sm font-semibold text-ink-soft">
            {trip.duration} · {trip.travellers}
          </p>
        </div>
      </div>
    </Link>
  );
}

