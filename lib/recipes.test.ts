import { describe, expect, it } from "vitest";
import { getRecipe, weekPlan } from "./recipes";

describe("recipe bank", () => {
  it("loads cheat chicken & sweetcorn soup by slug", () => {
    const recipe = getRecipe("cheat-chicken-sweetcorn-soup");

    expect(recipe).toBeDefined();
    expect(recipe?.number).toBe("07");
    expect(recipe?.title).toBe("Cheat Chicken & Sweetcorn Soup");
    expect(recipe?.slug).toBe("cheat-chicken-sweetcorn-soup");
  });

  it("does not assign the soup to the default week plan", () => {
    expect(weekPlan.map((slot) => slot.slug)).not.toContain("cheat-chicken-sweetcorn-soup");
    expect(weekPlan.map((slot) => slot.slug)).toEqual([
      "ginisang-hipon",
      "ginger-sesame-chicken",
      "sinigang-na-hipon",
      "asian-chicken-rice-bowl",
      "fish-sinigang",
      "chicken-tinola",
      "chicken-tinola",
    ]);
  });
});
