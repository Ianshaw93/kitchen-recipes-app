import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SEED_SHOP, applyShopMutation, type ShopDocument } from "@/lib/shop";
import ShopPage from "./page";

function stubShopApi(initial: ShopDocument = SEED_SHOP, previews: Record<string, string | null> = {}) {
  let shop = structuredClone(initial);
  const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
    const method = (init?.method ?? "GET").toUpperCase();
    const url = String(_input);
    if (method === "GET" && url.startsWith("/api/shop/preview")) {
      const pageUrl = new URL(url, "http://localhost").searchParams.get("url");
      return Response.json({ imageUrl: pageUrl ? (previews[pageUrl] ?? null) : null });
    }
    if (method === "POST") {
      const body: unknown = JSON.parse(String(init?.body ?? "{}"));
      const next = applyShopMutation(shop, body as never);
      if (next) {
        shop = next;
      }
      const status =
        body && typeof body === "object" && "op" in body && (body as { op: string }).op === "add"
          ? 201
          : 200;
      return Response.json({ shop }, { status });
    }
    return Response.json({ shop });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("shop page", () => {
  it("renders the three household sections and seeded items", async () => {
    stubShopApi();
    render(<ShopPage />);

    expect(screen.getByRole("heading", { name: /every few weeks/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /this week specials/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /asian store/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^shop$/i })).toHaveAttribute("href", "/shop");

    expect(await screen.findByRole("button", { name: /^soap refill$/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: /^black bin bags$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^olive oil$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^coconut oil$/i })).toBeInTheDocument();
    expect(screen.getByText(/nothing extra this week/i)).toBeInTheDocument();
    const asian = screen.getByRole("region", { name: /asian store/i });
    expect(within(asian).getByRole("button", { name: /^fish sauce \(patis\)/i })).toBeInTheDocument();
    expect(within(asian).getByRole("button", { name: /^tamarind paste/i })).toBeInTheDocument();
    expect(within(asian).getByText(/ran out/i)).toBeInTheDocument();
    expect(within(asian).getByRole("button", { name: /^calamansi if available/i })).toBeInTheDocument();
    expect(within(asian).getByRole("button", { name: /need calamansi if available this week/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add to every few weeks/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add to this week specials/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add to asian store/i })).toBeInTheDocument();

    const home = screen.getByRole("region", { name: /home items/i });
    expect(within(home).getByRole("button", { name: /tick heater/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(within(home).getByRole("button", { name: /open heater/i })).toBeInTheDocument();
    expect(within(home).queryByRole("button", { name: /need heater this week/i })).not.toBeInTheDocument();
  });

  it("opens the heater shortlist from the row title and keeps the tick on the checkbox", async () => {
    const user = userEvent.setup();
    const fetchMock = stubShopApi();
    render(<ShopPage />);

    const home = await screen.findByRole("region", { name: /home items/i });
    await user.click(within(home).getByRole("button", { name: /open heater/i }));

    expect(screen.getByRole("heading", { name: /^heater$/i })).toBeInTheDocument();
    expect(screen.getByText(/prices and stock can change/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /my shortlist/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /what i.d buy/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /running cost note/i })).toBeInTheDocument();
    expect(screen.getByText(/£39\.99/)).toBeInTheDocument();
    expect(screen.getByText(/£54\.10/)).toBeInTheDocument();
    expect(screen.getByText(/2\.9\/5/)).toBeInTheDocument();
    expect(screen.getByText(/£100/)).toBeInTheDocument();
    expect(screen.getByText(/60p\/hour/i)).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /view on screwfix/i })).toHaveAttribute(
      "href",
      "https://www.screwfix.com/p/blyss-1500w-electric-portable-oil-filled-radiator-white/668cj",
    );
    expect(screen.getAllByRole("link", { name: /view on amazon/i }).map((link) => link.getAttribute("href"))).toEqual([
      "https://www.amazon.co.uk/Status-Radiator-Adjustable-Thermostat-OFH9-2000WT1PKB/dp/B0F55646WB",
      "https://www.amazon.co.uk/Russell-Hobbs-Protection-Guarantee-RHOFR2009-D/dp/B0DKJKHQSG",
    ]);
    expect(screen.getByRole("link", { name: /view on john lewis/i })).toHaveAttribute(
      "href",
      "https://www.johnlewis.com/john-lewis-2500w-digital-oil-radiator-white/p110649880",
    );
    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/shop",
      expect.objectContaining({ method: "POST" }),
    );

    await user.click(screen.getByRole("button", { name: /back to shop/i }));
    const listed = screen.getByRole("region", { name: /home items/i });
    expect(within(listed).getByRole("button", { name: /tick heater/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    await user.click(within(listed).getByRole("button", { name: /tick heater/i }));
    expect(screen.queryByRole("heading", { name: /my shortlist/i })).not.toBeInTheDocument();
    expect(within(listed).getByRole("button", { name: /tick heater/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/shop",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ op: "toggle", section: "home", id: "seed-heater" }),
      }),
    );
  });

  it("shows a product image when a listing preview is available", async () => {
    const user = userEvent.setup();
    const screwfix =
      "https://www.screwfix.com/p/blyss-1500w-electric-portable-oil-filled-radiator-white/668cj";
    stubShopApi(SEED_SHOP, { [screwfix]: "https://cdn.example/blyss.jpg" });
    render(<ShopPage />);

    const home = await screen.findByRole("region", { name: /home items/i });
    await user.click(within(home).getByRole("button", { name: /open heater/i }));

    const photo = await screen.findByRole("img", { name: /blyss 1500w/i });
    expect(photo.getAttribute("src")).toContain("/api/shop/image?");
    expect(decodeURIComponent(photo.getAttribute("src") ?? "")).toContain(
      "https://cdn.example/blyss.jpg",
    );
    expect(screen.getAllByRole("img")).toHaveLength(1);
  });

  it("adds another home item that ticks from the row", async () => {
    const user = userEvent.setup();
    const fetchMock = stubShopApi();
    render(<ShopPage />);

    const input = await screen.findByRole("textbox", { name: /add to home items/i });
    await user.type(input, "Dining table");
    await user.click(screen.getByRole("button", { name: /add to home items/i }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/shop",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ op: "add", section: "home", label: "Dining table" }),
      }),
    );
    const home = screen.getByRole("region", { name: /home items/i });
    const added = await within(home).findByRole("button", { name: /^dining table$/i });
    expect(added).toHaveAttribute("aria-pressed", "false");
    await user.click(added);
    expect(within(home).getByRole("button", { name: /^dining table$/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("toggles a shared tick and can clear it", async () => {
    const user = userEvent.setup();
    const fetchMock = stubShopApi();
    render(<ShopPage />);

    const soap = await screen.findByRole("button", { name: /^soap refill$/i });
    await user.click(soap);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/shop",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ op: "toggle", section: "fewWeeks", id: "seed-soap-refill" }),
      }),
    );
    expect(screen.getByRole("button", { name: /^soap refill$/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(screen.getByRole("button", { name: /clear every few weeks/i }));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/shop",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ op: "clear", section: "fewWeeks" }),
      }),
    );
    expect(await screen.findByRole("button", { name: /^soap refill$/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("adds a one-off to this week specials", async () => {
    const user = userEvent.setup();
    const fetchMock = stubShopApi();
    render(<ShopPage />);

    const input = await screen.findByRole("textbox", { name: /add to this week specials/i });
    await user.type(input, "Birthday candles");
    await user.click(screen.getByRole("button", { name: /add to this week specials/i }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/shop",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ op: "add", section: "thisWeek", label: "Birthday candles" }),
      }),
    );
    expect(await screen.findByRole("button", { name: /^birthday candles$/i })).toBeInTheDocument();
  });

  it("copies a standing item into this week and leaves the source in place", async () => {
    const user = userEvent.setup();
    const fetchMock = stubShopApi();
    render(<ShopPage />);

    const standing = await screen.findByRole("region", { name: /every few weeks/i });
    await user.click(within(standing).getByRole("button", { name: /need soap refill this week/i }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/shop",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ op: "needThisWeek", section: "fewWeeks", id: "seed-soap-refill" }),
      }),
    );

    const specials = screen.getByRole("region", { name: /this week specials/i });
    expect(within(standing).getByRole("button", { name: /^soap refill$/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(within(specials).getByRole("button", { name: /^soap refill$/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(within(standing).getByRole("button", { name: /soap refill is already on this week/i })).toBeDisabled();

    await user.click(within(specials).getByRole("button", { name: /^soap refill$/i }));
    expect(within(specials).getByRole("button", { name: /^soap refill$/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(within(standing).getByRole("button", { name: /^soap refill$/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(within(specials).getAllByRole("button", { name: /^soap refill$/i })).toHaveLength(1);
  });
});
