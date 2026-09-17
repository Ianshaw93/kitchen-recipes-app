import {
  addContribution,
  type ContributionDraft,
  type TripContribution,
} from "./trips";

export const TRIP_CONTRIBUTIONS_STORAGE_PREFIX = "kusina:trips:contributions:v1:";

export function tripContributionsStorageKey(slug: string) {
  return `${TRIP_CONTRIBUTIONS_STORAGE_PREFIX}${slug}`;
}

function isContribution(value: unknown): value is TripContribution {
  if (!value || typeof value !== "object") {
    return false;
  }
  const row = value as Partial<TripContribution>;
  return (
    typeof row.id === "string" &&
    row.id.length > 0 &&
    (row.traveller === "Ian" || row.traveller === "Abby") &&
    typeof row.amountGbp === "number" &&
    Number.isInteger(row.amountGbp) &&
    row.amountGbp > 0 &&
    typeof row.date === "string"
  );
}

export function loadExtraContributions(slug: string): TripContribution[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(tripContributionsStorageKey(slug));
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isContribution);
  } catch {
    return [];
  }
}

export function saveExtraContributions(slug: string, extras: TripContribution[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(tripContributionsStorageKey(slug), JSON.stringify(extras));
  } catch {
    // Ignore quota / private mode.
  }
}

export function appendExtraContribution(slug: string, extras: TripContribution[], draft: ContributionDraft) {
  const next = addContribution(extras, draft);
  saveExtraContributions(slug, next);
  return next;
}
