import { afterEach, describe, expect, it, vi } from "vitest";
import { SEED_SHOP, shopDocument } from "@/lib/shop";
import { createShopMemoryStore, resetShopStoreForTests, setShopStoreForTests } from "@/lib/shop-store";
import { GET } from "./route";

const IMAGE_URL = "https://cdn.example/blyss.jpg";

function shopWithImage() {
  const heater = structuredClone(SEED_SHOP.homeItems[0]!);
  heater.detail!.options[0]!.imageUrl = IMAGE_URL;
  return shopDocument(SEED_SHOP.sections, SEED_SHOP.updatedAt, [heater]);
}

function request(url: string): Request {
  return new Request(url);
}

describe("shop option image", () => {
  afterEach(() => {
    resetShopStoreForTests();
    vi.unstubAllGlobals();
  });

  it("serves a stored product image from our origin", async () => {
    setShopStoreForTests(createShopMemoryStore(shopWithImage()));
    const fetchMock = vi.fn(async () => new Response(Uint8Array.from([1, 2, 3, 4]), {
      headers: { "Content-Type": "image/jpeg" },
    }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(
      request(`http://localhost/api/shop/image?url=${encodeURIComponent(IMAGE_URL)}`),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/jpeg");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(Uint8Array.from([1, 2, 3, 4]));
    expect(fetchMock).toHaveBeenCalledWith(IMAGE_URL, expect.objectContaining({ redirect: "follow" }));
  });

  it("does not fetch an image url that is not on the shop list", async () => {
    setShopStoreForTests(createShopMemoryStore(shopWithImage()));
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(
      request("http://localhost/api/shop/image?url=https://cdn.example/not-ours.jpg"),
    );

    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
