import Link from "next/link";
import { dietLine } from "@/lib/recipes";

const NAV_LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/homes", label: "Homes" },
  { href: "/payments", label: "Payments" },
  { href: "/us", label: "Us" },
] as const;

const NAV_LINK_CLASS =
  "inline-flex h-11 min-w-11 items-center justify-center rounded-full border-2 border-line/20 bg-cream px-2.5 text-xs font-extrabold uppercase tracking-wide text-ink";

export function SiteHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className="px-4 pt-6 pb-4 sm:px-6">
      <div className="mx-auto flex max-w-xl flex-col items-start gap-3 sm:flex-row sm:justify-between">
        <Link href="/" className="min-w-0 flex items-center">
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
        <nav className="flex shrink-0 flex-nowrap gap-1.5 sm:mt-1">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={NAV_LINK_CLASS}>
              {link.label}
            </Link>
          ))}
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
