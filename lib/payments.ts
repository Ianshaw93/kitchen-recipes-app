export const PAYMENTS_STORAGE_KEY = "kusina:payments:v1";
export const PAYMENTS_KV_KEY = PAYMENTS_STORAGE_KEY;

/** Remembered on the device so a trip's currency stays selected. */
export const CURRENCY_STORAGE_KEY = "kusina:payments:currency";

/** Approximate THB→GBP rate used when no live rate is reachable. */
export const THB_GBP_FALLBACK_RATE = 0.0228;

/** Sane range for a THB→GBP rate; anything outside is treated as junk. */
export const FX_RATE_MIN = 0.001;
export const FX_RATE_MAX = 1;

export type Payer = "Ian" | "Avery";

export type PaymentCurrency = "GBP" | "THB";

/** Where a THB→GBP rate came from: the live provider or a manual/fallback entry. */
export type FxSource = "live" | "manual";

export type ThbGbpRate = {
  base: "THB";
  quote: "GBP";
  rate: number;
  source: string;
  fetchedAt: string;
};

export type PaymentEntry = {
  id: string;
  date: string;
  description: string;
  amountPence: number;
  paidBy: Payer;
  note?: string;
  createdAt: string;
  /** Entries without a currency are GBP. */
  currency?: PaymentCurrency;
  /** Original amount in satang (baht × 100) for THB entries. */
  originalAmount?: number;
  fxRate?: number;
  fxSource?: FxSource;
};

export type PaymentDraft = {
  date: string;
  description: string;
  amountPence: number;
  paidBy: Payer;
  note?: string;
  currency?: PaymentCurrency;
  /** Original amount in satang (baht × 100) for THB drafts. */
  originalAmount?: number;
  fxRate?: number;
  fxSource?: FxSource;
};

export type PaymentImportParams = {
  paidBy?: string | null;
  amount?: string | null;
  description?: string | null;
  date?: string | null;
  note?: string | null;
};

/** What makes two spends the same one: payer, amount, description and date. */
export type PaymentDuplicateKey = Pick<
  PaymentDraft,
  "paidBy" | "amountPence" | "description" | "date" | "currency" | "originalAmount"
>;

export type PaymentsDocument = {
  version: 1;
  entries: PaymentEntry[];
};

export const SEED_PAYMENTS: PaymentEntry[] = [
  {
    id: "seed-asda-shop-2026-09-17",
    date: "2026-09-17",
    description: "Asda shop",
    amountPence: 5760,
    paidBy: "Ian",
    note: "Delivery Fri 18 Sep 2026, 2–3pm · 18 Millhouse Drive, G20 0UE",
    createdAt: "2026-09-17T12:00:00.000Z",
  },
  {
    id: "seed-car-oil-change-2026-09-21",
    date: "2026-09-21",
    description: "Car oil change",
    amountPence: 7200,
    paidBy: "Ian",
    note: "Shared car bill",
    createdAt: "2026-09-21T12:00:00.000Z",
  },
];

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type PaymentBalance =
  | { status: "settled" }
  | { status: "owed"; to: Payer; amountPence: number };

function isPayer(value: unknown): value is Payer {
  return value === "Ian" || value === "Avery";
}

function isCurrency(value: unknown): value is PaymentCurrency {
  return value === "GBP" || value === "THB";
}

function isFxSource(value: unknown): value is FxSource {
  return value === "live" || value === "manual";
}

/** A positive whole number of minor units (pence or satang), i.e. at least 1. */
export function isMinorUnits(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

/** THB→GBP rates outside this range are junk, not exchange rates. */
export function isValidFxRate(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= FX_RATE_MIN &&
    value <= FX_RATE_MAX
  );
}

/** Converts satang to pence at a THB→GBP rate. */
export function convertThbToPence(satang: number, rate: number): number {
  return Math.round(satang * rate);
}

/**
 * Fills in the baht side of a THB draft: a whole satang amount, a sane rate and its
 * source, and the GBP amount derived from them. GBP drafts pass through untouched.
 */
