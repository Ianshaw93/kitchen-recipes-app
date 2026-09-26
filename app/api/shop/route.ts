import { parseShopMutation } from "@/lib/shop";
import { runShopRoute, shopJson } from "@/lib/shop-http";
import {
  addSharedShopItem,
  clearSharedShopTicks,
  listSharedShop,
  toggleSharedShopItem,
} from "@/lib/shop-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  return runShopRoute(request, async () => {
    const shop = await listSharedShop();
    return shopJson({ shop });
  });
}

export async function POST(request: Request): Promise<Response> {
  return runShopRoute(request, async () => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return shopJson({ error: "Invalid shop update" }, 400);
    }

    const mutation = parseShopMutation(body);
    if (!mutation) {
      return shopJson({ error: "Invalid shop update" }, 400);
    }

    if (mutation.op === "toggle") {
      const shop = await toggleSharedShopItem(mutation.section, mutation.id);
      if (!shop) {
        return shopJson({ error: "Item not found" }, 404);
      }
      return shopJson({ shop });
    }

    if (mutation.op === "add") {
      const shop = await addSharedShopItem(mutation.section, {
        label: mutation.label,
        note: mutation.note,
      });
      return shopJson({ shop }, 201);
    }

    const shop = await clearSharedShopTicks(mutation.section);
    return shopJson({ shop });
  });
}
