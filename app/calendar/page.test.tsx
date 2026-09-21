import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CalendarPage from "./page";

describe("calendar page", () => {
  it("renders the couple calendar on /calendar", () => {
    render(<CalendarPage />);

    expect(screen.getByRole("heading", { name: /calendar/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /calendar/i })).toHaveAttribute("href", "/calendar");
    expect(screen.getByRole("link", { name: /payments/i })).toHaveAttribute("href", "/payments");
    expect(screen.getByRole("button", { name: /add event/i })).toBeInTheDocument();
  });
});
