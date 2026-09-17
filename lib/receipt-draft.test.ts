import { describe, expect, it } from "vitest";
import { spendDraftFromOutput } from "./receipt-draft";

describe("spendDraftFromOutput", () => {
  it("maps extracted receipt fields into form draft values", () => {
    expect(
      spendDraftFromOutput({
        amountPounds: 12.5,
        description: "Tesco shop",
        date: "2026-09-17",
        paidBy: "Avery",
        note: "self-checkout",
      }),
    ).toEqual({
      amount: "12.50",
      description: "Tesco shop",
      date: "2026-09-17",
      paidBy: "Avery",
      note: "self-checkout",
    });
  });

  it("parses pound strings and leaves unknown payer/date empty", () => {
    expect(
      spendDraftFromOutput({
        amountPounds: "£10",
        description: "  Waitrose  ",
        date: "not-a-date",
        paidBy: null,
        note: null,
      }),
    ).toEqual({
      amount: "10.00",
      description: "Waitrose",
      date: "",
      paidBy: "",
      note: "",
    });
  });

  it("returns empty amount when the model did not find a price", () => {
    expect(
      spendDraftFromOutput({
        amountPounds: null,
        description: "Coffee",
        date: null,
        paidBy: "Ian",
        note: null,
      }).amount,
    ).toBe("");
  });
});
