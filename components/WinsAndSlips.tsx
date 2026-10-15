"use client";

import { useEffect, useState } from "react";
import { BehaviourTagItem } from "@/components/BehaviourTagItem";
import { EmptyState, SectionHeading } from "@/components/UsUi";
import { sortTagsNewestFirst, type BehaviourTag } from "@/lib/behaviour-tags";
import { fetchBehaviourTags } from "@/lib/behaviour-tags-client";

const PREVIEW_COUNT = 5;

type Load = { status: "loading" } | { status: "error" } | { status: "ready"; tags: BehaviourTag[] };

export function WinsAndSlips() {
  const [load, setLoad] = useState<Load>({ status: "loading" });
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let active = true;
    fetchBehaviourTags()
      .then((tags) => {
        if (active) {
          setLoad({ status: "ready", tags: sortTagsNewestFirst(tags) });
        }
      })
      .catch(() => {
        if (active) {
          setLoad({ status: "error" });
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const tags = load.status === "ready" ? load.tags : [];
  const visible = showAll ? tags : tags.slice(0, PREVIEW_COUNT);

  return (
    <section aria-labelledby="wins-slips-heading" className="space-y-4">
      <SectionHeading id="wins-slips-heading" eyebrow="Real moments" title="Wins and slips">
        Good and bad behaviours from the week, newest first.
      </SectionHeading>
      {load.status === "loading" ? (
        <EmptyState>Loading wins and slips…</EmptyState>
      ) : load.status === "error" ? (
        <EmptyState>Couldn&apos;t load wins and slips right now.</EmptyState>
      ) : tags.length === 0 ? (
        <EmptyState>No wins or slips yet.</EmptyState>
      ) : (
        <ul aria-label="Wins and slips" className="space-y-2">
          {visible.map((tag) => (
            <BehaviourTagItem key={tag.id} tag={tag} />
          ))}
        </ul>
      )}
      {tags.length > PREVIEW_COUNT ? (
        <button
          type="button"
          aria-expanded={showAll}
          onClick={() => setShowAll((current) => !current)}
          className="flex min-h-12 w-full items-center justify-center rounded-full text-base font-bold text-ocean"
        >
          {showAll ? "Show fewer" : `Show all ${tags.length}`}
        </button>
      ) : null}
    </section>
  );
}
