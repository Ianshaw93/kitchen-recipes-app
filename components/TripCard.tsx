import Link from "next/link";
import { accentClass } from "@/lib/accents";
import type { Trip } from "@/lib/trips";
import { RecipeMark } from "./RecipeMark";

export function TripCard({ trip }: { trip: Trip }) {
  const accent = accentClass[trip.accent];

  return (
    <Link
      href={`/trips/${trip.slug}`}
      className="card-shadow tap flex min-h-[7.5rem] items-stretch overflow-hidden rounded-3xl border-2 border-line/15 bg-cream"
    >
      <span className={`w-2 shrink-0 ${accent.bar}`} aria-hidden="true" />
      <div className="flex flex-1 items-center gap-3 px-4 py-4">
        <RecipeMark accent={trip.accent} className="h-14 w-14 shrink-0" />
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
