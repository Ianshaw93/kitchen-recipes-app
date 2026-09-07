import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { IngredientList } from "./IngredientList";
import { StepList } from "./StepList";

const ingredients = [
  { id: "prawns", item: "400 g raw prawns, peeled" },
  { id: "garlic", item: "4 garlic cloves, minced" },
];

const steps = [
  "Hot pan. Oil in. Garlic until just fragrant.",
  "Prawns in. Colour both sides.",
];

function renderBoth() {
  return render(
    <>
      <IngredientList slug="ginisang-hipon" ingredients={ingredients} />
      <StepList slug="ginisang-hipon" steps={steps} />
    </>,
  );
}

function stepsSection() {
  const heading = screen.getByRole("heading", { name: "Steps" });
  const section = heading.closest("section");
  expect(section).toBeTruthy();
  return section as HTMLElement;
}

function ingredientsSection() {
  const heading = screen.getByRole("heading", { name: "Ingredients" });
  const section = heading.closest("section");
  expect(section).toBeTruthy();
  return section as HTMLElement;
}

describe("step checklist", () => {
  it("toggles a step on tap and updates progress", async () => {
    const user = userEvent.setup();
    render(<StepList slug="ginisang-hipon" steps={steps} />);

    const row = screen.getByRole("button", { name: /hot pan/i });
    expect(row).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Tap to tick · 0/2")).toBeInTheDocument();

    await user.click(row);

    expect(row).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Tap to tick · 1/2")).toBeInTheDocument();
    expect(screen.getByText(steps[0])).toHaveClass("line-through");

    await user.click(row);

    expect(row).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Tap to tick · 0/2")).toBeInTheDocument();
  });

  it("persists step ticks across remount", async () => {
    const user = userEvent.setup();
    const view = render(<StepList slug="ginisang-hipon" steps={steps} />);

    await user.click(screen.getByRole("button", { name: /hot pan/i }));
    expect(screen.getByText("Tap to tick · 1/2")).toBeInTheDocument();

    view.unmount();
    render(<StepList slug="ginisang-hipon" steps={steps} />);

    expect(screen.getByRole("button", { name: /hot pan/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("Tap to tick · 1/2")).toBeInTheDocument();
  });

  it("clears step ticks only", async () => {
    const user = userEvent.setup();
    render(<StepList slug="ginisang-hipon" steps={steps} />);

    await user.click(screen.getByRole("button", { name: /hot pan/i }));
    expect(screen.getByText("Tap to tick · 1/2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear ticks" }));

    expect(screen.getByRole("button", { name: /hot pan/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByText("Tap to tick · 0/2")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear ticks" })).not.toBeInTheDocument();
  });

  it("keeps ingredient ticks separate from step ticks", async () => {
    const user = userEvent.setup();
    const view = renderBoth();

    await user.click(
      within(ingredientsSection()).getByRole("button", { name: ingredients[0].item }),
    );
    await user.click(within(stepsSection()).getByRole("button", { name: /hot pan/i }));

    expect(within(ingredientsSection()).getByText("Tap to tick · 1/2")).toBeInTheDocument();
    expect(within(stepsSection()).getByText("Tap to tick · 1/2")).toBeInTheDocument();

    await user.click(within(stepsSection()).getByRole("button", { name: "Clear ticks" }));

    expect(within(ingredientsSection()).getByText("Tap to tick · 1/2")).toBeInTheDocument();
    expect(within(stepsSection()).getByText("Tap to tick · 0/2")).toBeInTheDocument();
    expect(
      within(ingredientsSection()).getByRole("button", { name: ingredients[0].item }),
    ).toHaveAttribute("aria-pressed", "true");

    view.unmount();
    renderBoth();

    expect(
      within(ingredientsSection()).getByRole("button", { name: ingredients[0].item }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(within(ingredientsSection()).getByText("Tap to tick · 1/2")).toBeInTheDocument();
    expect(within(stepsSection()).getByRole("button", { name: /hot pan/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(within(stepsSection()).getByText("Tap to tick · 0/2")).toBeInTheDocument();
  });
});
