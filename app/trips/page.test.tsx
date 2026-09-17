import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TripsPage from "./page";

describe("trips list", () => {
  it("renders Thailand and links through to the detail route", () => {
    render(<TripsPage />);

    expect(screen.getByRole("heading", { name: /^trips$/i, level: 1 })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Thailand \(honey \/ baby moon\)/i }),
    ).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /Thailand \(honey \/ baby moon\)/i })).toHaveAttribute(
      "href",
      "/trips/thailand",
    );
  });

  it("keeps the header Trips nav link", () => {
    render(<TripsPage />);

    expect(screen.getByRole("link", { name: /^trips$/i })).toHaveAttribute("href", "/trips");
  });
});
