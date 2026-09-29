import {
  normalizeHomeItem,
  parseHomeItems,
  seededHeater,
  type HomeItem,
  type HomeItemOption,
} from "./shop-home";

export const SHOP_KV_KEY = "kusina:shop:v1";

export const SHOP_SECTIONS = ["fewWeeks", "thisWeek", "asian"] as const;

export type ShopSectionId = (typeof SHOP_SECTIONS)[number];

export type ShopListId = ShopSectionId | "home";

export type ShopItem = {
  id: string;
  label: string;
  done: boolean;
  note?: string;
};

export type ShopSections = Record<ShopSectionId, ShopItem[]>;

export type { HomeItem, HomeItemDetail, HomeItemOption } from "./shop-home";

export type ShopDocument = {
  version: 2;
  updatedAt: string;
  sections: ShopSections;
  homeItems: HomeItem[];
};

export type ShopStandingSection = "fewWeeks" | "asian";

export type ShopMutation =
  | { op: "toggle"; section: ShopListId; id: string }
  | { op: "add"; section: ShopListId; label: string; note?: string }
  | { op: "clear"; section: ShopListId }
  | { op: "needThisWeek"; section: ShopStandingSection; id: string };

export function shopDocument(
  sections: ShopSections,
  updatedAt: string,
  homeItems: HomeItem[] = [],
): ShopDocument {
  return {
    version: 2,
    updatedAt,
    sections: {
      fewWeeks: sections.fewWeeks.map(normalizeItem),
      thisWeek: sections.thisWeek.map(normalizeItem),
      asian: sections.asian.map(normalizeItem),
    },
    homeItems: homeItems.map(normalizeHomeItem),
  };
}

export const SEED_SHOP: ShopDocument = shopDocument(
  {
    fewWeeks: [
      { id: "seed-soap-refill", label: "Soap refill", done: false },
      { id: "seed-black-bin-bags", label: "Black bin bags", done: false },
      { id: "seed-olive-oil", label: "Olive oil", done: false },
      { id: "seed-coconut-oil", label: "Coconut oil", done: false },
    ],
    thisWeek: [],
    asian: [
      { id: "seed-fish-sauce", label: "Fish sauce (patis)", done: false },
      {
        id: "seed-tamarind",
        label: "Tamarind paste (or sugar-free sinigang mix)",
        done: false,
        note: "Ran out",
      },
      { id: "seed-calamansi", label: "Calamansi if available", done: false },
    ],
  },
  "2026-09-26T12:00:00.000Z",
  [seededHeater()],
);

function isShopList(value: unknown): value is ShopListId {
  return value === "fewWeeks" || value === "thisWeek" || value === "asian" || value === "home";
}

export function storedShopNeedsMigration(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as { version?: unknown };
  if (record.version === 1) {
    return true;
  }
  return record.version === 2 && !("homeItems" in record);
}

function normalizeItem(item: ShopItem): ShopItem {
  const next: ShopItem = {
    id: item.id,
    label: item.label.trim(),
    done: item.done,
  };
  const note = item.note?.trim();
  if (note) {
    next.note = note;
  }
  return next;
}

function isShopItem(value: unknown): value is ShopItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Partial<ShopItem>;
  if (typeof item.id !== "string" || item.id.length === 0) {
    return false;
  }
  if (typeof item.label !== "string" || item.label.trim().length === 0) {
    return false;
  }
  if (typeof item.done !== "boolean") {
    return false;
  }
  if (item.note !== undefined && typeof item.note !== "string") {
    return false;
  }

  return true;
}

function parseSection(value: unknown): ShopItem[] | null {
  if (!Array.isArray(value) || !value.every(isShopItem)) {
    return null;
  }

  return value.map(normalizeItem);
}

export function parseShopDocument(value: unknown): ShopDocument | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const doc = value as {
    version?: unknown;
    updatedAt?: unknown;
    sections?: Partial<ShopSections>;
    homeItems?: unknown;
  };
  if ((doc.version !== 1 && doc.version !== 2) || typeof doc.updatedAt !== "string" || doc.updatedAt.length === 0) {
    return null;
  }
  if (!doc.sections || typeof doc.sections !== "object") {
    return null;
  }

  const fewWeeks = parseSection(doc.sections.fewWeeks);
  const thisWeek = parseSection(doc.sections.thisWeek);
  const asian = parseSection(doc.sections.asian);
  if (!fewWeeks || !thisWeek || !asian) {
    return null;
  }

  const legacy = storedShopNeedsMigration(value);
  const homeItems = legacy ? [seededHeater()] : parseHomeItems(doc.homeItems);
  if (!homeItems) {
    return null;
  }

  return {
    version: 2,
    updatedAt: doc.updatedAt,
    sections: { fewWeeks, thisWeek, asian },
    homeItems,
  };
}

export function parseShopMutation(value: unknown): ShopMutation | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const body = value as Partial<ShopMutation>;
  if (!isShopList(body.section)) {
    return null;
  }

  if (body.op === "toggle") {
    if (typeof body.id !== "string" || body.id.length === 0) {
      return null;
    }
    return { op: "toggle", section: body.section, id: body.id };
  }

  if (body.op === "add") {
    if (typeof body.label !== "string" || body.label.trim().length === 0) {
      return null;
    }
    const mutation: ShopMutation = {
      op: "add",
      section: body.section,
      label: body.label.trim(),
    };
    if (typeof body.note === "string" && body.note.trim()) {
      mutation.note = body.note.trim();
    }
    return mutation;
  }

  if (body.op === "clear") {
    return { op: "clear", section: body.section };
  }

  if (body.op === "needThisWeek") {
    if (body.section !== "fewWeeks" && body.section !== "asian") {
      return null;
    }
    if (typeof body.id !== "string" || body.id.length === 0) {
      return null;
    }
    return { op: "needThisWeek", section: body.section, id: body.id };
  }

  return null;
}

