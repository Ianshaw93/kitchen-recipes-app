"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adjacentSections, sectionForPathname, type UsSection } from "@/lib/us-sections";

export function SectionTabs({
  sections,
  label,
}: {
  sections: readonly UsSection[];
  label: string;
}) {
  const current = sectionForPathname(sections, usePathname());

  return (
    <nav
      aria-label={label}
      className="sticky top-0 z-20 -mx-4 bg-paper/90 px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6"
    >
      <ul
        className="grid gap-1 rounded-full border border-line/10 bg-paper-deep/50 p-1"
        style={{ gridTemplateColumns: `repeat(${sections.length}, minmax(0, 1fr))` }}
      >
        {sections.map((section) => {
          const active = current?.slug === section.slug;
          return (
            <li key={section.slug} className="min-w-0">
              <Link
                href={section.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-12 items-center justify-center rounded-full px-1 text-center text-[0.8rem] font-bold leading-tight transition-colors ${
                  active
                    ? "bg-cream text-brick shadow-[0_1px_2px_rgb(28_16_8/0.12)]"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                {section.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function SectionPager({ sections }: { sections: readonly UsSection[] }) {
  const current = sectionForPathname(sections, usePathname());
  if (!current) {
    return null;
  }
  const { previous, next } = adjacentSections(sections, current.slug);

  return (
    <nav aria-label="More sections" className="grid grid-cols-2 gap-3">
      {previous ? (
        <Link
          href={previous.href}
          className="flex min-h-16 flex-col justify-center rounded-3xl border border-line/10 bg-cream/70 px-4 py-3"
        >
          <span className="text-xs font-bold text-ink-soft">
            <span aria-hidden="true">← </span>Previous
          </span>{" "}
          <span className="font-display text-base font-bold leading-tight">{previous.title}</span>
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
      {next ? (
        <Link
          href={next.href}
          className="flex min-h-16 flex-col items-end justify-center rounded-3xl border border-line/10 bg-cream/70 px-4 py-3 text-right"
        >
          <span className="text-xs font-bold text-ink-soft">
            Next<span aria-hidden="true"> →</span>
          </span>{" "}
          <span className="font-display text-base font-bold leading-tight">{next.title}</span>
        </Link>
      ) : null}
    </nav>
  );
}
