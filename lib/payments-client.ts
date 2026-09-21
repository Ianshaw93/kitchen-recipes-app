import {
  parsePaymentEntries,
  type PaymentDraft,
  type PaymentEntry,
} from "./payments";

export class PaymentsApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly offline = false,
  ) {
    super(message);
    this.name = "PaymentsApiError";
  }
}

export function getClientPaymentsToken(): string | undefined {
  const token = process.env.NEXT_PUBLIC_PAYMENTS_TOKEN;
  return token ? token : undefined;
}

export function paymentsRequestHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  const token = getClientPaymentsToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
}

function isOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

function networkError(generic: string): PaymentsApiError {
  return new PaymentsApiError(
    isOffline() ? "You're offline. The shared ledger can't update." : generic,
    undefined,
    isOffline(),
  );
}

async function errorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data: unknown = await response.json();
    if (data && typeof data === "object" && "error" in data) {
      const message = (data as { error: unknown }).error;
      if (typeof message === "string" && message.trim()) {
        return message;
      }
    }
  } catch {
    // Ignore non-JSON error bodies.
  }

  if (response.status === 401) {
    return "Shared payments token was rejected.";
  }

  return fallback;
}

async function readJson(response: Response): Promise<unknown> {
  return response.json();
}

export async function fetchSharedPayments(): Promise<PaymentEntry[]> {
  let response: Response;
  try {
    response = await fetch("/api/payments", {
      headers: paymentsRequestHeaders(),
      cache: "no-store",
    });
  } catch {
    throw networkError("Couldn't reach the shared ledger.");
  }

  if (!response.ok) {
    throw new PaymentsApiError(
      await errorMessage(response, "Couldn't load shared payments."),
      response.status,
      false,
    );
  }

  const data = await readJson(response);
  const rawEntries =
    data && typeof data === "object" && "entries" in data
      ? (data as { entries: unknown }).entries
      : null;
  const entries = parsePaymentEntries(rawEntries);
  if (!entries) {
    throw new PaymentsApiError("Shared ledger returned invalid data.");
  }

  return entries;
}

export async function postSharedPayment(draft: PaymentDraft): Promise<PaymentEntry> {
  let response: Response;
  try {
    response = await fetch("/api/payments", {
      method: "POST",
      headers: paymentsRequestHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(draft),
      cache: "no-store",
    });
  } catch {
    throw networkError("Couldn't save that spend.");
  }

  if (!response.ok) {
    throw new PaymentsApiError(
      await errorMessage(response, "Couldn't save that spend."),
      response.status,
    );
  }

  const data = await readJson(response);
  const rawEntry =
    data && typeof data === "object" && "entry" in data
      ? (data as { entry: unknown }).entry
      : null;
  const entries = parsePaymentEntries(rawEntry ? [rawEntry] : null);
  if (!entries?.[0]) {
    throw new PaymentsApiError("Shared ledger returned invalid data.");
  }

  return entries[0];
}

export async function deleteSharedPaymentRequest(id: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`/api/payments/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: paymentsRequestHeaders(),
      cache: "no-store",
    });
  } catch {
    throw networkError("Couldn't remove that spend.");
  }

  if (!response.ok && response.status !== 404) {
    throw new PaymentsApiError(
      await errorMessage(response, "Couldn't remove that spend."),
      response.status,
    );
  }
}
