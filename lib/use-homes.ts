"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyVote,
  loadHomes,
  saveHomes,
  type HomePerson,
  type HomeVoteChoice,
  type HomeWeek,
} from "./homes";
import { HomesApiError, fetchSharedHomes, postSharedVote } from "./homes-client";

export type HomesSyncStatus = "loading" | "ready" | "error";

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof HomesApiError) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export function useHomes() {
  const [weeks, setWeeks] = useState<HomeWeek[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [status, setStatus] = useState<HomesSyncStatus>("loading");
  const loadPromiseRef = useRef<Promise<HomeWeek[]>>(Promise.resolve([]));
  const weeksRef = useRef<HomeWeek[]>([]);
  const voteQueueRef = useRef(Promise.resolve());

  const replaceWeeks = useCallback((next: HomeWeek[]) => {
    weeksRef.current = next;
    setWeeks(next);
    saveHomes(next);
  }, []);

  useEffect(() => {
    const pending = fetchSharedHomes()
      .then((remote) => {
        replaceWeeks(remote);
        setSyncError(null);
        setStatus("ready");
        setHydrated(true);
        return remote;
      })
      .catch((error: unknown) => {
        const cached = loadHomes();
        if (cached.length > 0) {
          weeksRef.current = cached;
          setWeeks(cached);
        }
        setSyncError(errorMessage(error, "Couldn't load the shared homes list."));
        setStatus("error");
        setHydrated(true);
        return cached;
      });

    loadPromiseRef.current = pending;
  }, [replaceWeeks]);

  const vote = useCallback(
    async (listingId: string, person: HomePerson, choice: HomeVoteChoice): Promise<boolean> => {
      const run = async () => {
        await loadPromiseRef.current;
        const previous = weeksRef.current;
        replaceWeeks(applyVote(previous, listingId, person, choice));
        setSyncError(null);

        try {
          const remote = await postSharedVote({ listingId, person, choice });
          replaceWeeks(remote);
          setStatus("ready");
          return true;
        } catch (error) {
          replaceWeeks(previous);
          setSyncError(errorMessage(error, "Couldn't save that vote."));
          setStatus("error");
          return false;
        }
      };

      const pending = voteQueueRef.current.then(run, run);
      voteQueueRef.current = pending.then(
        () => undefined,
        () => undefined,
      );
      return pending;
    },
    [replaceWeeks],
  );

  return { weeks, vote, hydrated, syncError, status };
}
