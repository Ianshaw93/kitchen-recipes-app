"use client";

import { useState } from "react";
import { BehaviourTagItem } from "@/components/BehaviourTagItem";
import type { BehaviourTag } from "@/lib/behaviour-tags";

const PREVIEW_COUNT = 3;

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
        {visible.map((tag) => (
          <BehaviourTagItem key={tag.id} tag={tag} isNew={newTagIds.has(tag.id)} />
        ))}
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
