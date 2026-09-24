import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { recipes } from "@/lib/recipes";
import Home from "./page";

describe("recipe list", () => {
  it("renders all recipes", () => {
    render(<Home />);

    expect(recipes).toHaveLength(7);

    for (const recipe of recipes) {
      expect(
        screen.getByRole("heading", { name: recipe.title, level: 3 }),
      ).toBeInTheDocument();
    }
  });

  it("links to the payments and homes pages from home", () => {
    render(<Home />);

    expect(screen.getByRole("link", { name: /payments/i })).toHaveAttribute("href", "/payments");
    expect(screen.getByRole("link", { name: /homes/i })).toHaveAttribute("href", "/homes");
  });
});
