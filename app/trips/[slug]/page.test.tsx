import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import TripPage from "./page";

async function renderTrip(slug: string) {
  const page = await TripPage({
    params: Promise.resolve({ slug }),
  } as Parameters<typeof TripPage>[0]);

  return render(page);
}

describe("trip detail", () => {
  it("shows Thailand budget bands and planning notes", async () => {
    await renderTrip("thailand");

    expect(
      screen.getByRole("heading", { name: /Thailand \(honey \/ baby moon\)/i, level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Ian \+ Abby/)).toBeInTheDocument();
    expect(screen.getByText(/~2 weeks/i)).toBeInTheDocument();
    expect(screen.getAllByText(/planning/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("£1,200").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("£1,500").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("£2,000").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/lean on-ground/i)).toBeInTheDocument();
    expect(screen.getByText(/^comfort$/i)).toBeInTheDocument();
    expect(screen.getByText(/between us both/i)).toBeInTheDocument();
    expect(screen.getByText(/RBS Platinum/i)).toBeInTheDocument();
    expect(screen.getByText(/Going Abroad/i)).toBeInTheDocument();
    expect(screen.getByText(/0% FX/i)).toBeInTheDocument();
    expect(screen.getByText(/flights already paid/i)).toBeInTheDocument();
    expect(screen.getByText(/no Phuket/i)).toBeInTheDocument();
    expect(screen.getByText(/no alcohol/i)).toBeInTheDocument();
  });

  it("renders shared savings totals, buffer gap, category and leg breakdowns, and photo alts", async () => {
    await renderTrip("thailand");

    expect(screen.getByRole("heading", { name: /shared savings/i })).toBeInTheDocument();
    expect(screen.getByText("Ian saved")).toBeInTheDocument();
    expect(screen.getByText("Abby saved")).toBeInTheDocument();
    expect(screen.getByText("Combined")).toBeInTheDocument();
    expect(screen.getByText("£400")).toBeInTheDocument();
    expect(screen.getAllByText("£200").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("£600")).toBeInTheDocument();
    expect(screen.getAllByText(/gap/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("£1,400")).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: /by category/i })).toBeInTheDocument();
    expect(screen.getByText(/rooms \/ accommodation/i)).toBeInTheDocument();
    expect(screen.getByText(/^food$/i)).toBeInTheDocument();
    expect(screen.getByText(/local transport/i)).toBeInTheDocument();
    expect(screen.getByText(/^activities$/i)).toBeInTheDocument();
    expect(screen.getByText(/misc \/ tips \/ sim/i)).toBeInTheDocument();
    expect(screen.getByText(/^contingency$/i)).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: /by place/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Bangkok" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Overnight sleeper" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Chiang Mai" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Chiang Rai" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Koh Kood" })).toBeInTheDocument();

    const photos = screen.getAllByRole("img").filter((node) => node.tagName === "IMG");
    expect(photos.length).toBeGreaterThanOrEqual(5);
    for (const photo of photos) {
      expect(photo.getAttribute("alt")?.trim().length).toBeGreaterThan(8);
    }

    const bands = screen.getByRole("group", { name: /on-ground bands/i });
    expect(within(bands).getByText(/buffer \/ stretch/i).closest("[data-selected='true']")).not.toBeNull();
  });

  it("keeps the header Trips nav link", async () => {
    await renderTrip("thailand");

    expect(screen.getByRole("link", { name: /^trips$/i })).toHaveAttribute("href", "/trips");
  });

  it("adds a local contribution on top of the seed log", async () => {
    const user = userEvent.setup();
    await renderTrip("thailand");

    await user.click(screen.getByRole("button", { name: /^abby$/i }));
    await user.type(screen.getByLabelText(/amount/i), "50");
    await user.click(screen.getByRole("button", { name: /add contribution/i }));

    expect(screen.getByText("£250")).toBeInTheDocument();
    expect(screen.getByText("£650")).toBeInTheDocument();
  });
});
