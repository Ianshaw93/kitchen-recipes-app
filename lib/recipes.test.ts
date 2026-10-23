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

  it("loads pad thai by slug", () => {
    const recipe = getRecipe("pad-thai");

    expect(recipe).toBeDefined();
    expect(recipe?.number).toBe("08");
    expect(recipe?.title).toBe("Pad Thai");
    expect(recipe?.serves).toBe("1");
    expect(recipe?.ingredients.map((ingredient) => ingredient.item)).toEqual(
      expect.arrayContaining([
        "2 tbsp tamarind paste",
        "½ tbsp fish sauce",
        "2 tbsp gluten-free oyster sauce",
        "½ tbsp palm sugar",
        "50 g chicken, bite-size pieces",
        "50 g thin rice noodles, soaked 10 minutes",
        "1 egg",
        "Ground peanuts, to taste",
      ]),
    );
    expect(recipe?.steps[0]).toMatch(/tamarind paste/i);
    expect(recipe?.steps.at(-1)).toMatch(/ground peanuts/i);
    expect(recipe?.steps.join("\n")).toMatch(/side of the wok/i);
  });

  it("does not assign pad thai to the default week plan", () => {
    expect(weekPlan.map((slot) => slot.slug)).not.toContain("pad-thai");
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
