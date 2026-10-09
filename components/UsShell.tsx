import Link from "next/link";
import type { ReactNode } from "react";
import { SectionPager, SectionTabs } from "@/components/SectionNav";
import { SiteHeader } from "@/components/SiteHeader";
import type { UsSection } from "@/lib/us-sections";

export function UsShell({
  eyebrow,
  title,
  intro,
  crossLink,
  sections,
  tabsLabel,
  notice,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro: string;
  crossLink: { href: string; label: string; back?: boolean };
  sections: readonly UsSection[];
  tabsLabel: string;
  notice?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="pb-16">
      <SiteHeader compact />
      <div className="mx-auto max-w-xl px-4 sm:px-6">
        <div className="flex items-start justify-between gap-3 pb-2">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brick">{eyebrow}</p>
            ) : null}
            <h1 className="font-display text-[2rem] font-bold leading-tight tracking-tight">{title}</h1>
          </div>
          <Link
            href={crossLink.href}
            className="mt-1 inline-flex min-h-11 shrink-0 items-center rounded-full border border-line/15 bg-cream/80 px-4 text-sm font-bold text-brick"
          >
            {crossLink.back ? <span aria-hidden="true">←&nbsp;</span> : null}
            {crossLink.label}
            {crossLink.back ? null : <span aria-hidden="true">&nbsp;→</span>}
          </Link>
        </div>
        <p className="pb-3 text-base leading-snug text-ink-soft">{intro}</p>
        <SectionTabs sections={sections} label={tabsLabel} />
        {notice}
        <main className="mt-6 scroll-mt-20 space-y-12">{children}</main>
        <div className="mt-14">
          <SectionPager sections={sections} />
        </div>
      </div>
    </div>
  );
}
