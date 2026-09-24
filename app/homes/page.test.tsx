import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SEED_HOMES_WEEK } from "@/lib/homes";
import HomesPage from "./page";

describe("homes page", () => {
  it("renders the seeded shortlist and vote UI on /homes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ weeks: [SEED_HOMES_WEEK] })),
    );

    render(<HomesPage />);

    expect(screen.getByRole("heading", { name: /homes/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /homes/i })).toHaveAttribute("href", "/homes");

    expect(await screen.findByText("Archerhill Road, Knightswood")).toBeInTheDocument();
    expect(screen.getByText("124 Alderman Road, Knightswood")).toBeInTheDocument();
    expect(screen.getByText("Kelvindale Road, Kelvindale")).toBeInTheDocument();
    expect(screen.getByText("243 Alderman Road")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /i.?m ian/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /i.?m abby/i })).toBeInTheDocument();
  });
});
