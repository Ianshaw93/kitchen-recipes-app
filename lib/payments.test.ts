import { describe, expect, it } from "vitest";
import {
  CURRENCY_STORAGE_KEY,
  PAYMENTS_STORAGE_KEY,
  SEED_PAYMENTS,
  THB_GBP_FALLBACK_RATE,
  addPayment,
  applyPaymentImport,
  calculateBalance,
  convertThbToPence,
  deletePayment,
  formatBaht,
  formatEntryAmount,
  formatPounds,
  hasDuplicatePayment,
  isValidFxRate,
  loadPayments,
  loadPreferredCurrency,
  parseAmountToPence,
  parseAmountToSatang,
  parsePaymentDraft,
  parsePaymentEntries,
  parsePaymentImportParams,
  parsePaymentsDocument,
  resolveThbDraft,
  savePayments,
  savePreferredCurrency,
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

describe("seeded household spends", () => {
  it("includes the Asda shop and car oil change with pence amounts", () => {
    expect(SEED_PAYMENTS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          paidBy: "Ian",
          amountPence: 5760,
          description: "Asda shop",
          date: "2026-09-17",
          note: "Delivery Fri 18 Sep 2026, 2–3pm · 18 Millhouse Drive, G20 0UE",
        }),
        expect.objectContaining({
          paidBy: "Ian",
          amountPence: 7200,
          description: "Car oil change",
          date: "2026-09-21",
          note: "Shared car bill",
        }),
      ]),
    );
  });

  it("owes Ian half of the seeded total (Asda + oil change)", () => {
    const balance = calculateBalance(SEED_PAYMENTS);
    expect(balance).toEqual({
      status: "owed",
      to: "Ian",
      amountPence: 6480,
    });
    expect(summariseBalance(balance)).toBe("Ian is owed £64.80");
  });
});

