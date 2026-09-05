import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { IngredientList } from "./IngredientList";

const ingredients = [
  { id: "prawns", item: "400 g raw prawns, peeled" },
  { id: "garlic", item: "4 garlic cloves, minced" },
];

describe("ingredient checklist", () => {
  it("toggles an ingredient on tap", async () => {
    const user = userEvent.setup();
    render(<IngredientList slug="ginisang-hipon" ingredients={ingredients} />);

    const row = screen.getByRole("button", { name: ingredients[0].item });
    expect(row).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Tap to tick · 0/2")).toBeInTheDocument();

    await user.click(row);

    expect(row).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Tap to tick · 1/2")).toBeInTheDocument();

    await user.click(row);

    expect(row).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Tap to tick · 0/2")).toBeInTheDocument();
  });
});
