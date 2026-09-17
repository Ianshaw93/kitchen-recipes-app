import { describe, expect, it } from "vitest";
import {
  PAYMENTS_STORAGE_KEY,
  addPayment,
  applyPaymentImport,
  calculateBalance,
  deletePayment,
  formatPounds,
  loadPayments,
  parseAmountToPence,
  parsePaymentImportParams,
  savePayments,
  summariseBalance,
} from "./payments";

describe("payment storage", () => {
  it("loads an empty list when nothing is stored", () => {
    expect(window.localStorage.getItem(PAYMENTS_STORAGE_KEY)).toBeNull();
    expect(loadPayments()).toEqual([]);
  });

  it("saves entries and loads them back", () => {
    const entries = addPayment([], {
      date: "2026-09-17",
      description: "Tesco shop",
      amountPence: 2450,
      paidBy: "Avery",
      note: "veg and rice",
    });

    savePayments(entries);

    expect(loadPayments()).toEqual(entries);
    expect(JSON.parse(window.localStorage.getItem(PAYMENTS_STORAGE_KEY) ?? "null")).toEqual(
      entries,
    );
  });

  it("falls back to an empty list when stored data is invalid", () => {
    window.localStorage.setItem(PAYMENTS_STORAGE_KEY, "{not-json");
    expect(loadPayments()).toEqual([]);

    window.localStorage.setItem(
      PAYMENTS_STORAGE_KEY,
      JSON.stringify([{ date: "nope", amountPence: "twelve" }]),
    );
    expect(loadPayments()).toEqual([]);
  });
});

describe("add and delete entries", () => {
  it("adds an entry with a generated id and keeps newest first", () => {
    const first = addPayment([], {
      date: "2026-09-10",
      description: "Milk",
      amountPence: 200,
      paidBy: "Ian",
    });
    const next = addPayment(first, {
      date: "2026-09-17",
      description: "Rice",
      amountPence: 400,
      paidBy: "Avery",
      note: "jasmine",
    });

    expect(next).toHaveLength(2);
    expect(next[0]?.description).toBe("Rice");
    expect(next[0]?.paidBy).toBe("Avery");
    expect(next[0]?.amountPence).toBe(400);
    expect(next[0]?.date).toBe("2026-09-17");
    expect(next[0]?.note).toBe("jasmine");
    expect(next[0]?.id).toEqual(expect.any(String));
    expect(next[0]?.id).not.toBe(next[1]?.id);
    expect(next[1]?.description).toBe("Milk");
  });

  it("deletes an entry by id", () => {
    const entries = addPayment([], {
      date: "2026-09-17",
      description: "Tesco shop",
      amountPence: 1000,
      paidBy: "Ian",
    });
    const id = entries[0]?.id;
    expect(id).toBeDefined();

    expect(deletePayment(entries, id ?? "")).toEqual([]);
    expect(deletePayment(entries, "missing")).toEqual(entries);
  });
});

describe("50/50 balance math", () => {
  it("is settled with no entries", () => {
    expect(calculateBalance([])).toEqual({ status: "settled" });
    expect(summariseBalance(calculateBalance([]))).toBe("Settled");
  });

  it("owes the other person half when one person paid", () => {
    const entries = addPayment([], {
      date: "2026-09-17",
      description: "Tesco",
      amountPence: 1000,
      paidBy: "Ian",
    });

    expect(calculateBalance(entries)).toEqual({
      status: "owed",
      to: "Ian",
      amountPence: 500,
    });
    expect(summariseBalance(calculateBalance(entries))).toBe("Ian is owed £5.00");
  });

  it("nets spends so the person who paid more is owed half the difference", () => {
    let entries = addPayment([], {
      date: "2026-09-16",
      description: "Tesco",
      amountPence: 1000,
      paidBy: "Ian",
    });
    entries = addPayment(entries, {
      date: "2026-09-17",
      description: "Waitrose",
      amountPence: 2000,
      paidBy: "Avery",
    });

    expect(calculateBalance(entries)).toEqual({
      status: "owed",
      to: "Avery",
      amountPence: 500,
    });
    expect(summariseBalance(calculateBalance(entries))).toBe("Avery is owed £5.00");
  });

  it("is settled when both paid the same total", () => {
    let entries = addPayment([], {
      date: "2026-09-16",
      description: "Bread",
      amountPence: 300,
      paidBy: "Ian",
    });
    entries = addPayment(entries, {
      date: "2026-09-17",
      description: "Eggs",
      amountPence: 300,
      paidBy: "Avery",
    });

    expect(calculateBalance(entries)).toEqual({ status: "settled" });
  });
});

describe("payment import from query params", () => {
  const payload = {
    paidBy: "Ian",
    amount: "57.60",
    description: "Asda shop",
    date: "2026-09-17",
    note: "Delivery Fri 18 Sep 2026, 2–3pm · 18 Millhouse Drive, G20 0UE",
  };

  it("parses query params into a payment draft", () => {
    expect(parsePaymentImportParams(payload)).toEqual({
      paidBy: "Ian",
      amountPence: 5760,
      description: "Asda shop",
      date: "2026-09-17",
      note: "Delivery Fri 18 Sep 2026, 2–3pm · 18 Millhouse Drive, G20 0UE",
    });
  });

  it("defaults date to today when omitted", () => {
    expect(
      parsePaymentImportParams(
        {
          paidBy: "Avery",
          amount: "12.50",
          description: "Tesco shop",
        },
        "2026-09-17",
      ),
    ).toEqual({
      paidBy: "Avery",
      amountPence: 1250,
      description: "Tesco shop",
      date: "2026-09-17",
    });
  });

  it("rejects invalid payer, amount, description, or date", () => {
    expect(parsePaymentImportParams({ ...payload, paidBy: "Alex" })).toBeNull();
    expect(parsePaymentImportParams({ ...payload, amount: "0" })).toBeNull();
    expect(parsePaymentImportParams({ ...payload, description: "  " })).toBeNull();
    expect(parsePaymentImportParams({ ...payload, date: "17-09-2026" })).toBeNull();
  });

  it("adds a parsed payload via addPayment", () => {
    const entries = applyPaymentImport([], payload);

    expect(entries).toHaveLength(1);
    expect(entries[0]?.paidBy).toBe("Ian");
    expect(entries[0]?.amountPence).toBe(5760);
    expect(entries[0]?.description).toBe("Asda shop");
    expect(entries[0]?.date).toBe("2026-09-17");
    expect(entries[0]?.note).toBe(
      "Delivery Fri 18 Sep 2026, 2–3pm · 18 Millhouse Drive, G20 0UE",
    );
  });

  it("does not double-add on a second parse with the same payload", () => {
    const first = applyPaymentImport([], payload);
    const second = applyPaymentImport(first, payload);

    expect(second).toHaveLength(1);
    expect(second[0]?.id).toBe(first[0]?.id);
  });
});

describe("money helpers", () => {
  it("parses pound amounts to pence", () => {
    expect(parseAmountToPence("12.50")).toBe(1250);
    expect(parseAmountToPence("12")).toBe(1200);
    expect(parseAmountToPence("0.01")).toBe(1);
    expect(parseAmountToPence("0")).toBeNull();
    expect(parseAmountToPence("-3")).toBeNull();
    expect(parseAmountToPence("abc")).toBeNull();
    expect(parseAmountToPence("")).toBeNull();
  });

  it("formats pence as pounds", () => {
    expect(formatPounds(0)).toBe("£0.00");
    expect(formatPounds(500)).toBe("£5.00");
    expect(formatPounds(2450)).toBe("£24.50");
  });
});
