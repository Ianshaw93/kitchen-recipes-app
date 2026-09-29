export type HomeItemOption = {
  title: string;
  url: string;
  retailer: string;
  priceNote?: string;
  bullets: string[];
  imageUrl?: string;
};

export type HomeItemDetail = {
  intro: string;
  options: HomeItemOption[];
  buyTitle: string;
  buyIntro: string;
  buyBullets: string[];
  runningCost: string;
};

export type HomeItem = {
  id: string;
  label: string;
  done: boolean;
  note?: string;
  detail?: HomeItemDetail;
};

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export const HEATER_HOME_ITEM: HomeItem = {
  id: "seed-heater",
  label: "Heater",
  done: false,
  detail: {
    intro:
      "Here are some real UK examples currently listed. Prices and stock can change, so check the listing before buying.",
    buyTitle: "What I'd buy",
    buyIntro: "For a rented, drafty living/dining room:",
    buyBullets: [
      "Small/medium room: the Blyss 1500W",
      "Large open-plan or very cold room: a reputable 2000W oil-filled model",
      "Avoid paying extra for “energy efficient” oil or ceramic claims — direct electric heaters use broadly similar electricity for the same heat output",
      "Use thermostat to maintain roughly 18–20°C with a separate room thermometer",
      "Don't put beside baby's cot/basket; don't leave running while you sleep",
      "Electrical Safety First: portable heaters not for overnight — use timer to warm room before you need it",
    ],
    runningCost:
      "At full power a 2,000W heater uses 2 kWh per hour ≈ 2 × electricity unit rate/hour (e.g. 30p/kWh → ~60p/hour at full power). Thermostat cycling lowers actual use depending on draughts/insulation.",
    options: [
      {
        title: "Best value/features: Blyss 1500W oil-filled radiator",
        url: "https://www.screwfix.com/p/blyss-1500w-electric-portable-oil-filled-radiator-white/668cj",
        retailer: "Screwfix",
        priceNote: "Around £39.99 when checked",
        bullets: [
          "1,500 W",
          "3 heat settings",
          "Electronic thermostat",
          "24-hour timer",
          "Tip-over switch",
          "Overheat protection",
          "Child-lock function",
          "Wheels and remote control",
          "One-year guarantee",
          "Good first look for a reasonably small room / existing gas radiator does most of the heating. Child lock does not stop a child touching hot fins.",
        ],
      },
      {
        title: "More powerful option: STATUS 2000W 9-fin oil-filled radiator",
        url: "https://www.amazon.co.uk/Status-Radiator-Adjustable-Thermostat-OFH9-2000WT1PKB/dp/B0F55646WB",
        retailer: "Amazon",
        priceNote: "Around £54.10 when checked",
        bullets: [
          "2,000 W",
          "3 heat settings: 800/1,200/2,000 W",
          "Adjustable thermostat",
          "24-hour timer",
          "Tip-over and overheat protection",
          "Castors",
          "Suitable for a larger or particularly cold living room",
          "Caution: listing showed only 2.9/5 from five reviews — read latest reviews and check returns before buying.",
        ],
      },
      {
        title: "Branded option: Russell Hobbs 2000W digital oil-filled radiator",
        url: "https://www.amazon.co.uk/Russell-Hobbs-Protection-Guarantee-RHOFR2009-D/dp/B0DKJKHQSG",
        retailer: "Amazon",
        bullets: [
          "2,000 W",
          "800/1,200/2,000 W settings",
          "Adjustable thermostat",
          "24-hour timer",
          "Tip-over, overheat and anti-frost protection",
          "Intended for rooms up to approximately 20 m²",
          "Two-year guarantee after registration (per listing)",
          "Was unavailable when checked; worth watching if it returns.",
        ],
      },
      {
        title: "Higher-priced retailer option: John Lewis 2500W digital oil radiator",
        url: "https://www.johnlewis.com/john-lewis-2500w-digital-oil-radiator-white/p110649880",
        retailer: "John Lewis",
        priceNote: "Around £100",
        bullets: [
          "2,500 W",
          "Digital controls",
          "Two-year guarantee",
          "John Lewis returns and customer service",
          "More power than needed unless living/dining is large and gas radiator is inadequate. Higher wattage ≠ safer/more efficient; heats faster and can cost more when running.",
        ],
      },
    ],
  },
};

export function seededHeater(): HomeItem {
  return structuredClone(HEATER_HOME_ITEM);
}

