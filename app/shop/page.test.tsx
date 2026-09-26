import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SEED_SHOP, applyShopMutation, type ShopDocument } from "@/lib/shop";
import ShopPage from "./page";

function stubShopApi(initial: ShopDocument = SEED_SHOP) {
  let shop = structuredClone(initial);
  const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
    const method = (init?.method ?? "GET").toUpperCase();
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
    expect(screen.getByRole("button", { name: /fish sauce \(patis\)/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tamarind paste/i })).toBeInTheDocument();
    expect(screen.getByText(/ran out/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /calamansi if available/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add to every few weeks/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add to this week specials/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add to asian store/i })).toBeInTheDocument();
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
});
