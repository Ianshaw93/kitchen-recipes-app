import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as listShop } from "@/app/api/shop/route";
import { SEED_SHOP } from "@/lib/shop";
import { fetchListingPreviewImage } from "@/lib/listing-preview";
import { createShopMemoryStore, resetShopStoreForTests, setShopStoreForTests } from "@/lib/shop-store";
import { GET } from "./route";

vi.mock("@/lib/listing-preview", () => ({
  fetchListingPreviewImage: vi.fn(),
}));

const SCREWFIX =
  "https://www.screwfix.com/p/blyss-1500w-electric-portable-oil-filled-radiator-white/668cj";

function request(url: string): Request {
  return new Request(url);
}

describe("shop listing preview", () => {
  afterEach(() => {
    resetShopStoreForTests();
    vi.unstubAllEnvs();
    vi.mocked(fetchListingPreviewImage).mockReset();
  });

  it("returns an og image for a heater option and stores it on the shop document", async () => {
    setShopStoreForTests(createShopMemoryStore());
    vi.mocked(fetchListingPreviewImage).mockResolvedValue("https://cdn.example/blyss.jpg");

    const response = await GET(request(`http://localhost/api/shop/preview?url=${encodeURIComponent(SCREWFIX)}`));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ imageUrl: "https://cdn.example/blyss.jpg" });
    expect(fetchListingPreviewImage).toHaveBeenCalledWith(SCREWFIX);

    const listed = await listShop(request("http://localhost/api/shop"));
    const body = (await listed.json()) as { shop: typeof SEED_SHOP };
    expect(body.shop.homeItems[0]?.detail?.options[0]).toMatchObject({
      url: SCREWFIX,
      imageUrl: "https://cdn.example/blyss.jpg",
    });
    expect(body.shop.sections.fewWeeks.map((item) => item.label)).toEqual(
      SEED_SHOP.sections.fewWeeks.map((item) => item.label),
    );

    const cached = await GET(request(`http://localhost/api/shop/preview?url=${encodeURIComponent(SCREWFIX)}`));
    expect(await cached.json()).toEqual({ imageUrl: "https://cdn.example/blyss.jpg" });
    expect(fetchListingPreviewImage).toHaveBeenCalledTimes(1);
  });

  it("returns null when the listing page has no preview and does not invent an image", async () => {
    setShopStoreForTests(createShopMemoryStore());
    vi.mocked(fetchListingPreviewImage).mockResolvedValue(null);

    const response = await GET(request(`http://localhost/api/shop/preview?url=${encodeURIComponent(SCREWFIX)}`));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ imageUrl: null });

    const listed = await listShop(request("http://localhost/api/shop"));
    const body = (await listed.json()) as { shop: typeof SEED_SHOP };
    expect(body.shop.homeItems[0]?.detail?.options[0]?.imageUrl).toBeUndefined();
  });

  it("rejects missing and unknown urls", async () => {
    setShopStoreForTests(createShopMemoryStore());

    const missing = await GET(request("http://localhost/api/shop/preview"));
    expect(missing.status).toBe(400);

    const unknown = await GET(
      request("http://localhost/api/shop/preview?url=https://example.com/not-a-heater"),
    );
    expect(unknown.status).toBe(404);
    expect(fetchListingPreviewImage).not.toHaveBeenCalled();
  });
});
