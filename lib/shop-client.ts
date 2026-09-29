import { getClientPaymentsToken, paymentsRequestHeaders } from "./payments-client";
import { parseShopDocument, type ShopDocument, type ShopMutation } from "./shop";

export class ShopApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly offline = false,
  ) {
    super(message);
    this.name = "ShopApiError";
  }
}

function isOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

function networkError(generic: string): ShopApiError {
  return new ShopApiError(
    isOffline() ? "You're offline. The shared shop list can't update." : generic,
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
    return "Shared shop token was rejected.";
  }

  return fallback;
}

function readShop(data: unknown): ShopDocument | null {
  const raw =
    data && typeof data === "object" && "shop" in data ? (data as { shop: unknown }).shop : null;
  return parseShopDocument(raw);
}

export async function fetchSharedShop(): Promise<ShopDocument> {
  let response: Response;
  try {
    response = await fetch("/api/shop", {
      headers: paymentsRequestHeaders(),
      cache: "no-store",
    });
  } catch {
    throw networkError("Couldn't reach the shared shop list.");
  }

  if (!response.ok) {
    throw new ShopApiError(
      await errorMessage(response, "Couldn't load the shared shop list."),
      response.status,
      false,
    );
  }

  const shop = readShop(await response.json());
  if (!shop) {
    throw new ShopApiError("Shared shop list returned invalid data.");
  }

  return shop;
}

export async function postShopMutation(mutation: ShopMutation): Promise<ShopDocument> {
  let response: Response;
  try {
    response = await fetch("/api/shop", {
      method: "POST",
      headers: paymentsRequestHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(mutation),
      cache: "no-store",
    });
  } catch {
    throw networkError("Couldn't update the shared shop list.");
  }

  if (!response.ok) {
    throw new ShopApiError(
      await errorMessage(response, "Couldn't update the shared shop list."),
      response.status,
    );
  }

  const shop = readShop(await response.json());
  if (!shop) {
    throw new ShopApiError("Shared shop list returned invalid data.");
  }

  return shop;
}

export function homeOptionImageSrc(imageUrl: string): string {
  const params = new URLSearchParams({ url: imageUrl });
  const token = getClientPaymentsToken();
  if (token) {
    params.set("token", token);
  }
  return `/api/shop/image?${params.toString()}`;
}

export async function fetchHomeOptionPreview(pageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(`/api/shop/preview?url=${encodeURIComponent(pageUrl)}`, {
      headers: paymentsRequestHeaders(),
      cache: "no-store",
    });
    if (!response.ok) {
      return null;
    }
    const data: unknown = await response.json();
    if (!data || typeof data !== "object" || !("imageUrl" in data)) {
      return null;
    }
    const imageUrl = (data as { imageUrl: unknown }).imageUrl;
    return typeof imageUrl === "string" && imageUrl.trim() ? imageUrl : null;
  } catch {
    return null;
  }
}
