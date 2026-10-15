"use client";

import { useEffect, useState } from "react";
import { HorsemenReference } from "@/components/HorsemenReference";
import type { BehaviourTag } from "@/lib/behaviour-tags";
import { fetchBehaviourTags } from "@/lib/behaviour-tags-client";
import { markTagsSeen, readSeenTagIds, unseenTagIds } from "@/lib/behaviour-tags-seen";

const NO_NEW: ReadonlySet<string> = new Set();

export function TogetherHorsemen() {
  const [tags, setTags] = useState<BehaviourTag[]>([]);
  const [newTagIds, setNewTagIds] = useState<ReadonlySet<string>>(NO_NEW);

  useEffect(() => {
    let active = true;
    fetchBehaviourTags()
      .then((loaded) => {
        if (!active) {
          return;
        }
        const ids = loaded.map((tag) => tag.id);
        // Keep this visit's New labels; the header and tab badges clear straight away.
        setNewTagIds(new Set(unseenTagIds(ids, readSeenTagIds())));
        setTags(loaded);
        markTagsSeen(ids);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return <HorsemenReference framing="together" tags={tags} newTagIds={newTagIds} />;
}
