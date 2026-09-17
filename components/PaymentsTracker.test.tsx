import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PAYMENTS_STORAGE_KEY, addPayment, savePayments } from "@/lib/payments";
import { PaymentsTracker } from "./PaymentsTracker";

describe("PaymentsTracker", () => {
  it("renders the empty state and how it works", () => {
    render(<PaymentsTracker />);

    expect(screen.getByRole("heading", { name: /who paid/i })).toBeInTheDocument();
    expect(screen.getByText("Settled")).toBeInTheDocument();
    expect(
      screen.getByText(/shared 50\/50\. whoever didn't pay owes half/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add spend/i })).toBeInTheDocument();
  });

  it("adds an entry and shows the 50/50 balance", async () => {
    const user = userEvent.setup();
    render(<PaymentsTracker />);

    await user.click(screen.getByRole("button", { name: /^ian$/i }));
    await user.type(screen.getByLabelText(/amount/i), "10");
    await user.type(screen.getByLabelText(/what it was for/i), "Tesco shop");
    await user.click(screen.getByRole("button", { name: /add spend/i }));

    expect(screen.getByText("Ian is owed £5.00")).toBeInTheDocument();
    expect(screen.getByText("Tesco shop")).toBeInTheDocument();
    expect(screen.getByText("£10.00")).toBeInTheDocument();
    expect(screen.getByText(/paid by ian/i)).toBeInTheDocument();

    const stored = JSON.parse(window.localStorage.getItem(PAYMENTS_STORAGE_KEY) ?? "null");
    expect(stored).toHaveLength(1);
    expect(stored[0].description).toBe("Tesco shop");
    expect(stored[0].paidBy).toBe("Ian");
    expect(stored[0].amountPence).toBe(1000);
  });

  it("loads entries from localStorage", async () => {
    savePayments(
      addPayment([], {
        date: "2026-09-12",
        description: "Waitrose",
        amountPence: 2000,
        paidBy: "Avery",
        note: "fruit",
      }),
    );

    render(<PaymentsTracker />);

    expect(await screen.findByText("Waitrose")).toBeInTheDocument();
    expect(screen.getByText("Avery is owed £10.00")).toBeInTheDocument();
    expect(screen.getByText("£20.00")).toBeInTheDocument();
    expect(screen.getByText(/paid by avery/i)).toBeInTheDocument();
    expect(screen.getByText("fruit")).toBeInTheDocument();
  });

  it("deletes an entry after confirm", async () => {
    const user = userEvent.setup();
    savePayments(
      addPayment([], {
        date: "2026-09-12",
        description: "Waitrose",
        amountPence: 2000,
        paidBy: "Avery",
      }),
    );

    render(<PaymentsTracker />);
    expect(await screen.findByText("Waitrose")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /delete waitrose/i }));
    const dialog = screen.getByRole("dialog", { name: /remove this spend/i });
    await user.click(within(dialog).getByRole("button", { name: /remove/i }));

    expect(screen.queryByText("Waitrose")).not.toBeInTheDocument();
    expect(screen.getByText("Settled")).toBeInTheDocument();
    expect(window.localStorage.getItem(PAYMENTS_STORAGE_KEY)).toBe("[]");
  });
});
