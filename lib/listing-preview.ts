const PREVIEW_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

const FETCH_TIMEOUT_MS = 5000;

const META_KEYS = ["og:image", "og:image:secure_url", "twitter:image", "twitter:image:src"] as const;

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function toHttpUrl(value: string, baseUrl?: string): string | null {
  try {
    const url = baseUrl ? new URL(value, baseUrl) : new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

function readMeta(html: string, key: string): string | null {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  const keyPattern = new RegExp(`(?:property|name)\\s*=\\s*['"]${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}['"]`, "i");

  for (const tag of tags) {
    if (!keyPattern.test(tag)) {
      continue;
    }
    const content = tag.match(/\bcontent\s*=\s*['"]([^'"]*)['"]/i);
    const value = content ? decodeHtml(content[1] ?? "").trim() : "";
    if (value) {
      return value;
    }
  }

  return null;
}

function isPropertyPhoto(src: string): boolean {
  const lower = src.toLowerCase();
  if (
    lower.startsWith("data:") ||
    lower.includes("logo") ||
    lower.includes("favicon") ||
    lower.includes("icon") ||
    lower.includes("facebook.com") ||
    lower.includes("googletagmanager") ||
    lower.includes("google-analytics")
  ) {
    return false;
  }

  return (
    lower.includes("jupix") ||
    lower.includes("property-photo") ||
    lower.includes("/properties/") ||
    /_large\.(jpe?g|png|webp)(\?|$)/i.test(lower)
  );
}

function firstPropertyPhoto(html: string): string | null {
  const tags = html.match(/<img\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const src = tag.match(/\bsrc\s*=\s*['"]([^'"]+)['"]/i);
    const value = src ? decodeHtml(src[1] ?? "").trim() : "";
    if (value && isPropertyPhoto(value)) {
      return value;
    }
  }
  return null;
}

export function extractListingPreviewImage(html: string, pageUrl?: string): string | null {
  for (const key of META_KEYS) {
    const content = readMeta(html, key);
    if (!content) {
      continue;
    }
    const absolute = toHttpUrl(content, pageUrl);
    if (absolute) {
      return absolute;
    }
  }

  const photo = firstPropertyPhoto(html);
  return photo ? toHttpUrl(photo, pageUrl) : null;
}

export async function fetchListingPreviewImage(pageUrl: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(pageUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": PREVIEW_USER_AGENT,
      },
    });
    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    return extractListingPreviewImage(html, pageUrl);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