export function resolveThbDraft(
  draft: PaymentDraft,
  options: { rate?: number; source?: FxSource } = {},
): PaymentDraft {
  if (draft.currency !== "THB") {
    return draft;
  }

  const rate = isValidFxRate(options.rate)
    ? options.rate
    : isValidFxRate(draft.fxRate)
      ? draft.fxRate
      : THB_GBP_FALLBACK_RATE;
  const originalAmount = isMinorUnits(draft.originalAmount)
    ? draft.originalAmount
    : Math.max(1, Math.round(draft.amountPence / rate));

  return {
    ...draft,
    currency: "THB",
    originalAmount,
    fxRate: rate,
    fxSource: options.source ?? draft.fxSource ?? "manual",
    amountPence: convertThbToPence(originalAmount, rate),
  };
}

function isValidEntry(value: unknown): value is PaymentEntry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const entry = value as Partial<PaymentEntry>;
  if (typeof entry.id !== "string" || entry.id.length === 0) {
    return false;
  }
  if (typeof entry.date !== "string" || !ISO_DATE_PATTERN.test(entry.date)) {
    return false;
  }
  if (typeof entry.description !== "string" || entry.description.trim().length === 0) {
    return false;
  }
  if (
    typeof entry.amountPence !== "number" ||
    !Number.isInteger(entry.amountPence) ||
    entry.amountPence <= 0
  ) {
    return false;
  }
  if (!isPayer(entry.paidBy)) {
    return false;
  }
  if (entry.note !== undefined && typeof entry.note !== "string") {
    return false;
  }
  if (typeof entry.createdAt !== "string" || entry.createdAt.length === 0) {
    return false;
  }
  if (entry.currency !== undefined && !isCurrency(entry.currency)) {
    return false;
  }
  if (entry.originalAmount !== undefined && !isMinorUnits(entry.originalAmount)) {
    return false;
  }
  if (entry.fxRate !== undefined && !isValidFxRate(entry.fxRate)) {
    return false;
  }
  if (entry.fxSource !== undefined && !isFxSource(entry.fxSource)) {
    return false;
  }
  if (
    entry.currency === "THB" &&
    (entry.originalAmount === undefined ||
      entry.fxRate === undefined ||
      entry.fxSource === undefined)
  ) {
    return false;
  }

  return true;
}

function isValidEntries(value: unknown): value is PaymentEntry[] {
  return Array.isArray(value) && value.every(isValidEntry);
}

export function parsePaymentEntries(value: unknown): PaymentEntry[] | null {
  if (!isValidEntries(value)) {
    return null;
  }

  return sortNewestFirst(value);
}

export function parsePaymentDraft(value: unknown): PaymentDraft | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const draft = value as Partial<PaymentDraft>;
  if (typeof draft.date !== "string" || !ISO_DATE_PATTERN.test(draft.date)) {
    return null;
  }
  if (typeof draft.description !== "string" || draft.description.trim().length === 0) {
    return null;
  }
  if (draft.currency !== undefined && !isCurrency(draft.currency)) {
    return null;
  }
  if (!isPayer(draft.paidBy)) {
    return null;
  }
  if (draft.note !== undefined && typeof draft.note !== "string") {
    return null;
  }

  const note = draft.note?.trim();

  if (draft.currency === "THB") {
    // The client's baht amount wins; its GBP estimate and rate are only a starting point.
    if (!isMinorUnits(draft.originalAmount) && !isMinorUnits(draft.amountPence)) {
      return null;
    }

    const parsed: PaymentDraft = {
      date: draft.date,
      description: draft.description.trim(),
      amountPence: isMinorUnits(draft.amountPence) ? draft.amountPence : 0,
      paidBy: draft.paidBy,
      currency: "THB",
    };

    if (isMinorUnits(draft.originalAmount)) {
      parsed.originalAmount = draft.originalAmount;
    }
    if (isValidFxRate(draft.fxRate)) {
      parsed.fxRate = draft.fxRate;
    }
    if (note) {
      parsed.note = note;
    }

    // A tiny baht amount rounds to 0p, which could never be stored.
    const resolved = resolveThbDraft(parsed);
    return isMinorUnits(resolved.amountPence) ? resolved : null;
  }

  if (
    typeof draft.amountPence !== "number" ||
    !Number.isInteger(draft.amountPence) ||
    draft.amountPence <= 0
  ) {
    return null;
  }

  const parsed: PaymentDraft = {
    date: draft.date,
    description: draft.description.trim(),
    amountPence: draft.amountPence,
    paidBy: draft.paidBy,
  };

  if (note) {
    parsed.note = note;
  }

  return parsed;
}

