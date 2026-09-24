import { parseHomesWeeks, type HomeVoteDraft, type HomeWeek } from "./homes";
import { paymentsRequestHeaders } from "./payments-client";

export class HomesApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly offline = false,
  ) {
    super(message);
    this.name = "HomesApiError";
  }
}

function isOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

function networkError(generic: string): HomesApiError {
  return new HomesApiError(
    isOffline() ? "You're offline. The shared homes list can't update." : generic,
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
    return "Shared homes token was rejected.";
  }

  return fallback;
}

function readWeeks(data: unknown): HomeWeek[] | null {
  const rawWeeks =
    data && typeof data === "object" && "weeks" in data
      ? (data as { weeks: unknown }).weeks
      : null;
  return parseHomesWeeks(rawWeeks);
}

export async function fetchSharedHomes(): Promise<HomeWeek[]> {
  let response: Response;
  try {
    response = await fetch("/api/homes", {
      headers: paymentsRequestHeaders(),
      cache: "no-store",
    });
  } catch {
    throw networkError("Couldn't reach the shared homes list.");
  }

  if (!response.ok) {
    throw new HomesApiError(
      await errorMessage(response, "Couldn't load the shared homes list."),
      response.status,
      false,
    );
  }

  const weeks = readWeeks(await response.json());
  if (!weeks) {
    throw new HomesApiError("Shared homes list returned invalid data.");
  }

  return weeks;
}

export async function postSharedVote(draft: HomeVoteDraft): Promise<HomeWeek[]> {
  let response: Response;
  try {
    response = await fetch("/api/homes/vote", {
      method: "POST",
      headers: paymentsRequestHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(draft),
      cache: "no-store",
    });
  } catch {
    throw networkError("Couldn't save that vote.");
  }

  if (!response.ok) {
    throw new HomesApiError(await errorMessage(response, "Couldn't save that vote."), response.status);
  }

  const weeks = readWeeks(await response.json());
  if (!weeks) {
    throw new HomesApiError("Shared homes list returned invalid data.");
  }

  return weeks;
}
