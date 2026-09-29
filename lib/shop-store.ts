import { Redis } from "@upstash/redis";
import { fetchListingPreviewImage } from "./listing-preview";
import {
  SEED_SHOP,
  SHOP_KV_KEY,
  applyShopMutation,
  findHomeOption,
  parseShopDocument,
  storedShopNeedsMigration,
  withHomeOptionImage,
  type ShopDocument,
  type ShopListId,
  type ShopStandingSection,
} from "./shop";
import { readRedisEnv } from "./payments-store";

export type ShopStore = {
  read(): Promise<unknown>;
  write(value: ShopDocument, options?: { nx?: boolean }): Promise<boolean>;
};

export type ShopKv = {
  get: (key: string) => Promise<unknown>;
  set: (
    key: string,
    value: unknown,
    opts?: { nx?: boolean },
  ) => Promise<"OK" | null>;
};

export class ShopStoreUnavailableError extends Error {
  constructor(
    message = "Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_URL and KV_REST_API_TOKEN) so the shop list can be shared.",
  ) {
    super(message);
    this.name = "ShopStoreUnavailableError";
  }
}

let testOverride: ShopStore | null = null;
let memorySingleton: ShopStore | null = null;
let redisSingleton: ShopStore | null = null;

export function createShopMemoryStore(initial: unknown = null): ShopStore {
  let value: unknown = initial;
  return {
    async read() {
      return value;
    },
    async write(next, options) {
      if (options?.nx && value != null) {
        return false;
      }
      value = next;
      return true;
    },
  };
}

export function createShopRedisStore(client: ShopKv): ShopStore {
  return {
    async read() {
      return client.get(SHOP_KV_KEY);
    },
    async write(next, options) {
      const result = await client.set(SHOP_KV_KEY, next, options?.nx ? { nx: true } : undefined);
      return result === "OK";
    },
  };
}

export function setShopStoreForTests(store: ShopStore | null): void {
  testOverride = store;
}

export function resetShopStoreForTests(): void {
  testOverride = null;
  memorySingleton = createShopMemoryStore();
  redisSingleton = null;
}

function getMemorySingleton(): ShopStore {
  if (!memorySingleton) {
    memorySingleton = createShopMemoryStore();
  }
  return memorySingleton;
}

function getRedisStoreSingleton(env: { url: string; token: string }): ShopStore {
  if (!redisSingleton) {
    const redis = new Redis({ url: env.url, token: env.token });
    redisSingleton = createShopRedisStore({
      get: (key) => redis.get(key),
      set: async (key, value, opts) => {
        const result = opts?.nx ? await redis.set(key, value, { nx: true }) : await redis.set(key, value);
        return result === "OK" ? "OK" : null;
      },
    });
  }
  return redisSingleton;
}

export function getDefaultShopStore(): ShopStore {
  if (testOverride) {
    return testOverride;
  }

  const redisEnv = readRedisEnv();
  if (redisEnv) {
    return getRedisStoreSingleton(redisEnv);
  }

  if (process.env.NODE_ENV === "production") {
    throw new ShopStoreUnavailableError();
  }

  return getMemorySingleton();
}

export async function listSharedShop(store: ShopStore = getDefaultShopStore()): Promise<ShopDocument> {
  const raw = await store.read();
  const existing = parseShopDocument(raw);
  if (existing) {
    if (storedShopNeedsMigration(raw)) {
      await store.write(existing);
    }
    return existing;
  }

  const wrote = await store.write(SEED_SHOP, { nx: true });
  if (!wrote) {
    const raced = parseShopDocument(await store.read());
    return raced ?? SEED_SHOP;
  }

  return SEED_SHOP;
}

async function writeMutation(
  store: ShopStore,
  mutate: (current: ShopDocument) => ShopDocument | null,
): Promise<ShopDocument | undefined> {
  const current = await listSharedShop(store);
  const next = mutate(current);
  if (!next) {
    return undefined;
  }

  await store.write(next);
  return next;
}

export async function toggleSharedShopItem(
  section: ShopListId,
  id: string,
  store: ShopStore = getDefaultShopStore(),
): Promise<ShopDocument | undefined> {
  return writeMutation(store, (current) =>
    applyShopMutation(current, { op: "toggle", section, id }),
  );
}

export async function addSharedShopItem(
  section: ShopListId,
  draft: { label: string; note?: string },
  store: ShopStore = getDefaultShopStore(),
): Promise<ShopDocument> {
  const next = await writeMutation(store, (current) =>
    applyShopMutation(current, { op: "add", section, label: draft.label, note: draft.note }),
  );
  if (!next) {
    throw new Error("Invalid item");
  }
  return next;
}

export async function needSharedThisWeek(
  section: ShopStandingSection,
  id: string,
  store: ShopStore = getDefaultShopStore(),
): Promise<ShopDocument | undefined> {
  return writeMutation(store, (current) =>
    applyShopMutation(current, { op: "needThisWeek", section, id }),
  );
}

export async function clearSharedShopTicks(
  section: ShopListId,
  store: ShopStore = getDefaultShopStore(),
): Promise<ShopDocument> {
  const next = await writeMutation(store, (current) =>
    applyShopMutation(current, { op: "clear", section }),
  );
  return next ?? (await listSharedShop(store));
}

export async function rememberHomeOptionImage(
  pageUrl: string,
  store: ShopStore = getDefaultShopStore(),
): Promise<string | null | undefined> {
  const current = await listSharedShop(store);
  const match = findHomeOption(current, pageUrl);
  if (!match) {
    return undefined;
  }
  if (match.option.imageUrl) {
    return match.option.imageUrl;
  }

  const imageUrl = await fetchListingPreviewImage(pageUrl);
  if (!imageUrl) {
    return null;
  }

  await writeMutation(store, (latest) =>
    withHomeOptionImage(latest, match.item.id, pageUrl, imageUrl, new Date().toISOString()),
  );
  return imageUrl;
}

const MAX_HOME_IMAGE_BYTES = 5_000_000;

export async function readSharedHomeImage(
  imageUrl: string,
  store: ShopStore = getDefaultShopStore(),
): Promise<{ bytes: Uint8Array; contentType: string } | undefined> {
  const shop = await listSharedShop(store);
  const allowed = shop.homeItems.some((item) =>
    item.detail?.options.some((option) => option.imageUrl === imageUrl),
  );
  if (!allowed) {
    return undefined;
  }

  let response: Response;
  try {
    response = await fetch(imageUrl, {
      redirect: "follow",
      headers: {
        Accept: "image/jpeg,image/png,image/webp,image/*;q=0.5",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      },
    });
  } catch {
    return undefined;
  }

  if (!response.ok) {
    return undefined;
  }

  const contentType = (response.headers.get("content-type") ?? "").split(";")[0]?.trim() ?? "";
  if (!contentType.startsWith("image/")) {
    return undefined;
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_HOME_IMAGE_BYTES) {
    return undefined;
  }

  return { bytes, contentType };
}