export function sameShopLabel(left: string, right: string): boolean {
  return left.trim().toLocaleLowerCase() === right.trim().toLocaleLowerCase();
}

export function isLabelOnThisWeek(sections: ShopSections, label: string): boolean {
  return sections.thisWeek.some((item) => sameShopLabel(item.label, label));
}

export function toggleShopItem(
  sections: ShopSections,
  section: ShopSectionId,
  id: string,
): ShopSections {
  return {
    ...sections,
    [section]: sections[section].map((item) =>
      item.id === id ? { ...item, done: !item.done } : item,
    ),
  };
}

export function addShopItem(
  sections: ShopSections,
  section: ShopSectionId,
  draft: { label: string; note?: string },
  id: string,
): ShopSections {
  const label = draft.label.trim();
  if (!label) {
    return sections;
  }

  const item: ShopItem = { id, label, done: false };
  const note = draft.note?.trim();
  if (note) {
    item.note = note;
  }

  return {
    ...sections,
    [section]: [...sections[section], item],
  };
}

export function clearShopTicks(sections: ShopSections, section: ShopSectionId): ShopSections {
  return {
    ...sections,
    [section]: sections[section].map((item) => (item.done ? { ...item, done: false } : item)),
  };
}

export function findHomeOption(
  doc: ShopDocument,
  pageUrl: string,
): { item: HomeItem; option: HomeItemOption } | null {
  for (const item of doc.homeItems) {
    const option = item.detail?.options.find((entry) => entry.url === pageUrl);
    if (option) {
      return { item, option };
    }
  }
  return null;
}

export function withHomeOptionImage(
  doc: ShopDocument,
  itemId: string,
  pageUrl: string,
  imageUrl: string,
  updatedAt = doc.updatedAt,
): ShopDocument | null {
  let found = false;
  let changed = false;
  const homeItems = doc.homeItems.map((item) => {
    if (item.id !== itemId || !item.detail) {
      return item;
    }
    const options = item.detail.options.map((option) => {
      if (option.url !== pageUrl) {
        return option;
      }
      found = true;
      if (option.imageUrl === imageUrl) {
        return option;
      }
      changed = true;
      return { ...option, imageUrl };
    });
    return { ...item, detail: { ...item.detail, options } };
  });
  if (!found) {
    return null;
  }
  if (!changed) {
    return doc;
  }
  return shopDocument(doc.sections, updatedAt, homeItems);
}

function applyHomeMutation(
  doc: ShopDocument,
  mutation: ShopMutation,
  updatedAt: string,
): ShopDocument | null {
  if (mutation.op === "toggle") {
    const exists = doc.homeItems.some((item) => item.id === mutation.id);
    if (!exists) {
      return null;
    }
    return shopDocument(
      doc.sections,
      updatedAt,
      doc.homeItems.map((item) => (item.id === mutation.id ? { ...item, done: !item.done } : item)),
    );
  }

  if (mutation.op === "add") {
    const label = mutation.label.trim();
    if (!label) {
      return null;
    }
    const item: HomeItem = { id: crypto.randomUUID(), label, done: false };
    const note = mutation.note?.trim();
    if (note) {
      item.note = note;
    }
    return shopDocument(doc.sections, updatedAt, [...doc.homeItems, item]);
  }

  if (mutation.op === "clear") {
    return shopDocument(
      doc.sections,
      updatedAt,
      doc.homeItems.map((item) => (item.done ? { ...item, done: false } : item)),
    );
  }

  return null;
}

export function applyShopMutation(
  doc: ShopDocument,
  mutation: ShopMutation,
  updatedAt = new Date().toISOString(),
): ShopDocument | null {
  if (mutation.section === "home") {
    return applyHomeMutation(doc, mutation, updatedAt);
  }

  if (mutation.op === "toggle") {
    const exists = doc.sections[mutation.section].some((item) => item.id === mutation.id);
    if (!exists) {
      return null;
    }
    return shopDocument(
      toggleShopItem(doc.sections, mutation.section, mutation.id),
      updatedAt,
      doc.homeItems,
    );
  }

  if (mutation.op === "add") {
    const label = mutation.label.trim();
    if (!label) {
      return null;
    }
    return shopDocument(
      addShopItem(doc.sections, mutation.section, { label, note: mutation.note }, crypto.randomUUID()),
      updatedAt,
      doc.homeItems,
    );
  }

  if (mutation.op === "clear") {
    return shopDocument(clearShopTicks(doc.sections, mutation.section), updatedAt, doc.homeItems);
  }

  if (mutation.op === "needThisWeek") {
    const source = doc.sections[mutation.section].find((item) => item.id === mutation.id);
    if (!source) {
      return null;
    }
    if (isLabelOnThisWeek(doc.sections, source.label)) {
      return doc;
    }
    return shopDocument(
      addShopItem(
        doc.sections,
        "thisWeek",
        { label: source.label, note: source.note },
        crypto.randomUUID(),
      ),
      updatedAt,
      doc.homeItems,
    );
  }

  return null;
}

export function loadShop(): ShopDocument | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(SHOP_KV_KEY);
    if (!raw) {
      return null;
    }
    return parseShopDocument(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function saveShop(doc: ShopDocument): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(SHOP_KV_KEY, JSON.stringify(doc));
  } catch {
    // Ignore quota / private mode.
  }
}
