import { describe, expect, it } from "vitest";
import { getRecipe, weekPlan } from "./recipes";
import {
  WEEK_PLAN_STORAGE_KEY,
  assignRecipeToDay,
  loadWeekPlan,
  resetWeekPlan,
  saveWeekPlan,
} from "./week-plan";

describe("week plan storage", () => {
  it("loads the hardcoded default plan when nothing is stored", () => {
    expect(window.localStorage.getItem(WEEK_PLAN_STORAGE_KEY)).toBeNull();
    expect(loadWeekPlan()).toEqual(weekPlan);
  });

  it("saves a reassignment and loads it back", () => {
    const next = assignRecipeToDay(weekPlan, "Mon", "fish-sinigang");
    const monday = next.find((slot) => slot.day === "Mon");

    expect(monday?.slug).toBe("fish-sinigang");
    expect(getRecipe(monday?.slug ?? "")?.title).toBe("Fish Sinigang");

    saveWeekPlan(next);

    expect(loadWeekPlan()).toEqual(next);
    expect(JSON.parse(window.localStorage.getItem(WEEK_PLAN_STORAGE_KEY) ?? "null")).toEqual(
      next,
    );
  });

  it("allows the same recipe on more than one day", () => {
    const next = assignRecipeToDay(
      assignRecipeToDay(weekPlan, "Mon", "chicken-tinola"),
      "Tue",
      "chicken-tinola",
    );

    expect(next.filter((slot) => slot.slug === "chicken-tinola").map((slot) => slot.day)).toEqual(
      ["Mon", "Tue", "Sat", "Sun"],
    );
  });

  it("resets to the hardcoded default plan", () => {
    saveWeekPlan(assignRecipeToDay(weekPlan, "Wed", "asian-chicken-rice-bowl"));
    expect(loadWeekPlan()[2]?.slug).toBe("asian-chicken-rice-bowl");

    expect(resetWeekPlan()).toEqual(weekPlan);
    expect(window.localStorage.getItem(WEEK_PLAN_STORAGE_KEY)).toBeNull();
    expect(loadWeekPlan()).toEqual(weekPlan);
  });

  it("falls back to the default plan when stored data is invalid", () => {
    window.localStorage.setItem(WEEK_PLAN_STORAGE_KEY, "{not-json");
    expect(loadWeekPlan()).toEqual(weekPlan);

    window.localStorage.setItem(
      WEEK_PLAN_STORAGE_KEY,
      JSON.stringify([{ day: "Mon", slug: "not-a-recipe", tag: "Nope" }]),
    );
    expect(loadWeekPlan()).toEqual(weekPlan);
  });
});
