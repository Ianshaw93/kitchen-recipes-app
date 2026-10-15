"use client";

/** Per-device record of which behaviour tags this phone has already shown. No accounts exist, so this is the only "who has seen it" signal. */
export const SEEN_TAGS_STORAGE_KEY = "kusina:us:seen-behaviour-tags";

const MAX_REMEMBERED = 1000;
const listeners = new Set<() => void>();
let cache: { raw: string | null; ids: string[] } | null = null;

function rawValue(): string | null {
  return typeof window === "undefined" ? null : window.localStorage.getItem(SEEN_TAGS_STORAGE_KEY);
}

function parse(raw: string | null): string[] {
  if (!raw) {
    return [];
  }
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function readSeenTagIds(): string[] {
  const raw = rawValue();
  if (!cache || cache.raw !== raw) {
    cache = { raw, ids: parse(raw) };
  }
  return cache.ids;
}

export function markTagsSeen(ids: readonly string[]): void {
  if (typeof window === "undefined" || ids.length === 0) {
    return;
  }
  const current = readSeenTagIds();
  const merged = [...new Set([...current, ...ids])].slice(-MAX_REMEMBERED);
  if (merged.length === current.length && merged.every((id, index) => id === current[index])) {
    return;
  }
  try {
    window.localStorage.setItem(SEEN_TAGS_STORAGE_KEY, JSON.stringify(merged));
  } catch {
    return;
  }
  listeners.forEach((listener) => listener());
}

export function subscribeSeenTags(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function unseenTagIds(ids: readonly string[], seen: readonly string[]): string[] {
  const seenSet = new Set(seen);
  return ids.filter((id) => !seenSet.has(id));
}
