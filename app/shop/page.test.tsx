import { render, screen, within } from "@testing-library/react";
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
    const asian = screen.getByRole("region", { name: /asian store/i });
    expect(within(asian).getByRole("button", { name: /^fish sauce \(patis\)/i })).toBeInTheDocument();
    expect(within(asian).getByRole("button", { name: /^tamarind paste/i })).toBeInTheDocument();
    expect(within(asian).getByText(/ran out/i)).toBeInTheDocument();
    expect(within(asian).getByRole("button", { name: /^calamansi if available/i })).toBeInTheDocument();
    expect(within(asian).getByRole("button", { name: /need calamansi if available this week/i })).toBeInTheDocument();
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
