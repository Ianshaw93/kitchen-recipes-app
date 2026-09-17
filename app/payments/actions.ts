"use server";

import { extractSpendFromImage } from "@/lib/extract-spend";
import type { ExtractResult } from "@/lib/receipt-draft";

const MAX_BYTES = 4 * 1024 * 1024;

export async function extractSpendFromScreenshot(formData: FormData): Promise<ExtractResult> {
  const file = formData.get("screenshot");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Pick a screenshot first." };
  }
  if (file.size > MAX_BYTES) {
    return {
      ok: false,
      error: "That photo is too large. Try a screenshot instead of a huge camera photo.",
    };
  }

  const mediaType = file.type || "image/jpeg";
  if (!mediaType.startsWith("image/")) {
    return { ok: false, error: "That file is not an image." };
  }

  const image = new Uint8Array(await file.arrayBuffer());
  return extractSpendFromImage({ image, mediaType });
}
