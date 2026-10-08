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

  it("shows the committed seed when the shared notes cannot be loaded", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 503 })));
    render(<RelationshipPage />);

    expect(await screen.findByText(/offered a hug/i)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(/couldn't load/i);
  });

  it("puts our standards first and keeps the toxic-doc placeholder", async () => {
    stubRelationshipApi();
    render(<RelationshipPage />);

    const standards = await screen.findByRole("region", { name: /our standards/i });
    expect(screen.getByRole("main").firstElementChild).toBe(standards);
    expect(within(standards).queryByRole("button")).not.toBeInTheDocument();
    expect(within(standards).getByText(/Lying should be a last resort/)).toBeInTheDocument();
    expect(screen.getByText(/Add the Google Doc link when you have it/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /things to work on/i })).toBeInTheDocument();
    expect(screen.getByText(/Gratitude \/ grace at dinner/i)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /^non-negotiables$/i })).not.toBeInTheDocument();
  });

  it("ticks listener steps, keeps if-relevant steps out of the progress, and saves a plan", async () => {
    const user = userEvent.setup();
    const api = stubRelationshipApi();
    render(<RelationshipPage />);

    const listening = await screen.findByRole("region", { name: /active listening/i });
    expect(
      within(listening).getByText("From our therapist's Speaker-Listener handout"),
    ).toBeInTheDocument();
    expect(
      within(listening).getByText(
        "Raising something? Use I statements about one specific situation, say how you feel, no blame.",
      ),
    ).toBeInTheDocument();
    expect(within(listening).queryByRole("button", { name: /raising something/i })).not.toBeInTheDocument();
    expect(within(listening).queryByRole("button", { name: /speaks first/i })).not.toBeInTheDocument();
    expect(within(listening).queryByRole("button", { name: /round 2/i })).not.toBeInTheDocument();
    expect(within(listening).queryByRole("button", { name: /switch roles/i })).not.toBeInTheDocument();
    expect(within(listening).getByText(/^Do$/)).toBeInTheDocument();
    expect(within(listening).getByText(/^Don't$/)).toBeInTheDocument();
    expect(within(listening).queryByRole("button", { name: /minimise their feelings/i })).not.toBeInTheDocument();
    expect(within(listening).getByText(/minimise their feelings/i)).toBeInTheDocument();
    expect(within(listening).getByText(/^If relevant$/i)).toBeInTheDocument();

    const prepare = within(listening).getByRole("button", { name: /postpone your own agenda/i });
    await user.click(prepare);
    expect(prepare).toHaveAttribute("aria-pressed", "true");
    expect(within(listening).getByText(/tap to tick · 1\//i)).toBeInTheDocument();

    await user.click(within(listening).getByRole("button", { name: /take accountability/i }));
    expect(within(listening).getByText(/tap to tick · 1\//i)).toBeInTheDocument();

    await user.click(within(listening).getByRole("button", { name: /plan to stop it happening again/i }));
    await user.type(screen.getByLabelText(/^action$/i), "Text the night before");
    await user.type(screen.getByLabelText(/by when or how often/i), "each time plans change");
    await user.type(screen.getByLabelText(/check back in on/i), "2026-10-15");
    await user.click(screen.getByRole("button", { name: /^plan ian$/i }));

    await user.type(screen.getByLabelText(/what i heard/i), "The late change landed badly");
    await user.type(screen.getByLabelText(/what they need/i), "A heads-up");
    await user.type(screen.getByLabelText(/one thing i.ll do/i), "Text before I change plans");
    await user.click(screen.getByRole("button", { name: /save takeaway/i }));

    expect(await screen.findByText(/The late change landed badly/)).toBeInTheDocument();
    expect(screen.getByText(/Text the night before/)).toBeInTheDocument();
    expect(screen.getByText(/each time plans change/)).toBeInTheDocument();
    expect(screen.getByText(/15 Oct 2026/)).toBeInTheDocument();
    expect(api.getDocument().takeaways[0]?.plan?.actions[0]).toMatchObject({
      action: "Text the night before",
      who: "Ian",
      byWhen: "each time plans change",
    });
    expect(api.getDocument().takeaways[0]?.plan?.checkBackOn).toBe("2026-10-15");

    const historyItem = screen.getByText(/Text the night before/).closest("li");
    expect(historyItem).not.toBeNull();
    await user.click(within(historyItem as HTMLElement).getByRole("button", { name: /add as standard/i }));
    expect(await screen.findByRole("button", { name: /text the night before/i })).toBeInTheDocument();
    expect(api.getDocument().checkInStandards.map((item) => item.text)).toEqual(["Text the night before"]);
  });

  it("expands a horseman to generic sounds-like and try-instead lines", async () => {
    const user = userEvent.setup();
    stubRelationshipApi();
    render(<RelationshipPage />);

    await screen.findByText(/offered a hug/i);
    expect(screen.getByText(/Gentle start-up/)).toBeInTheDocument();
    expect(screen.queryByText(/You always talk about yourself/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^criticism/i }));
    expect(screen.getByText(/You always talk about yourself/)).toBeInTheDocument();
    expect(screen.getByText(/feeling left out/i)).toBeInTheDocument();
    expect(screen.getByText(/generic examples/i)).toBeInTheDocument();
    expect(screen.getByText(/Attacking who they are, not what they did/)).toBeInTheDocument();
    expect(screen.queryByText(/personality or character/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /original wording/i }));
    expect(screen.getByText(/personality or character/i)).toBeInTheDocument();
  });

  it("logs a reviewed-together entry and adds its standard to the check-in list", async () => {
    const user = userEvent.setup();
    const api = stubRelationshipApi();
    render(<RelationshipPage />);

    await screen.findByText(/offered a hug/i);
    await user.type(screen.getByLabelText(/^takeaways$/i), "Named the pattern.");
    await user.type(screen.getByLabelText(/standards agreed/i), "One appreciation first");
    await user.click(screen.getByRole("button", { name: /save review/i }));

    expect(await screen.findByText(/Named the pattern/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /add as standard/i }));
    expect(await screen.findByRole("button", { name: /one appreciation first/i })).toBeInTheDocument();
    expect(api.getDocument().checkInStandards.map((item) => item.text)).toEqual([
      "One appreciation first",
    ]);
    expect(api.getDocument().reviews).toHaveLength(1);
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
    expect(api.getDocument().takeaways[0]?.plan).toBeUndefined();
  });
});
