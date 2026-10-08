import { paymentsRequestHeaders } from "./payments-client";
import { parseRelationshipDocument, type RelationshipDocument } from "./relationship";

export class RelationshipApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly offline = false,
  ) {
    super(message);
    this.name = "RelationshipApiError";
  }
}

function isOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

function networkError(generic: string): RelationshipApiError {
  return new RelationshipApiError(
    isOffline() ? "You're offline. The shared notes can't update." : generic,
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
    return "Shared household token was rejected.";
  }

  return fallback;
}

function readDocument(data: unknown): RelationshipDocument | null {
  const raw =
    data && typeof data === "object" && "document" in data
      ? (data as { document: unknown }).document
      : data;
  return parseRelationshipDocument(raw);
}

export async function fetchSharedRelationship(): Promise<RelationshipDocument> {
  let response: Response;
  try {
    response = await fetch("/api/relationship", {
      headers: paymentsRequestHeaders(),
      cache: "no-store",
    });
  } catch {
    throw networkError("Couldn't reach the shared notes.");
  }

  if (!response.ok) {
    throw new RelationshipApiError(
      await errorMessage(response, "Couldn't load the shared notes."),
      response.status,
      false,
    );
  }

  const document = readDocument(await response.json());
  if (!document) {
    throw new RelationshipApiError("Shared notes returned invalid data.");
  }

  return document;
}

export async function putSharedRelationship(
  document: RelationshipDocument,
): Promise<RelationshipDocument> {
  let response: Response;
  try {
    response = await fetch("/api/relationship", {
      method: "PUT",
      headers: paymentsRequestHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(document),
      cache: "no-store",
    });
  } catch {
    throw networkError("Couldn't save the shared notes.");
  }

  if (!response.ok) {
    throw new RelationshipApiError(
      await errorMessage(response, "Couldn't save the shared notes."),
      response.status,
    );
  }

  const saved = readDocument(await response.json());
  if (!saved) {
    throw new RelationshipApiError("Shared notes returned invalid data.");
  }

  return saved;
}
