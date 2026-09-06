import { getRecipe, weekPlan, type WeekSlot } from "./recipes";

export const WEEK_PLAN_STORAGE_KEY = "kusina:week-plan:v1";

function cloneDefaultWeekPlan(): WeekSlot[] {
  return weekPlan.map((slot) => ({ ...slot }));
}

function tagForDay(day: string, slug: string | null): string {
  const preset = weekPlan.find((slot) => slot.day === day && slot.slug === slug);
  if (preset) {
    return preset.tag;
  }

  return slug ? (getRecipe(slug)?.time ?? "") : "Leftovers";
}

function isValidPlan(value: unknown): value is WeekSlot[] {
  if (!Array.isArray(value) || value.length !== weekPlan.length) {
    return false;
  }

  const days = new Set<string>();

  for (const item of value) {
    if (!item || typeof item !== "object") {
      return false;
    }

    const slot = item as Partial<WeekSlot>;
    if (typeof slot.day !== "string" || !weekPlan.some((day) => day.day === slot.day)) {
      return false;
    }
    if (days.has(slot.day)) {
      return false;
    }
    days.add(slot.day);

    if (slot.slug !== null && (typeof slot.slug !== "string" || !getRecipe(slot.slug))) {
      return false;
    }
    if (slot.tag !== undefined && typeof slot.tag !== "string") {
      return false;
    }
  }

  return weekPlan.every((slot) => days.has(slot.day));
}

function normalizePlan(plan: WeekSlot[]): WeekSlot[] {
  return weekPlan.map((day) => {
    const slot = plan.find((item) => item.day === day.day) ?? day;
    return {
      day: slot.day,
      slug: slot.slug,
      tag: slot.tag || tagForDay(slot.day, slot.slug),
    };
  });
}

export function assignRecipeToDay(plan: WeekSlot[], day: string, slug: string): WeekSlot[] {
  if (!getRecipe(slug)) {
    return plan.map((slot) => ({ ...slot }));
  }

  return plan.map((slot) =>
    slot.day === day ? { day: slot.day, slug, tag: tagForDay(day, slug) } : { ...slot },
  );
}

export function loadWeekPlan(): WeekSlot[] {
  if (typeof window === "undefined") {
    return cloneDefaultWeekPlan();
  }

  try {
    const raw = window.localStorage.getItem(WEEK_PLAN_STORAGE_KEY);
    if (!raw) {
      return cloneDefaultWeekPlan();
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isValidPlan(parsed)) {
      return cloneDefaultWeekPlan();
    }

    return normalizePlan(parsed);
  } catch {
    return cloneDefaultWeekPlan();
  }
}

export function saveWeekPlan(plan: WeekSlot[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(WEEK_PLAN_STORAGE_KEY, JSON.stringify(normalizePlan(plan)));
  } catch {
    // Ignore quota / private mode.
  }
}

export function resetWeekPlan(): WeekSlot[] {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(WEEK_PLAN_STORAGE_KEY);
    } catch {
      // Ignore private mode.
    }
  }

  return cloneDefaultWeekPlan();
}
