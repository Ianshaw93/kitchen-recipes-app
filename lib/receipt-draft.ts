import { parseAmountToPence, type Payer } from "./payments";

export type ExtractedSpend = {
  amountPounds?: number | string | null;
  description?: string | null;
  date?: string | null;
  paidBy?: string | null;
  note?: string | null;
};

export type SpendDraftFields = {
  amount: string;
  description: string;
  date: string;
  paidBy: Payer | "";
  note: string;
};

export type ExtractResult =
  | { ok: true; draft: SpendDraftFields }
  | { ok: false; error: string };

export function formatAmountInput(pence: number): string {
  return (pence / 100).toFixed(2);
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parsePayer(value: string | null | undefined): Payer | "" {
  if (!value) {
    return "";
  }

  const normalised = value.trim().toLowerCase();
  if (normalised === "ian") {
    return "Ian";
  }
  if (normalised === "avery") {
    return "Avery";
  }

  return "";
}

export function spendDraftFromOutput(output: ExtractedSpend): SpendDraftFields {
  const amountSource =
    output.amountPounds === null || output.amountPounds === undefined
      ? ""
      : String(output.amountPounds);
  const amountPence = parseAmountToPence(amountSource);
  const date = output.date?.trim() ?? "";

  return {
    amount: amountPence ? formatAmountInput(amountPence) : "",
    description: output.description?.trim() ?? "",
    date: isIsoDate(date) ? date : "",
    paidBy: parsePayer(output.paidBy),
    note: output.note?.trim() ?? "",
  };
}

export function isEmptyDraft(draft: SpendDraftFields): boolean {
  return !draft.amount && !draft.description;
}
