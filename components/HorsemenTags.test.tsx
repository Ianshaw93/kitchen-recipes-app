import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { BehaviourTag } from "@/lib/behaviour-tags";
import { SEEN_TAGS_STORAGE_KEY, markTagsSeen, readSeenTagIds } from "@/lib/behaviour-tags-seen";
import { HorsemenReference } from "./HorsemenReference";
import { TogetherHorsemen } from "./TogetherHorsemen";

function tag(overrides: Partial<BehaviourTag>): BehaviourTag {
  return {
    id: "t",
    horseman: "criticism",
    kind: "win",
    text: "Generic line",
    date: "2026-10-01",
    createdAt: "2026-10-01T09:00:00.000Z",
    ...overrides,
  };
}

const SAMPLE: BehaviourTag[] = [
  tag({ id: "w1", kind: "win", text: "Generic win: raised it early", who: "ian", date: "2026-10-01" }),
  tag({ id: "s1", kind: "slip", text: "Generic slip: a sharp 'you always'", who: "both", date: "2026-10-05" }),
  tag({ id: "c1", horseman: "contempt", kind: "win", text: "Generic thanks for dinner", date: "2026-10-02" }),
];

function cardFor(name: string): HTMLElement {
  const heading = screen.getByRole("heading", { level: 3, name: new RegExp(name, "i") });
  return heading.closest("article") as HTMLElement;
}

describe("HorsemenReference behaviour tags", () => {
  it("shows no tag lists when no tags are given (the guide)", () => {
    render(<HorsemenReference framing="journal" />);
    expect(screen.queryByRole("list", { name: /moments/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/^new$/i)).not.toBeInTheDocument();
  });

  it("puts each tag on its matching card, newest first, wins green and slips warm red", () => {
    render(<HorsemenReference framing="together" tags={SAMPLE} newTagIds={new Set()} />);

    const criticism = within(cardFor("criticism")).getByRole("list", { name: /criticism moments/i });
    const items = within(criticism).getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual([
      expect.stringMatching(/Slip.*Generic slip: a sharp 'you always'.*Both · 5 Oct 2026/),
      expect.stringMatching(/Win.*Generic win: raised it early.*Ian · 1 Oct 2026/),
    ]);
    expect(items[0]?.className).toMatch(/bg-brick/);
    expect(items[1]?.className).toMatch(/bg-leaf/);

    const contempt = within(cardFor("contempt")).getByRole("list", { name: /contempt moments/i });
    expect(within(contempt).getAllByRole("listitem")).toHaveLength(1);
    expect(within(cardFor("defensiveness")).queryByRole("list", { name: /moments/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/^new$/i)).not.toBeInTheDocument();
  });

  it("collapses long lists to three with Show all", async () => {
    const user = userEvent.setup();
    const many = Array.from({ length: 5 }, (_, index) =>
      tag({ id: `m${index}`, text: `Generic moment ${index}`, date: `2026-10-0${index + 1}` }),
    );
    render(<HorsemenReference framing="together" tags={many} newTagIds={new Set()} />);

    const list = screen.getByRole("list", { name: /criticism moments/i });
    expect(within(list).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      expect.stringContaining("Generic moment 4"),
      expect.stringContaining("Generic moment 3"),
      expect.stringContaining("Generic moment 2"),
    ]);
    await user.click(screen.getByRole("button", { name: /show all 5/i }));
    expect(within(list).getAllByRole("listitem")).toHaveLength(5);
    await user.click(screen.getByRole("button", { name: /show fewer/i }));
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
  });

  it("labels only the new tags as New", () => {
    render(<HorsemenReference framing="together" tags={SAMPLE} newTagIds={new Set(["s1"])} />);
    const list = screen.getByRole("list", { name: /criticism moments/i });
    const [slip, win] = within(list).getAllByRole("listitem");
    expect(within(slip as HTMLElement).getByText(/^new$/i)).toBeInTheDocument();
    expect(within(win as HTMLElement).queryByText(/^new$/i)).not.toBeInTheDocument();
  });
});

describe("TogetherHorsemen", () => {
  function stubTags(tags: BehaviourTag[] | "error") {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (tags === "error") {
        return new Response("nope", { status: 503 });
      }
      if (String(input) === "/api/relationship/tags") {
        return Response.json({ tags });
      }
      return new Response("not found", { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("loads tags, labels unseen ones New for this visit, and marks them seen", async () => {
    stubTags(SAMPLE);
    markTagsSeen(["w1"]);
    const view = render(<TogetherHorsemen />);

    const list = await screen.findByRole("list", { name: /criticism moments/i });
    const [slip, win] = within(list).getAllByRole("listitem");
    expect(within(slip as HTMLElement).getByText(/^new$/i)).toBeInTheDocument();
    expect(within(win as HTMLElement).queryByText(/^new$/i)).not.toBeInTheDocument();
    await waitFor(() => expect(readSeenTagIds().sort()).toEqual(["c1", "s1", "w1"]));
    expect(within(slip as HTMLElement).getByText(/^new$/i)).toBeInTheDocument();

    view.unmount();
    render(<TogetherHorsemen />);
    await screen.findByRole("list", { name: /criticism moments/i });
    expect(screen.queryByText(/^new$/i)).not.toBeInTheDocument();
  });

  it("still shows the cards, without tags, when the tags can't load", async () => {
    const fetchMock = stubTags("error");
    render(<TogetherHorsemen />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(screen.getAllByRole("article")).toHaveLength(4);
    expect(screen.queryByRole("list", { name: /moments/i })).not.toBeInTheDocument();
    expect(window.localStorage.getItem(SEEN_TAGS_STORAGE_KEY)).toBeNull();
  });
});
