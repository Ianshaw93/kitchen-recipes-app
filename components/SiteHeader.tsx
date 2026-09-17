import Link from "next/link";
import { dietLine } from "@/lib/recipes";

export function SiteHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className="px-4 pt-6 pb-4 sm:px-6">
      <div className="mx-auto flex max-w-xl items-start justify-between gap-4">
        <Link href="/" className="min-w-0 tap flex items-center">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-brick">
              Ian & Avery
            </p>
            {compact ? (
              <p className="font-display text-3xl font-bold leading-none tracking-tight text-ink">
                Kusina
              </p>
            ) : (
              <h1 className="font-display text-4xl font-bold leading-none tracking-tight text-ink sm:text-5xl">
                Kusina
              </h1>
            )}
          </div>
        </Link>
        <nav className="mt-1 flex shrink-0 flex-wrap justify-end gap-2" aria-label="Site">
          <Link
            href="/trips"
            className="tap inline-flex items-center rounded-full border-2 border-line/20 bg-cream px-4 text-sm font-extrabold uppercase tracking-wide text-ink"
          >
            Trips
          </Link>
          <Link
            href="/payments"
            className="tap inline-flex items-center rounded-full border-2 border-line/20 bg-cream px-4 text-sm font-extrabold uppercase tracking-wide text-ink"
          >
            Payments
          </Link>
        </nav>
      </div>
      {compact ? null : (
        <p className="mx-auto mt-4 max-w-xl text-base leading-snug text-ink-soft">
          Phone-friendly recipes for the kitchen. {dietLine}.
        </p>
      )}
    </header>
  );
}
