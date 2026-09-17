export const PAYMENTS_STORAGE_KEY = "kusina:payments:v1";

export type Payer = "Ian" | "Avery";

export type PaymentEntry = {
  id: string;
  date: string;
  description: string;
  amountPence: number;
  paidBy: Payer;
  note?: string;
  createdAt: string;
};

export type PaymentDraft = {
  date: string;
  description: string;
  amountPence: number;
  paidBy: Payer;
  note?: string;
};

export type PaymentImportParams = {
  paidBy?: string | null;
  amount?: string | null;
  description?: string | null;
  date?: string | null;
  note?: string | null;
};

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type PaymentBalance =
  | { status: "settled" }
  | { status: "owed"; to: Payer; amountPence: number };

function isPayer(value: unknown): value is Payer {
  return value === "Ian" || value === "Avery";
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

  return true;
}

function isValidEntries(value: unknown): value is PaymentEntry[] {
  return Array.isArray(value) && value.every(isValidEntry);
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
  const trimmed = input.trim().replace(/^£\s?/, "").replace(/,/g, "");
  if (!trimmed) {
    return null;
  }

  const pounds = Number(trimmed);
  if (!Number.isFinite(pounds) || pounds <= 0) {
    return null;
  }

  return Math.round(pounds * 100);
}

export function formatPounds(pence: number): string {
  const abs = Math.abs(Math.round(pence));
  const pounds = Math.floor(abs / 100);
  const remainder = abs % 100;
  const sign = pence < 0 ? "-" : "";
  return `${sign}£${pounds}.${String(remainder).padStart(2, "0")}`;
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
  draft: Pick<PaymentDraft, "paidBy" | "amountPence" | "description" | "date">,
): boolean {
  const description = draft.description.trim();
  return entries.some(
    (entry) =>
      entry.paidBy === draft.paidBy &&
      entry.amountPence === draft.amountPence &&
      entry.description === description &&
      entry.date === draft.date,
  );
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
  const entry: PaymentEntry = {
    id: crypto.randomUUID(),
    date: draft.date,
    description: draft.description.trim(),
    amountPence: draft.amountPence,
    paidBy: draft.paidBy,
    createdAt: new Date().toISOString(),
  };

  const note = draft.note?.trim();
  if (note) {
    entry.note = note;
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
