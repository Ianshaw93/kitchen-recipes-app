import { rememberHomeOptionImage } from "@/lib/shop-store";
import { runShopRoute, shopJson } from "@/lib/shop-http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  return runShopRoute(request, async () => {
    const pageUrl = new URL(request.url).searchParams.get("url")?.trim() ?? "";
    if (!pageUrl) {
      return shopJson({ error: "Missing url" }, 400);
    }

    const imageUrl = await rememberHomeOptionImage(pageUrl);
    if (imageUrl === undefined) {
      return shopJson({ error: "Unknown listing" }, 404);
    }

    return shopJson({ imageUrl });
  });
}
