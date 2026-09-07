"use client";

import { useSyncExternalStore } from "react";
import { readChecked, writeChecked } from "./checked-items";

const empty: Record<string, boolean> = {};
const cache = new Map<string, { raw: string; value: Record<string, boolean> }>();
const listeners = new Map<string, Set<() => void>>();

function subscribe(key: string, onStoreChange: () => void) {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(onStoreChange);
  return () => {
    set.delete(onStoreChange);
  };
}

function emit(key: string) {
  listeners.get(key)?.forEach((listener) => listener());
}

function snapshot(key: string): Record<string, boolean> {
  const raw =
    typeof window === "undefined"
      ? "{}"
      : (window.localStorage.getItem(key) ?? "{}");
  const cached = cache.get(key);
  if (cached && cached.raw === raw) {
    return cached.value;
  }

  const value = readChecked(key);
  cache.set(key, { raw, value });
  return value;
}

function commit(key: string, next: Record<string, boolean>) {
  writeChecked(key, next);
  cache.set(key, { raw: JSON.stringify(next), value: next });
  emit(key);
}

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function useCheckedItems(storageKey: string) {
  const hydrated = useHydrated();
  const stored = useSyncExternalStore(
    (onStoreChange) => subscribe(storageKey, onStoreChange),
    () => snapshot(storageKey),
    () => empty,
  );
  const checked = hydrated ? stored : empty;

  function toggle(id: string) {
    const current = snapshot(storageKey);
    commit(storageKey, { ...current, [id]: !current[id] });
  }

  function reset() {
    commit(storageKey, {});
  }

  return { checked, toggle, reset };
}
