import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TripPage from "./page";

async function renderTrip(slug: string) {
  const page = await TripPage({
    params: Promise.resolve({ slug }),
  } as Parameters<typeof TripPage>[0]);

  return render(page);
}

describe("trip detail", () => {
  it("shows Thailand budget bands and planning notes", async () => {
    await renderTrip("thailand");

    expect(
      screen.getByRole("heading", { name: /Thailand \(honey \/ baby moon\)/i, level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Ian \+ Abby/)).toBeInTheDocument();
    expect(screen.getByText(/~2 weeks/i)).toBeInTheDocument();
    expect(screen.getByText(/planning/i)).toBeInTheDocument();
    expect(screen.getByText("£1,200")).toBeInTheDocument();
    expect(screen.getByText("£1,500")).toBeInTheDocument();
    expect(screen.getByText("£2,000")).toBeInTheDocument();
    expect(screen.getByText(/lean/i)).toBeInTheDocument();
    expect(screen.getByText(/comfort/i)).toBeInTheDocument();
    expect(screen.getByText(/between us both/i)).toBeInTheDocument();
    expect(screen.getByText(/RBS Platinum/i)).toBeInTheDocument();
    expect(screen.getByText(/Going Abroad/i)).toBeInTheDocument();
    expect(screen.getByText(/0% FX/i)).toBeInTheDocument();
    expect(screen.getByText(/flights already paid/i)).toBeInTheDocument();
    expect(screen.getByText(/no Phuket/i)).toBeInTheDocument();
    expect(screen.getByText(/no alcohol/i)).toBeInTheDocument();
  });
});
