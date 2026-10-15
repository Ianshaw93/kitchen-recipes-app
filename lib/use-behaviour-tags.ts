"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { fetchBehaviourTagIds } from "./behaviour-tags-client";
import { readSeenTagIds, subscribeSeenTags, unseenTagIds } from "./behaviour-tags-seen";

const NONE: string[] = [];

export function useSeenTagIds(): string[] {
  return useSyncExternalStore(subscribeSeenTags, readSeenTagIds, () => NONE);
}

/** Zero until the ids check comes back with tags this device hasn't seen. */
export function useUnseenBehaviourTagCount(enabled = true): number {
  const [ids, setIds] = useState<string[]>(NONE);
  const seen = useSeenTagIds();

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let active = true;
    void fetchBehaviourTagIds().then((latest) => {
      if (active) {
        setIds(latest);
      }
    });
    return () => {
      active = false;
    };
  }, [enabled]);

  return enabled ? unseenTagIds(ids, seen).length : 0;
}
