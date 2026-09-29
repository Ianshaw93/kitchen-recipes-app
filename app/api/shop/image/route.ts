import { readSharedHomeImage } from "@/lib/shop-store";
import { runShopRoute, shopJson } from "@/lib/shop-http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  return runShopRoute(request, async () => {
    const imageUrl = new URL(request.url).searchParams.get("url")?.trim() ?? "";
    if (!imageUrl) {
      return shopJson({ error: "Missing url" }, 400);
    }

    const image = await readSharedHomeImage(imageUrl);
    if (!image) {
      return shopJson({ error: "Image unavailable" }, 404);
    }

    const body = new ArrayBuffer(image.bytes.byteLength);
    new Uint8Array(body).set(image.bytes);
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": image.contentType,
        "Cache-Control": "private, max-age=86400",
      },
    });
  });
}
