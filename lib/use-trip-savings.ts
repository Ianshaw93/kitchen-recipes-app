"use client";

import { useSyncExternalStore } from "react";
import {
  loadExtraContributions,
  saveExtraContributions,
  tripContributionsStorageKey,
} from "./trip-savings";
import {
  addContribution,
  selectedBandAmount,
  summariseSavings,
  type ContributionDraft,
  type Trip,
  type TripContribution,
} from "./trips";

const empty: TripContribution[] = [];
const cache = new Map<string, { raw: string; value: TripContribution[] }>();
const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

function emit() {
  listeners.forEach((listener) => listener());
}

function snapshot(slug: string): TripContribution[] {
  const raw =
    typeof window === "undefined"
      ? "[]"
      : (window.localStorage.getItem(tripContributionsStorageKey(slug)) ?? "[]");
  const cached = cache.get(slug);
  if (cached && cached.raw === raw) {
    return cached.value;
  }

  const value = loadExtraContributions(slug);
  cache.set(slug, { raw, value });
  return value;
}

function commit(slug: string, next: TripContribution[]) {
  saveExtraContributions(slug, next);
  cache.set(slug, {
    raw: window.localStorage.getItem(tripContributionsStorageKey(slug)) ?? "[]",
    value: next,
  });
  emit();
}

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function useTripSavings(trip: Trip) {
  const hydrated = useHydrated();
  const stored = useSyncExternalStore(
    subscribe,
    () => snapshot(trip.slug),
    () => empty,
  );
  const extras = hydrated ? stored : empty;
  const contributions = [...trip.contributions, ...extras];
  const summary = summariseSavings(
    contributions,
    selectedBandAmount(trip, trip.selectedBand),
    trip.savingsSplit,
  );

  function add(draft: ContributionDraft) {
    commit(trip.slug, addContribution(snapshot(trip.slug), draft));
  }

  return { contributions, extras, summary, add, hydrated };
}