export function parsePaymentsDocument(value: unknown): PaymentsDocument | null {
  if (value == null) {
    return null;
  }

  if (Array.isArray(value)) {
    const entries = parsePaymentEntries(value);
    return entries ? { version: 1, entries } : null;
  }

  if (typeof value !== "object") {
    return null;
  }

  const doc = value as Partial<PaymentsDocument>;
  if (doc.version !== 1) {
    return null;
  }

  const entries = parsePaymentEntries(doc.entries);
  if (!entries) {
    return null;
  }

  return { version: 1, entries };
}

export function paymentsDocument(entries: PaymentEntry[]): PaymentsDocument {
  return { version: 1, entries: sortNewestFirst(entries) };
}

export function findDuplicatePayment(
  entries: PaymentEntry[],
  draft: PaymentDuplicateKey,
): PaymentEntry | undefined {
  const description = draft.description.trim();
  return entries.find(
    (entry) =>
      entry.paidBy === draft.paidBy &&
      sameAmount(entry, draft) &&
      entry.description === description &&
      entry.date === draft.date,
  );
}

/** THB spends match on the baht amount; everything else matches on pence. */
function sameAmount(entry: PaymentEntry, draft: PaymentDuplicateKey): boolean {
  const entryCurrency = entry.currency ?? "GBP";
  const draftCurrency = draft.currency ?? "GBP";
  if (entryCurrency !== draftCurrency) {
    return false;
  }

  if (draftCurrency === "THB") {
    return entry.originalAmount === draft.originalAmount;
  }

  return entry.amountPence === draft.amountPence;
}

export function sortNewestFirst(entries: PaymentEntry[]): PaymentEntry[] {
  return [...entries].sort((left, right) => {
    if (left.date !== right.date) {
      return left.date < right.date ? 1 : -1;
    }
    if (left.createdAt !== right.createdAt) {
      return left.createdAt < right.createdAt ? 1 : -1;
    }
    return left.id < right.id ? 1 : -1;
  });
}

export function parseAmountToPence(input: string): number | null {
  return parseAmountToMinorUnits(input, "£");
}

export function parseAmountToSatang(input: string): number | null {
  return parseAmountToMinorUnits(input, "฿");
}

function parseAmountToMinorUnits(input: string, symbol: string): number | null {
  const trimmed = input.trim().replace(symbol, "").replace(/,/g, "").trim();
  if (!trimmed) {
    return null;
  }

  const amount = Number(trimmed);
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return Math.round(amount * 100);
}

export function formatPounds(pence: number): string {
  const abs = Math.abs(Math.round(pence));
  const pounds = Math.floor(abs / 100);
  const remainder = abs % 100;
  const sign = pence < 0 ? "-" : "";
  return `${sign}£${pounds}.${String(remainder).padStart(2, "0")}`;
}

/** Baht with thousands separators, and satang only when they were entered. */
export function formatBaht(satang: number): string {
  const abs = Math.abs(Math.round(satang));
  const baht = Math.floor(abs / 100);
  const remainder = abs % 100;
  const sign = satang < 0 ? "-" : "";
  const grouped = String(baht).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  if (remainder === 0) {
    return `${sign}฿${grouped}`;
  }

  return `${sign}฿${grouped}.${String(remainder).padStart(2, "0")}`;
}

/** "฿1,250 (£28.40)" for baht spends, "£72.00" for pound spends. */
export function formatEntryAmount(
  entry: Pick<PaymentEntry, "amountPence" | "currency" | "originalAmount">,
): string {
  if (entry.currency === "THB" && typeof entry.originalAmount === "number") {
    return `${formatBaht(entry.originalAmount)} (${formatPounds(entry.amountPence)})`;
  }

  return formatPounds(entry.amountPence);
}

