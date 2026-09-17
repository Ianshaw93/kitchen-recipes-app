import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PaymentsPage from "./page";

describe("payments page", () => {
  it("renders the payments tracker on /payments", () => {
    render(<PaymentsPage />);

    expect(screen.getByRole("heading", { name: /who paid/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /payments/i })).toHaveAttribute("href", "/payments");
    expect(screen.getByRole("button", { name: /add spend/i })).toBeInTheDocument();
  });
});