export function normalizeHomeItem(item: HomeItem): HomeItem {
  const next: HomeItem = {
    id: item.id,
    label: item.label.trim(),
    done: item.done,
  };
  const note = item.note?.trim();
  if (note) {
    next.note = note;
  }
  if (item.detail) {
    next.detail = normalizeDetail(item.detail);
  }
  return next;
}

function normalizeDetail(detail: HomeItemDetail): HomeItemDetail {
  const next: HomeItemDetail = {
    intro: detail.intro.trim(),
    options: detail.options.map(normalizeOption),
    buyTitle: detail.buyTitle.trim(),
    buyIntro: detail.buyIntro.trim(),
    buyBullets: detail.buyBullets.map((bullet) => bullet.trim()).filter(Boolean),
    runningCost: detail.runningCost.trim(),
  };
  return next;
}

function normalizeOption(option: HomeItemOption): HomeItemOption {
  const next: HomeItemOption = {
    title: option.title.trim(),
    url: option.url.trim(),
    retailer: option.retailer.trim(),
    bullets: option.bullets.map((bullet) => bullet.trim()).filter(Boolean),
  };
  const priceNote = option.priceNote?.trim();
  if (priceNote) {
    next.priceNote = priceNote;
  }
  const imageUrl = option.imageUrl?.trim();
  if (imageUrl && isHttpUrl(imageUrl)) {
    next.imageUrl = imageUrl;
  }
  return next;
}

function parseOption(value: unknown): HomeItemOption | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const option = value as Partial<HomeItemOption>;
  if (typeof option.title !== "string" || option.title.trim().length === 0) {
    return null;
  }
  if (typeof option.url !== "string" || !isHttpUrl(option.url)) {
    return null;
  }
  if (typeof option.retailer !== "string" || option.retailer.trim().length === 0) {
    return null;
  }
  if (!Array.isArray(option.bullets) || option.bullets.some((bullet) => typeof bullet !== "string")) {
    return null;
  }

  return normalizeOption({
    title: option.title,
    url: option.url,
    retailer: option.retailer,
    priceNote: typeof option.priceNote === "string" ? option.priceNote : undefined,
    bullets: option.bullets,
    imageUrl: typeof option.imageUrl === "string" ? option.imageUrl : undefined,
  });
}

function parseDetail(value: unknown): HomeItemDetail | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const detail = value as Partial<HomeItemDetail>;
  if (typeof detail.intro !== "string" || detail.intro.trim().length === 0) {
    return undefined;
  }
  if (typeof detail.buyTitle !== "string" || detail.buyTitle.trim().length === 0) {
    return undefined;
  }
  if (typeof detail.buyIntro !== "string") {
    return undefined;
  }
  if (typeof detail.runningCost !== "string") {
    return undefined;
  }
  if (!Array.isArray(detail.buyBullets) || detail.buyBullets.some((bullet) => typeof bullet !== "string")) {
    return undefined;
  }
  if (!Array.isArray(detail.options)) {
    return undefined;
  }
  const options = detail.options.map(parseOption).filter((option): option is HomeItemOption => option !== null);
  if (options.length !== detail.options.length) {
    return undefined;
  }
  return normalizeDetail({
    intro: detail.intro,
    options,
    buyTitle: detail.buyTitle,
    buyIntro: detail.buyIntro,
    buyBullets: detail.buyBullets,
    runningCost: detail.runningCost,
  });
}

function parseHomeItem(value: unknown): HomeItem | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const item = value as Partial<HomeItem>;
  if (typeof item.id !== "string" || item.id.length === 0) {
    return null;
  }
  if (typeof item.label !== "string" || item.label.trim().length === 0) {
    return null;
  }
  if (typeof item.done !== "boolean") {
    return null;
  }
  if (item.note !== undefined && typeof item.note !== "string") {
    return null;
  }

  const next = normalizeHomeItem({
    id: item.id,
    label: item.label,
    done: item.done,
    note: item.note,
  });
  if (item.detail !== undefined) {
    const detail = parseDetail(item.detail);
    if (!detail) {
      return next;
    }
    next.detail = detail;
  }
  return next;
}

export function parseHomeItems(value: unknown): HomeItem[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const items: HomeItem[] = [];
  for (const entry of value) {
    const item = parseHomeItem(entry);
    if (!item) {
      return null;
    }
    items.push(item);
  }
  return items;
}
