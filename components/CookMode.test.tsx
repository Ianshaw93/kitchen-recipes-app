import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { getRecipe } from "@/lib/recipes";
import { CookMode } from "./CookMode";

describe("cook mode", () => {
  it("moves forward and back through steps", async () => {
    const recipe = getRecipe("ginisang-hipon");
    expect(recipe).toBeDefined();
    if (!recipe) {
      return;
    }

    const user = userEvent.setup();
    render(<CookMode recipe={recipe} />);

    expect(screen.getByText("Step 1 / 4")).toBeInTheDocument();
    expect(screen.getByText(recipe.steps[0])).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByText("Step 2 / 4")).toBeInTheDocument();
    expect(screen.getByText(recipe.steps[1])).toBeInTheDocument();
    expect(screen.queryByText(recipe.steps[0])).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Back" }));

    expect(screen.getByText("Step 1 / 4")).toBeInTheDocument();
    expect(screen.getByText(recipe.steps[0])).toBeInTheDocument();
    expect(screen.queryByText(recipe.steps[1])).not.toBeInTheDocument();
  });
});