describe("payment draft and document parsing", () => {
  it("parses a valid draft and rejects junk", () => {
    expect(
      parsePaymentDraft({
        date: "2026-09-17",
        description: "  Tesco shop ",
        amountPence: 1250,
        paidBy: "Avery",
        note: " apples ",
      }),
    ).toEqual({
      date: "2026-09-17",
      description: "Tesco shop",
      amountPence: 1250,
      paidBy: "Avery",
      note: "apples",
    });

    expect(parsePaymentDraft({ date: "17-09-2026", description: "x", amountPence: 1, paidBy: "Ian" })).toBeNull();
    expect(parsePaymentDraft({ date: "2026-09-17", description: "x", amountPence: 1.5, paidBy: "Ian" })).toBeNull();
    expect(parsePaymentDraft(null)).toBeNull();
  });

  it("parses a versioned document and a raw entry array", () => {
    const entries = addPayment([], {
      date: "2026-09-17",
      description: "Tesco",
      amountPence: 100,
      paidBy: "Ian",
    });

    expect(parsePaymentsDocument({ version: 1, entries })).toEqual({
      version: 1,
      entries,
    });
    expect(parsePaymentsDocument(entries)?.entries).toEqual(entries);
    expect(parsePaymentsDocument(null)).toBeNull();
    expect(parsePaymentsDocument({ version: 1, entries: [{ nope: true }] })).toBeNull();
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

describe("Thai baht money helpers", () => {
  it("parses baht amounts to satang", () => {
    expect(parseAmountToSatang("1250")).toBe(125000);
    expect(parseAmountToSatang("1,250")).toBe(125000);
    expect(parseAmountToSatang("฿1,250")).toBe(125000);
    expect(parseAmountToSatang(" 1250.50 ")).toBe(125050);
    expect(parseAmountToSatang("0")).toBeNull();
    expect(parseAmountToSatang("-5")).toBeNull();
    expect(parseAmountToSatang("abc")).toBeNull();
    expect(parseAmountToSatang("")).toBeNull();
  });

  it("formats satang as baht with thousands separators and no decimals unless entered", () => {
    expect(formatBaht(0)).toBe("฿0");
    expect(formatBaht(125000)).toBe("฿1,250");
    expect(formatBaht(125050)).toBe("฿1,250.50");
    expect(formatBaht(100000000)).toBe("฿1,000,000");
  });

  it("converts satang to pence at a rate", () => {
    expect(convertThbToPence(125000, 0.02272)).toBe(2840);
    expect(convertThbToPence(100000, 0.0228)).toBe(2280);
    expect(convertThbToPence(0, 0.0228)).toBe(0);
  });

  it("accepts only sane fx rates", () => {
    expect(isValidFxRate(0.0228)).toBe(true);
    expect(isValidFxRate(0.001)).toBe(true);
    expect(isValidFxRate(1)).toBe(true);
    expect(isValidFxRate(0.0009)).toBe(false);
    expect(isValidFxRate(1.5)).toBe(false);
    expect(isValidFxRate(Number.NaN)).toBe(false);
    expect(isValidFxRate(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isValidFxRate("0.02")).toBe(false);
    expect(isValidFxRate(undefined)).toBe(false);
  });

  it("keeps the approximate fallback rate in a sane range", () => {
    expect(THB_GBP_FALLBACK_RATE).toBeCloseTo(0.0228, 4);
    expect(isValidFxRate(THB_GBP_FALLBACK_RATE)).toBe(true);
  });
});

describe("Thai baht drafts", () => {
  it("parses a THB draft into a converted GBP amount", () => {
    expect(
      parsePaymentDraft({
        date: "2026-10-07",
        description: "  Night market ",
        paidBy: "Ian",
        currency: "THB",
        originalAmount: 125000,
        fxRate: 0.02272,
        note: " mango sticky rice ",
      }),
    ).toEqual({
      date: "2026-10-07",
      description: "Night market",
      paidBy: "Ian",
      currency: "THB",
      originalAmount: 125000,
      fxRate: 0.02272,
      fxSource: "manual",
      amountPence: 2840,
      note: "mango sticky rice",
    });
  });

  it("derives the GBP amount itself instead of trusting a client-supplied one", () => {
    const draft = parsePaymentDraft({
      date: "2026-10-07",
      description: "Songthaew",
      paidBy: "Avery",
      currency: "THB",
      originalAmount: 5000,
      amountPence: 99999,
    });

    expect(draft?.amountPence).toBe(Math.round(5000 * THB_GBP_FALLBACK_RATE));
    expect(draft?.fxRate).toBe(THB_GBP_FALLBACK_RATE);
    expect(draft?.fxSource).toBe("manual");
  });

  it("ignores an implausible client rate and uses the approximate fallback", () => {
    const draft = parsePaymentDraft({
      date: "2026-10-07",
      description: "Songthaew",
      paidBy: "Avery",
      currency: "THB",
      originalAmount: 10000,
      fxRate: 900,
    });

    expect(draft?.fxRate).toBe(THB_GBP_FALLBACK_RATE);
    expect(draft?.amountPence).toBe(Math.round(10000 * THB_GBP_FALLBACK_RATE));
  });

  it("rejects a THB draft without a usable amount", () => {
    const base = { date: "2026-10-07", description: "Night market", paidBy: "Ian" as const };
    expect(parsePaymentDraft({ ...base, currency: "THB" })).toBeNull();
    expect(parsePaymentDraft({ ...base, currency: "THB", originalAmount: 12.5 })).toBeNull();
    expect(parsePaymentDraft({ ...base, currency: "THB", originalAmount: -100 })).toBeNull();
    expect(parsePaymentDraft({ ...base, currency: "THB", originalAmount: 0 })).toBeNull();
  });

  it("rejects a THB draft that converts to less than a penny", () => {
    const base = { date: "2026-10-07", description: "Satang", paidBy: "Ian" as const };

    // Sub-penny baht amounts round to nothing at any sane rate.
    expect(convertThbToPence(20, 0.0228)).toBe(0);
    expect(parsePaymentDraft({ ...base, currency: "THB", originalAmount: 20 })).toBeNull();
    expect(
      parsePaymentDraft({ ...base, currency: "THB", originalAmount: 20, fxRate: 0.0228 }),
    ).toBeNull();
    expect(
      parsePaymentDraft({ ...base, currency: "THB", originalAmount: 21, fxRate: 0.0228 }),
    ).toBeNull();

    // ฿1 is two pence at the approximate rate, so it still parses.
    const baht = parsePaymentDraft({
      ...base,
      currency: "THB",
      originalAmount: 100,
      fxRate: 0.0228,
    });
    expect(baht?.amountPence).toBe(2);
  });

  it("treats GBP drafts exactly as before", () => {
    expect(
      parsePaymentDraft({
        date: "2026-10-07",
        description: "Tesco shop",
        amountPence: 1250,
        paidBy: "Avery",
        currency: "GBP",
      }),
    ).toEqual({
      date: "2026-10-07",
      description: "Tesco shop",
      amountPence: 1250,
      paidBy: "Avery",
    });

    expect(
      parsePaymentDraft({
        date: "2026-10-07",
        description: "Tesco shop",
        amountPence: 1250,
        paidBy: "Avery",
        currency: "EUR",
      }),
    ).toBeNull();
  });

  it("overrides the rate and source when the server resolves a live rate", () => {
    const parsed = parsePaymentDraft({
      date: "2026-10-07",
      description: "Night market",
      paidBy: "Ian",
      currency: "THB",
      originalAmount: 100000,
      fxRate: 0.0228,
    });
    expect(parsed).not.toBeNull();

    expect(resolveThbDraft(parsed!, { rate: 0.025, source: "live" })).toEqual({
      date: "2026-10-07",
      description: "Night market",
      paidBy: "Ian",
      currency: "THB",
      originalAmount: 100000,
      fxRate: 0.025,
      fxSource: "live",
      amountPence: 2500,
    });

    expect(resolveThbDraft(parsed!, { rate: 5000, source: "live" }).fxRate).toBe(0.0228);
    expect(resolveThbDraft(parsed!)).toEqual(parsed);
  });

  it("stores a THB spend with its converted amount and splits it 50/50", () => {
    const entries = addPayment([], {
      date: "2026-10-07",
      description: "Night market",
      paidBy: "Ian",
      amountPence: 1,
      currency: "THB",
      originalAmount: 125000,
      fxRate: 0.02272,
      fxSource: "live",
    });

    expect(entries[0]).toEqual(
      expect.objectContaining({
        currency: "THB",
        originalAmount: 125000,
        fxRate: 0.02272,
        fxSource: "live",
        amountPence: 2840,
      }),
    );
    expect(calculateBalance(entries)).toEqual({ status: "owed", to: "Ian", amountPence: 1420 });
  });

  it("shows both currencies for THB entries and pounds for GBP entries", () => {
    expect(formatEntryAmount({ amountPence: 2840, currency: "THB", originalAmount: 125000 })).toBe(
      "฿1,250 (£28.40)",
    );
    expect(formatEntryAmount({ amountPence: 7200 })).toBe("£72.00");
    expect(formatEntryAmount({ amountPence: 7200, currency: "GBP" })).toBe("£72.00");
  });

  it("detects duplicates on currency and baht amount", () => {
    const entries = addPayment([], {
      date: "2026-10-07",
      description: "Night market",
      paidBy: "Ian",
      amountPence: 2840,
      currency: "THB",
      originalAmount: 125000,
      fxRate: 0.02272,
    });

    const key = {
      date: "2026-10-07",
      description: "Night market",
      paidBy: "Ian" as const,
      amountPence: 2840,
      currency: "THB" as const,
    };

    expect(hasDuplicatePayment(entries, { ...key, originalAmount: 125000 })).toBe(true);
    expect(hasDuplicatePayment(entries, { ...key, originalAmount: 130000 })).toBe(false);
    expect(hasDuplicatePayment(entries, key)).toBe(false);
    expect(hasDuplicatePayment(entries, { ...key, currency: "GBP" })).toBe(false);
  });
});

describe("stored entries with currency", () => {
  const legacy = [
    {
      id: "old",
      date: "2026-09-17",
      description: "Asda shop",
      amountPence: 5760,
      paidBy: "Ian" as const,
      createdAt: "2026-09-17T12:00:00.000Z",
    },
  ];

  const thb = {
    id: "thb",
    date: "2026-10-07",
    description: "Night market",
    amountPence: 2840,
    paidBy: "Ian" as const,
    createdAt: "2026-10-07T12:00:00.000Z",
    currency: "THB" as const,
    originalAmount: 125000,
    fxRate: 0.02272,
    fxSource: "live" as const,
  };

  it("keeps old GBP entries valid without a currency field", () => {
    expect(parsePaymentEntries(legacy)).toEqual(legacy);
    expect(parsePaymentsDocument({ version: 1, entries: legacy })?.entries).toEqual(legacy);
  });

  it("accepts complete THB entries", () => {
    expect(parsePaymentEntries([thb])).toEqual([thb]);
  });

  it("rejects THB entries with missing or junk fx fields", () => {
    expect(parsePaymentEntries([{ ...thb, currency: "EUR" }])).toBeNull();
    expect(parsePaymentEntries([{ ...thb, originalAmount: undefined }])).toBeNull();
    expect(parsePaymentEntries([{ ...thb, originalAmount: 125000.5 }])).toBeNull();
    expect(parsePaymentEntries([{ ...thb, fxRate: 900 }])).toBeNull();
    expect(parsePaymentEntries([{ ...thb, fxSource: "guess" }])).toBeNull();
    expect(parsePaymentEntries([{ ...thb, fxSource: undefined }])).toBeNull();
  });
});

describe("preferred currency on the device", () => {
  it("defaults to GBP and remembers THB", () => {
    expect(loadPreferredCurrency()).toBe("GBP");

    savePreferredCurrency("THB");
    expect(window.localStorage.getItem(CURRENCY_STORAGE_KEY)).toBe("THB");
    expect(loadPreferredCurrency()).toBe("THB");

    savePreferredCurrency("GBP");
    expect(loadPreferredCurrency()).toBe("GBP");
  });

  it("falls back to GBP when the stored value is junk", () => {
    window.localStorage.setItem(CURRENCY_STORAGE_KEY, "EUR");
    expect(loadPreferredCurrency()).toBe("GBP");
  });
});

describe("query-string imports stay in GBP", () => {
  it("never adds currency fields to an imported draft", () => {
    const draft = parsePaymentImportParams({
      paidBy: "Ian",
      amount: "57.60",
      description: "Asda shop",
      date: "2026-09-17",
    });

    expect(draft).toEqual({
      paidBy: "Ian",
      amountPence: 5760,
      description: "Asda shop",
      date: "2026-09-17",
    });
    expect(draft && "currency" in draft).toBe(false);
  });
});
