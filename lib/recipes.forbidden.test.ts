import { describe, expect, it } from "vitest";
import { recipes } from "./recipes";

const forbidden = /\b(honey|maple|peanuts?)\b/i;

function recipeText(recipe: (typeof recipes)[number]) {
  return [
    recipe.slug,
    recipe.title,
    recipe.filipino ?? "",
    recipe.summary,
    ...recipe.ingredients.map((ingredient) => `${ingredient.group ?? ""} ${ingredient.item}`),
    ...recipe.steps,
    ...(recipe.notes ?? []),
  ].join("\n");
}

describe("recipe diet rules", () => {
  it("has exactly six recipes", () => {
    expect(recipes).toHaveLength(6);
  });

  it("does not include honey, maple, or peanut in any recipe content", () => {
    for (const recipe of recipes) {
      expect(recipeText(recipe), recipe.slug).not.toMatch(forbidden);
    }
  });
});
