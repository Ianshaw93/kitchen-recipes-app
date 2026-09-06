import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { getRecipe, weekPlan } from "@/lib/recipes";
import { WEEK_PLAN_STORAGE_KEY, assignRecipeToDay } from "@/lib/week-plan";
import { WeekPlan } from "./WeekPlan";

describe("WeekPlan", () => {
  it("renders the default week and links through to recipes", () => {
    render(<WeekPlan />);

    const monday = getRecipe("ginisang-hipon");
    expect(monday).toBeDefined();

    const mondayLink = screen.getByRole("link", { name: /Mon.*Ginisang Hipon/i });
    expect(mondayLink).toHaveAttribute("href", "/recipes/ginisang-hipon");
    expect(screen.getByRole("button", { name: /edit week/i })).toBeInTheDocument();
  });

  it("reads the persisted plan", async () => {
    const stored = assignRecipeToDay(weekPlan, "Mon", "fish-sinigang");
    window.localStorage.setItem(WEEK_PLAN_STORAGE_KEY, JSON.stringify(stored));

    render(<WeekPlan />);

    const mondayLink = await screen.findByRole("link", { name: /Mon.*Fish Sinigang/i });
    expect(mondayLink).toHaveAttribute("href", "/recipes/fish-sinigang");
  });

  it("saves a reassignment from the day picker", async () => {
    const user = userEvent.setup();
    render(<WeekPlan />);

    await user.click(screen.getByRole("button", { name: /edit week/i }));

    await user.selectOptions(screen.getByRole("combobox", { name: /recipe for mon/i }), "fish-sinigang");

    const stored = JSON.parse(window.localStorage.getItem(WEEK_PLAN_STORAGE_KEY) ?? "null") as typeof weekPlan;
    expect(stored.find((slot) => slot.day === "Mon")?.slug).toBe("fish-sinigang");
  });

  it("resets the persisted plan back to the default", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      WEEK_PLAN_STORAGE_KEY,
      JSON.stringify(assignRecipeToDay(weekPlan, "Mon", "fish-sinigang")),
    );

    render(<WeekPlan />);
    await screen.findByRole("link", { name: /Mon.*Fish Sinigang/i });

    await user.click(screen.getByRole("button", { name: /edit week/i }));
    await user.click(screen.getByRole("button", { name: /reset to default/i }));

    expect(window.localStorage.getItem(WEEK_PLAN_STORAGE_KEY)).toBeNull();
    expect(screen.getByRole("combobox", { name: /recipe for mon/i })).toHaveValue("ginisang-hipon");
  });
});
