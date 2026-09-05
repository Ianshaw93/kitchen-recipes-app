import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { recipes } from "@/lib/recipes";
import RecipePage from "./page";

async function renderRecipe(slug: string) {
  const page = await RecipePage({
    params: Promise.resolve({ slug }),
  } as Parameters<typeof RecipePage>[0]);

  return render(page);
}

describe("recipe detail", () => {
  it("renders ingredients and steps for every recipe", async () => {
    expect(recipes).toHaveLength(6);

    for (const recipe of recipes) {
      const view = await renderRecipe(recipe.slug);

      expect(
        screen.getByRole("heading", { name: recipe.title, level: 1 }),
      ).toBeInTheDocument();

      for (const ingredient of recipe.ingredients) {
        expect(
          screen.getByRole("button", { name: ingredient.item }),
        ).toBeInTheDocument();
      }

      for (const [index, step] of recipe.steps.entries()) {
        expect(screen.getByText(`Step ${index + 1}`)).toBeInTheDocument();
        expect(screen.getByText(step)).toBeInTheDocument();
      }

      view.unmount();
    }
  });
});