export function calculateBalance(entries: PaymentEntry[]): PaymentBalance {
  let ian = 0;
  let avery = 0;

  for (const entry of entries) {
    if (entry.paidBy === "Ian") {
      ian += entry.amountPence;
    } else {
      avery += entry.amountPence;
    }
  }

  const diff = ian - avery;
  if (diff === 0) {
    return { status: "settled" };
  }

  if (diff > 0) {
    return { status: "owed", to: "Ian", amountPence: Math.round(diff / 2) };
  }

  return { status: "owed", to: "Avery", amountPence: Math.round(-diff / 2) };
}

export function summariseBalance(balance: PaymentBalance): string {
  if (balance.status === "settled") {
    return "Settled";
  }

  return `${balance.to} is owed ${formatPounds(balance.amountPence)}`;
}

export function hasPaymentImportParams(params?: PaymentImportParams | null): boolean {
  if (!params) {
    return false;
  }

  return Boolean(params.paidBy || params.amount || params.description || params.date || params.note);
}

export function parsePaymentImportParams(
  params: PaymentImportParams,
  today: string = todayISODate(),
): PaymentDraft | null {
  const paidBy = params.paidBy?.trim();
  const description = params.description?.trim() ?? "";
  const date = params.date?.trim() || today;
  const note = params.note?.trim();
  const amountPence = parseAmountToPence(params.amount ?? "");

  if (!isPayer(paidBy) || !amountPence || !description || !ISO_DATE_PATTERN.test(date)) {
    return null;
  }

  const draft: PaymentDraft = {
    date,
    description,
    amountPence,
    paidBy,
  };

  if (note) {
    draft.note = note;
  }

  return draft;
}

export function hasDuplicatePayment(
  entries: PaymentEntry[],
  draft: PaymentDuplicateKey,
): boolean {
  return Boolean(findDuplicatePayment(entries, draft));
}

export function applyPaymentImport(
  entries: PaymentEntry[],
  params: PaymentImportParams,
  today: string = todayISODate(),
): PaymentEntry[] {
  const draft = parsePaymentImportParams(params, today);
  if (!draft || hasDuplicatePayment(entries, draft)) {
    return entries;
  }

  return addPayment(entries, draft);
}

export function addPayment(entries: PaymentEntry[], draft: PaymentDraft): PaymentEntry[] {
  const resolved = resolveThbDraft(draft);
  const entry: PaymentEntry = {
    id: crypto.randomUUID(),
    date: resolved.date,
    description: resolved.description.trim(),
    amountPence: resolved.amountPence,
    paidBy: resolved.paidBy,
    createdAt: new Date().toISOString(),
  };

  const note = resolved.note?.trim();
  if (note) {
    entry.note = note;
  }

  if (resolved.currency === "THB") {
    entry.currency = "THB";
    entry.originalAmount = resolved.originalAmount;
    entry.fxRate = resolved.fxRate;
    entry.fxSource = resolved.fxSource ?? "manual";
  }

  return sortNewestFirst([entry, ...entries]);
}

export function deletePayment(entries: PaymentEntry[], id: string): PaymentEntry[] {
  return entries.filter((entry) => entry.id !== id);
}

export function loadPayments(): PaymentEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(PAYMENTS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isValidEntries(parsed)) {
      return [];
    }

    return sortNewestFirst(parsed);
  } catch {
    return [];
  }
}

export function savePayments(entries: PaymentEntry[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(sortNewestFirst(entries)));
  } catch {
    // Ignore quota / private mode.
  }
}

/** The currency this device last logged a spend in. */
export function loadPreferredCurrency(): PaymentCurrency {
  if (typeof window === "undefined") {
    return "GBP";
  }

  try {
    return window.localStorage.getItem(CURRENCY_STORAGE_KEY) === "THB" ? "THB" : "GBP";
  } catch {
    return "GBP";
  }
}

export function savePreferredCurrency(currency: PaymentCurrency): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
  } catch {
    // Ignore quota / private mode.
  }
}

export function todayISODate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatEntryDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) {
    return isoDate;
  }

  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
