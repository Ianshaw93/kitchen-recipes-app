import { describe, expect, it } from "vitest";
import { recipes } from "./recipes";

const sweetener = /\b(honey|maple)\b/i;
const peanut = /\bpeanuts?\b/i;

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
  it("has exactly eight recipes", () => {
    expect(recipes).toHaveLength(8);
  });

  it("does not include honey or maple in any recipe content", () => {
    for (const recipe of recipes) {
      expect(recipeText(recipe), recipe.slug).not.toMatch(sweetener);
    }
  });

  it("keeps peanuts to the pad thai garnish", () => {
    for (const recipe of recipes) {
      const text = recipeText(recipe);
      if (recipe.slug === "pad-thai") {
        expect(text).toMatch(peanut);
      } else {
        expect(text, recipe.slug).not.toMatch(peanut);
      }
    }
  });
});
