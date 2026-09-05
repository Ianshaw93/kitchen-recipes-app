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
        <span className="mt-1 rounded-full border-2 border-line/20 bg-cream px-3 py-1 text-xs font-bold uppercase tracking-wider text-ink-soft">
          Weeknight ulam
        </span>
      </div>
      {compact ? null : (
        <p className="mx-auto mt-4 max-w-xl text-base leading-snug text-ink-soft">
          Phone-friendly recipes for the kitchen. {dietLine}.
        </p>
      )}
    </header>
  );
}
