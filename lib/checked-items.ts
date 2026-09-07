export type ChecklistKind = "ingredients" | "steps";

export function checklistStorageKey(kind: ChecklistKind, slug: string) {
  return kind === "ingredients"
    ? `kusina:checked:${slug}`
    : `kusina:checked:steps:${slug}`;
}

export function readChecked(key: string): Record<string, boolean> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return {};
    }

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    const next: Record<string, boolean> = {};
    for (const [id, value] of Object.entries(parsed)) {
      if (typeof value === "boolean") {
        next[id] = value;
      }
    }
    return next;
  } catch {
    return {};
  }
}

export function writeChecked(key: string, checked: Record<string, boolean>) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(checked));
  } catch {
    // Ignore quota / private mode.
  }
}
