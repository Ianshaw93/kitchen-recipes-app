import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { TripCard } from "@/components/TripCard";
import { trips } from "@/lib/trips";

export const metadata: Metadata = {
  title: "Trips",
  description: "Shared trips for Ian and Abby. Thailand honey / baby moon is first.",
};

export default function TripsPage() {
  return (
    <div className="pb-16">
      <SiteHeader compact />
      <section className="mx-auto max-w-xl px-4 sm:px-6">
        <h1 className="font-display text-3xl font-bold leading-tight">Trips</h1>
        <p className="mt-1 text-sm font-semibold text-ink-soft">
          Alongside the kitchen. Open the same link on either phone.
        </p>
        <ul className="mt-4 space-y-3">
          {trips.map((trip) => (
            <li key={trip.slug}>
              <TripCard trip={trip} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
