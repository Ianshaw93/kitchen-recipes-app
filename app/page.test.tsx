import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { recipes } from "@/lib/recipes";
import Home from "./page";

describe("recipe list", () => {
  it("renders all six recipes", () => {
    render(<Home />);

    expect(recipes).toHaveLength(6);

    for (const recipe of recipes) {
      expect(
        screen.getByRole("heading", { name: recipe.title, level: 3 }),
      ).toBeInTheDocument();
    }
  });
});
