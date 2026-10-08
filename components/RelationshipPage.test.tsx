import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SEED_RELATIONSHIP, type RelationshipDocument } from "@/lib/relationship";
import { RelationshipPage } from "./RelationshipPage";

function stubRelationshipApi(initial: RelationshipDocument = SEED_RELATIONSHIP) {
  let document = structuredClone(initial);
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = (init?.method ?? "GET").toUpperCase();
    if (!String(input).includes("/api/relationship")) {
      return new Response("not found", { status: 404 });
    }
    if (method === "PUT") {
      document = JSON.parse(String(init?.body ?? "{}")) as RelationshipDocument;
      return Response.json({ document });
    }
    return Response.json({ document });
  });
  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock, getDocument: () => document };
}

describe("RelationshipPage", () => {
  it("shows Avery positives by default and can switch to Ian", async () => {
    const user = userEvent.setup();
    stubRelationshipApi();
    render(<RelationshipPage />);

    expect(await screen.findByText(/offered a hug/i)).toBeInTheDocument();
    expect(screen.getByText(/Minority Report/)).toBeInTheDocument();
    expect(screen.queryByText(/waited until she moved to gratitude/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /ian examples/i }));
    expect(screen.getByText(/waited until she moved to gratitude/i)).toBeInTheDocument();
  });

  it("invites empty non-negotiables and a toxic-doc placeholder", async () => {
    stubRelationshipApi();
    render(<RelationshipPage />);

    expect(await screen.findByText(/communication & conflict/i)).toBeInTheDocument();
    expect(screen.getByText(/Add the Google Doc link when you have it/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /things to work on/i })).toBeInTheDocument();
    expect(screen.getByText(/Gratitude \/ grace at dinner/i)).toBeInTheDocument();
  });

  it("ticks active-listening steps in localStorage and can reset", async () => {
    const user = userEvent.setup();
    stubRelationshipApi();
    render(<RelationshipPage />);

    const listening = await screen.findByRole("region", { name: /active listening/i });
    const first = within(listening).getByRole("button", { name: /pick one topic/i });
    expect(first).toHaveAttribute("aria-pressed", "false");

    await user.click(first);
    expect(first).toHaveAttribute("aria-pressed", "true");
    expect(within(listening).getByText(/tap to tick · 1\//i)).toBeInTheDocument();

    await user.click(within(listening).getByRole("button", { name: /reset/i }));
    expect(within(listening).getByRole("button", { name: /pick one topic/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("saves a takeaway onto the shared document", async () => {
    const user = userEvent.setup();
    const api = stubRelationshipApi();
    render(<RelationshipPage />);

    await screen.findByText(/offered a hug/i);
    await user.type(screen.getByLabelText(/what i heard/i), "Need more warning");
    await user.type(screen.getByLabelText(/what they need/i), "A pause");
    await user.type(screen.getByLabelText(/one thing i.ll do/i), "Mirror first");
    await user.click(screen.getByRole("button", { name: /speaker avery/i }));
    await user.click(screen.getByRole("button", { name: /save takeaway/i }));

    expect(api.fetchMock).toHaveBeenCalledWith(
      "/api/relationship",
      expect.objectContaining({ method: "PUT" }),
    );
    expect(await screen.findByText(/Need more warning/)).toBeInTheDocument();
    expect(api.getDocument().takeaways[0]?.speaker).toBe("Avery");
  });
});
