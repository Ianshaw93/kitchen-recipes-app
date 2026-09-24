import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { applyVote, SEED_HOMES_WEEK } from "@/lib/homes";
import { HomesScoper } from "./HomesScoper";

function stubHomesApi(initial = [SEED_HOMES_WEEK]) {
  let weeks = structuredClone(initial);
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();
    if (url.includes("/api/homes/vote") && method === "POST") {
      const draft = JSON.parse(String(init?.body ?? "{}")) as {
        listingId: string;
        person: "ian" | "abby";
        choice: "no" | "maybe" | "yes";
      };
      weeks = applyVote(weeks, draft.listingId, draft.person, draft.choice);
      return Response.json({ weeks });
    }
    if (url.includes("/api/homes")) {
      return Response.json({ weeks });
    }
    return new Response("not found", { status: 404 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock, getWeeks: () => weeks };
}

describe("HomesScoper", () => {
  it("renders seeded cards with Ian and Abby vote rows", async () => {
    stubHomesApi();
    render(<HomesScoper />);

    expect(await screen.findByText("Archerhill Road, Knightswood")).toBeInTheDocument();
    expect(screen.getByText(/week of 21 sep 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/£269,995/)).toBeInTheDocument();

    const card = screen.getByRole("article", { name: /archerhill road/i });
    expect(within(card).getByRole("button", { name: /ian: no/i })).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: /ian: maybe/i })).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: /ian: yes/i })).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: /abby: no/i })).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: /abby: maybe/i })).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: /abby: yes/i })).toBeInTheDocument();
  });

  it("votes independently and shows a Match badge when both say yes", async () => {
    const user = userEvent.setup();
    const api = stubHomesApi();
    render(<HomesScoper />);

    const card = await screen.findByRole("article", { name: /archerhill road/i });
    await user.click(within(card).getByRole("button", { name: /ian: yes/i }));
    await user.click(within(card).getByRole("button", { name: /abby: yes/i }));

    expect(await within(card).findByText(/^match$/i)).toBeInTheDocument();
    expect(api.fetchMock).toHaveBeenCalledWith(
      "/api/homes/vote",
      expect.objectContaining({ method: "POST" }),
    );
    expect(within(card).getByRole("button", { name: /ian: yes/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(within(card).getByRole("button", { name: /abby: yes/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("shows Both open when both vote at least maybe", async () => {
    const user = userEvent.setup();
    stubHomesApi();
    render(<HomesScoper />);

    const card = await screen.findByRole("article", { name: /124 alderman road/i });
    await user.click(within(card).getByRole("button", { name: /ian: maybe/i }));
    await user.click(within(card).getByRole("button", { name: /abby: yes/i }));

    expect(await within(card).findByText(/both open/i)).toBeInTheDocument();
    expect(within(card).queryByText(/^match$/i)).not.toBeInTheDocument();
  });

  it("stores who-am-I and filters unvoted by that person", async () => {
    const user = userEvent.setup();
    stubHomesApi();
    render(<HomesScoper />);

    await screen.findByText("Archerhill Road, Knightswood");
    await user.click(screen.getByRole("button", { name: /i.?m abby/i }));
    expect(window.localStorage.getItem("kusina:homes:viewer")).toBe("abby");

    const first = screen.getByRole("article", { name: /archerhill road/i });
    await user.click(within(first).getByRole("button", { name: /abby: no/i }));

    await user.click(screen.getByRole("button", { name: /^unvoted/i }));
    expect(screen.queryByRole("article", { name: /archerhill road/i })).not.toBeInTheDocument();
    expect(screen.getByRole("article", { name: /kelvindale road/i })).toBeInTheDocument();
  });

  it("shows a graceful error when the shared store is unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          {
            error:
              "Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_URL and KV_REST_API_TOKEN) so homes can be shared.",
          },
          { status: 503 },
        ),
      ),
    );

    render(<HomesScoper />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/upstash|redis|shared/i);
  });
});
