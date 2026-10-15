"use client";

import { useState } from "react";
import type { BehaviourTag } from "@/lib/behaviour-tags";
import { formatISODate } from "@/lib/relationship";

const PREVIEW_COUNT = 3;

const KIND_STYLE = {
  win: { label: "Win", item: "bg-leaf/[0.1] border-leaf/25", chip: "bg-leaf text-cream" },
  slip: { label: "Slip", item: "bg-brick/[0.08] border-brick/20", chip: "bg-brick text-cream" },
} as const;

function whoLabel(who: BehaviourTag["who"]): string | null {
  return who ? who.charAt(0).toUpperCase() + who.slice(1) : null;
}

export function HorsemenMoments({
  horseman,
  tags,
  newTagIds,
}: {
  horseman: string;
  tags: readonly BehaviourTag[];
  newTagIds: ReadonlySet<string>;
}) {
  const [showAll, setShowAll] = useState(false);
  if (tags.length === 0) {
    return null;
  }
  const visible = showAll ? tags : tags.slice(0, PREVIEW_COUNT);

  return (
    <div className="border-t border-line/10 px-4 pt-4 pb-4">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-soft">Our moments</p>
      <ul aria-label={`${horseman} moments`} className="mt-2 space-y-2">
        {visible.map((tag) => {
          const style = KIND_STYLE[tag.kind];
          const who = whoLabel(tag.who);
          return (
            <li key={tag.id} className={`rounded-2xl border px-3 py-2.5 ${style.item}`}>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[0.7rem] font-extrabold uppercase tracking-wide ${style.chip}`}
                >
                  {style.label}
                </span>
                {newTagIds.has(tag.id) ? (
                  <span className="rounded-full border border-gold/60 bg-gold/20 px-2 py-0.5 text-[0.7rem] font-extrabold uppercase tracking-wide text-ink">
                    New
                  </span>
                ) : null}
              </div>
              <p className="mt-1.5 text-base leading-snug">{tag.text}</p>
              <p className="mt-1 text-xs font-semibold text-ink-soft">
                {[who, formatISODate(tag.date)].filter(Boolean).join(" · ")}
              </p>
            </li>
          );
        })}
      </ul>
      {tags.length > PREVIEW_COUNT ? (
        <button
          type="button"
          aria-expanded={showAll}
          onClick={() => setShowAll((current) => !current)}
          className="mt-2 min-h-11 text-sm font-bold text-ocean"
        >
          {showAll ? "Show fewer" : `Show all ${tags.length}`}
        </button>
      ) : null}
    </div>
  );
}
