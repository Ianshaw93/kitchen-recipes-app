export const SHOP_KV_KEY = "kusina:shop:v1";

export const SHOP_SECTIONS = ["fewWeeks", "thisWeek", "asian"] as const;

export type ShopSectionId = (typeof SHOP_SECTIONS)[number];

export type ShopItem = {
  id: string;
  label: string;
  done: boolean;
  note?: string;
};

export type ShopSections = Record<ShopSectionId, ShopItem[]>;

export type ShopDocument = {
  version: 1;
  updatedAt: string;
  sections: ShopSections;
};

export type ShopStandingSection = "fewWeeks" | "asian";

export type ShopMutation =
  | { op: "toggle"; section: ShopSectionId; id: string }
  | { op: "add"; section: ShopSectionId; label: string; note?: string }
  | { op: "clear"; section: ShopSectionId }
  | { op: "needThisWeek"; section: ShopStandingSection; id: string };

export function shopDocument(sections: ShopSections, updatedAt: string): ShopDocument {
  return {
    version: 1,
    updatedAt,
    sections: {
      fewWeeks: sections.fewWeeks.map(normalizeItem),
      thisWeek: sections.thisWeek.map(normalizeItem),
      asian: sections.asian.map(normalizeItem),
    },
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
);

function isSection(value: unknown): value is ShopSectionId {
  return value === "fewWeeks" || value === "thisWeek" || value === "asian";
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

  const doc = value as Partial<ShopDocument>;
  if (doc.version !== 1 || typeof doc.updatedAt !== "string" || doc.updatedAt.length === 0) {
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

  return { version: 1, updatedAt: doc.updatedAt, sections: { fewWeeks, thisWeek, asian } };
}

export function parseShopMutation(value: unknown): ShopMutation | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const body = value as Partial<ShopMutation>;
  if (!isSection(body.section)) {
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

export function applyShopMutation(
  doc: ShopDocument,
  mutation: ShopMutation,
  updatedAt = new Date().toISOString(),
): ShopDocument | null {
  if (mutation.op === "toggle") {
    const exists = doc.sections[mutation.section].some((item) => item.id === mutation.id);
    if (!exists) {
      return null;
    }
    return shopDocument(toggleShopItem(doc.sections, mutation.section, mutation.id), updatedAt);
  }

  if (mutation.op === "add") {
    const label = mutation.label.trim();
    if (!label) {
      return null;
    }
    return shopDocument(
      addShopItem(doc.sections, mutation.section, { label, note: mutation.note }, crypto.randomUUID()),
      updatedAt,
    );
  }

  if (mutation.op === "clear") {
    return shopDocument(clearShopTicks(doc.sections, mutation.section), updatedAt);
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
