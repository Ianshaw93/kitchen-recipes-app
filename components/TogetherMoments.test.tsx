import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { BehaviourTag } from "@/lib/behaviour-tags";
import { TogetherMoments } from "./TogetherMoments";

const SAMPLE: BehaviourTag[] = [
  {
    id: "w1",
    kind: "win",
    who: "avery",
    text: "Generic win: said thanks",
    date: "2026-02-24",
    label: "kindness",
    createdAt: "2026-10-15T00:00:00.000Z",
  },
  {
    id: "s1",
    kind: "slip",
    who: "both",
    horseman: "criticism",
    text: "Generic slip: a sharp 'you always'",
    date: "2026-10-05",
    createdAt: "2026-10-05T00:00:00.000Z",
  },
  {
    id: "w2",
    kind: "win",
    who: "ian",
    horseman: "stonewalling",
    text: "Generic win: asked for a pause",
    date: "2026-10-01",
    createdAt: "2026-10-01T00:00:00.000Z",
  },
];

function stubMomentsApi(initial: BehaviourTag[] | "error" = SAMPLE) {
  let moments = initial === "error" ? [] : structuredClone(initial);
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();
    if (initial === "error") {
      return new Response("nope", { status: 503 });
    }
    if (url === "/api/relationship/moments" && method === "GET") {
      return Response.json({ moments });
    }
    if (url === "/api/relationship/moments" && method === "POST") {
      const draft = JSON.parse(String(init?.body)) as Omit<BehaviourTag, "id" | "createdAt">;
      const moment: BehaviourTag = { date: "2026-10-15", ...draft, id: "new-1", createdAt: "2026-10-15T09:00:00.000Z" };
      moments = [moment, ...moments];
      return Response.json({ moment }, { status: 201 });
    }
    if (url.startsWith("/api/relationship/moments/") && method === "DELETE") {
      const id = decodeURIComponent(url.split("/").pop() ?? "");
      moments = moments.filter((item) => item.id !== id);
      return Response.json({ ok: true });
    }
    return new Response("not found", { status: 404 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function momentsList() {
  return screen.findByRole("list", { name: /^moments$/i });
}

function texts(list: HTMLElement) {
  return within(list)
    .getAllByRole("listitem")
    .map((item) => item.querySelector("p")?.textContent);
}

describe("Moments on Notes", () => {
  it("shows one list, newest first, each labelled Win or Slip with pattern, who, and date", async () => {
    stubMomentsApi();
    render(<TogetherMoments />);

    expect(screen.getByRole("region", { name: /^moments$/i })).toBeInTheDocument();
    const list = await momentsList();
    const items = within(list).getAllByRole("listitem");
    expect(texts(list)).toEqual([
      "Generic slip: a sharp 'you always'",
      "Generic win: asked for a pause",
      "Generic win: said thanks",
    ]);
    expect(items[0]).toHaveTextContent(/Slip.*Criticism.*Both · 5 Oct 2026/);
    expect(items[1]).toHaveTextContent(/Win.*Pause and come back.*Ian · 1 Oct 2026/);
    expect(items[2]).toHaveTextContent(/Win.*kindness.*Avery · 24 Feb 2026/);
    expect(items[0]?.className).toMatch(/bg-brick/);
    expect(items[1]?.className).toMatch(/bg-leaf/);
  });

  it("filters to Ian or Avery, keeping shared moments in both", async () => {
    const user = userEvent.setup();
    stubMomentsApi();
    render(<TogetherMoments />);
    const list = await momentsList();
    const filters = screen.getByRole("group", { name: /show moments for/i });

    expect(within(filters).getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
    await user.click(within(filters).getByRole("button", { name: "Ian" }));
    expect(texts(list)).toEqual(["Generic slip: a sharp 'you always'", "Generic win: asked for a pause"]);
    await user.click(within(filters).getByRole("button", { name: "Avery" }));
    expect(texts(list)).toEqual(["Generic slip: a sharp 'you always'", "Generic win: said thanks"]);
    await user.click(within(filters).getByRole("button", { name: "All" }));
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
  });

  it("adds a moment by hand with who, win or slip, text, and optional date and horseman", async () => {
    const user = userEvent.setup();
    const fetchMock = stubMomentsApi();
    render(<TogetherMoments />);
    await momentsList();

    await user.click(screen.getByText("Add a moment"));
    await user.click(screen.getByRole("button", { name: "Who Avery" }));
    await user.click(screen.getByRole("button", { name: "Slip" }));
    await user.type(screen.getByLabelText("What happened"), "Generic slip typed by hand");
    await user.type(screen.getByLabelText(/date \(optional\)/i), "2026-10-14");
    await user.selectOptions(screen.getByLabelText(/horseman \(optional\)/i), "contempt");
    await user.click(screen.getByRole("button", { name: "Add moment" }));

    const postCall = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
    expect(postCall?.[0]).toBe("/api/relationship/moments");
    expect(JSON.parse(String(postCall?.[1]?.body))).toEqual({
      who: "avery",
      kind: "slip",
      text: "Generic slip typed by hand",
      date: "2026-10-14",
      horseman: "contempt",
    });
    const list = await momentsList();
    await waitFor(() => expect(texts(list)[0]).toBe("Generic slip typed by hand"));
    expect(within(list).getAllByRole("listitem")[0]).toHaveTextContent(/Slip.*Contempt.*Avery · 14 Oct 2026/);
    expect(screen.getByLabelText("What happened")).toHaveValue("");
  });

  it("leaves date and horseman out when they're left blank", async () => {
    const user = userEvent.setup();
    const fetchMock = stubMomentsApi([]);
    render(<TogetherMoments />);
    await screen.findByText(/no moments yet/i);

    await user.click(screen.getByText("Add a moment"));
    await user.click(screen.getByRole("button", { name: "Who Ian" }));
    await user.type(screen.getByLabelText("What happened"), "Generic win");
    await user.click(screen.getByRole("button", { name: "Add moment" }));

    const postCall = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
    expect(JSON.parse(String(postCall?.[1]?.body))).toEqual({ who: "ian", kind: "win", text: "Generic win" });
    expect(await momentsList()).toBeInTheDocument();
  });

  it("deletes a moment", async () => {
    const user = userEvent.setup();
    const fetchMock = stubMomentsApi();
    render(<TogetherMoments />);
    const list = await momentsList();

    await user.click(screen.getByRole("button", { name: /delete moment generic win: said thanks/i }));
    expect(fetchMock).toHaveBeenCalledWith("/api/relationship/moments/w1", expect.objectContaining({ method: "DELETE" }));
    await waitFor(() => expect(within(list).getAllByRole("listitem")).toHaveLength(2));
  });

  it("says so when moments can't load", async () => {
    stubMomentsApi("error");
    render(<TogetherMoments />);
    expect(await screen.findByText(/couldn.t load moments/i)).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: /^moments$/i })).not.toBeInTheDocument();
  });
});
