import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { recipes } from "@/lib/recipes";
import { RELATIONSHIP_PATH } from "@/lib/relationship";
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

  it("links to the shop, payments, and homes pages from home", () => {
    render(<Home />);

    expect(screen.getByRole("link", { name: /^shop$/i })).toHaveAttribute("href", "/shop");
    expect(screen.getByRole("link", { name: /payments/i })).toHaveAttribute("href", "/payments");
    expect(screen.getByRole("link", { name: /homes/i })).toHaveAttribute("href", "/homes");
  });

  it("does not link the relationship page from home or the header", () => {
    render(<Home />);

    expect(document.querySelector(`a[href="${RELATIONSHIP_PATH}"]`)).toBeNull();
    expect(document.querySelector('a[href="/relationship"]')).toBeNull();
    expect(screen.queryByRole("link", { name: /relationship/i })).not.toBeInTheDocument();
  });
});
