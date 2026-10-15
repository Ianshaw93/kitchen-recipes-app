import { act, render, screen, within } from "@testing-library/react";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { describe, expect, it, vi } from "vitest";
import type { BehaviourTag } from "@/lib/behaviour-tags";
import { SEED_RELATIONSHIP } from "@/lib/relationship";
import TogetherLayout, { metadata as layoutMetadata } from "./layout";
import ListeningPage, { metadata as listeningMetadata } from "./listening/page";
import NotesPage, { metadata as notesMetadata } from "./notes/page";
import UsPage, { metadata } from "./page";
import ReviewedPage, { metadata as reviewedMetadata } from "./reviewed/page";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/us"),
}));

const SAMPLE_TAGS: BehaviourTag[] = [
  {
    id: "w1",
    horseman: "criticism",
    kind: "win",
    text: "Generic win: raised it gently",
    who: "ian",
    date: "2026-10-01",
    createdAt: "2026-10-01T09:00:00.000Z",
  },
  {
    id: "s1",
    horseman: "stonewalling",
    kind: "slip",
    text: "Generic slip: went quiet mid-talk",
    who: "both",
    date: "2026-10-05",
    createdAt: "2026-10-05T09:00:00.000Z",
  },
  {
    id: "w2",
    horseman: "contempt",
    kind: "win",
    text: "Generic win: said thanks for dinner",
    date: "2026-10-03",
    createdAt: "2026-10-03T09:00:00.000Z",
  },
];

function stubRelationshipApi(tags: BehaviourTag[] | "error" = []) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = (init?.method ?? "GET").toUpperCase();
    if (String(input) === "/api/relationship/moments" && method === "GET") {
      return tags === "error" ? new Response("nope", { status: 503 }) : Response.json({ moments: tags });
    }
    if (String(input) === "/api/relationship" && method === "GET") {
      return Response.json({ document: SEED_RELATIONSHIP });
    }
    return new Response("not found", { status: 404 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderRoute(path: string, Page: ComponentType) {
  vi.mocked(usePathname).mockReturnValue(path);
  return render(
    <TogetherLayout>
      <Page />
    </TogetherLayout>,
  );
}

const ALL_REGIONS = [
  /our standards/i,
  /active listening/i,
  /four horsemen/i,
  /reviewed together/i,
  /^moments$/i,
  /wins and slips/i,
  /behaviour examples/i,
];

function expectOnlyRegions(...visible: RegExp[]) {
  for (const name of ALL_REGIONS) {
    if (visible.some((shown) => shown.source === name.source)) {
      expect(screen.getByRole("region", { name })).toBeInTheDocument();
    } else {
      expect(screen.queryByRole("region", { name })).not.toBeInTheDocument();
    }
  }
}

describe("/us Together routes", () => {
  it("asks crawlers not to index or follow any Together section", () => {
    for (const meta of [
      layoutMetadata,
      metadata,
      listeningMetadata,
      reviewedMetadata,
      notesMetadata,
    ]) {
      expect(meta.robots).toEqual({ index: false, follow: false });
    }
  });

  it("opens on our standards with the section tabs and a link to the guide", async () => {
    stubRelationshipApi();
    renderRoute("/us", UsPage);

    expect(screen.getByRole("heading", { level: 1, name: /^together$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /avery.s guide/i })).toHaveAttribute("href", "/us/guide");
    expect(document.querySelector('header nav a[href="/us"]')).toHaveTextContent(/^us$/i);

    const tabs = screen.getByRole("navigation", { name: /together sections/i });
    expect(within(tabs).getByRole("link", { name: /standards/i })).toHaveAttribute("aria-current", "page");
    expect(within(tabs).getAllByRole("link").map((link) => link.textContent)).toEqual([
      "Standards",
      "Listen",
      "Reviewed",
      "Notes",
    ]);
    expect(document.querySelector("[data-badge-count]")).toBeNull();

    const standards = screen.getByRole("region", { name: /our standards/i });
    expect(screen.getByRole("main").firstElementChild).toBe(standards);
    expect(within(standards).getByText(/Consistent appreciation/)).toBeInTheDocument();
    expectOnlyRegions(/our standards/i);
    expect(screen.getByRole("link", { name: /next.*active listening/i })).toHaveAttribute(
      "href",
      "/us/listening",
    );
  });

  it("puts the listening checklist and session takeaways on /us/listening", async () => {
    stubRelationshipApi();
    renderRoute("/us/listening", ListeningPage);

    expectOnlyRegions(/active listening/i);
    expect(screen.getByRole("region", { name: /session takeaways/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save takeaway/i })).toBeInTheDocument();
    expect(
      within(screen.getByRole("navigation", { name: /together sections/i })).getByRole("link", {
        name: /listen/i,
      }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("puts the reviewed log, check-in list, and weekly prompt on /us/reviewed", async () => {
    stubRelationshipApi();
    renderRoute("/us/reviewed", ReviewedPage);

    expectOnlyRegions(/reviewed together/i);
    expect(screen.getByRole("region", { name: /state of the union/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /check-in list/i })).toBeInTheDocument();
    expect(await screen.findByText(/No sit-downs logged yet/i)).toBeInTheDocument();
  });

  it("puts one Moments list first on /us/notes, then things to work on and the doc link", async () => {
    stubRelationshipApi();
    renderRoute("/us/notes", NotesPage);

    expectOnlyRegions(/^moments$/i);
    const moments = screen.getByRole("region", { name: /^moments$/i });
    expect(screen.getByRole("main").firstElementChild).toBe(moments);
    expect(screen.getByRole("region", { name: /things to work on/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /toxic behaviours/i })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /avery examples|ian examples/i })).not.toBeInTheDocument();
    expect(await screen.findByText(/Gratitude \/ grace at dinner/i)).toBeInTheDocument();
  });

  it("lists wins and slips from both sources together, newest first with who and date", async () => {
    stubRelationshipApi(SAMPLE_TAGS);
    renderRoute("/us/notes", NotesPage);

    const region = screen.getByRole("region", { name: /^moments$/i });
    const list = await within(region).findByRole("list", { name: /^moments$/i });
    const items = within(list).getAllByRole("listitem");
    expect(items.map((item) => item.querySelector("p")?.textContent)).toEqual([
      "Generic slip: went quiet mid-talk",
      "Generic win: said thanks for dinner",
      "Generic win: raised it gently",
    ]);
    expect(items[0]).toHaveTextContent(/Slip.*Stonewalling.*Both · 5 Oct 2026/);
    expect(items[2]).toHaveTextContent(/Win.*Raise it gently.*Ian · 1 Oct 2026/);
    expect(within(region).queryByText(/^new$/i)).not.toBeInTheDocument();
  });

  it("says so when there are no moments yet, or they can't load", async () => {
    stubRelationshipApi([]);
    const view = renderRoute("/us/notes", NotesPage);
    expect(await screen.findByText(/no moments yet/i)).toBeInTheDocument();
    view.unmount();

    stubRelationshipApi("error");
    renderRoute("/us/notes", NotesPage);
    expect(await screen.findByText(/couldn.t load moments/i)).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: /^moments$/i })).not.toBeInTheDocument();
  });

  it("only asks for moments on the Notes section, and never runs the old badge check", async () => {
    const fetchMock = stubRelationshipApi(SAMPLE_TAGS);
    renderRoute("/us", UsPage);
    await act(async () => {});
    const urls = fetchMock.mock.calls.map(([input]) => String(input));
    expect(urls.some((url) => url.includes("/api/relationship/tags") || url.includes("/moments"))).toBe(false);
  });

  it("loads the shared notes once and keeps them while switching sections", async () => {
    const fetchMock = stubRelationshipApi();
    const view = renderRoute("/us/notes", NotesPage);
    expect(await screen.findByText(/Gratitude \/ grace at dinner/i)).toBeInTheDocument();

    vi.mocked(usePathname).mockReturnValue("/us/reviewed");
    view.rerender(
      <TogetherLayout>
        <ReviewedPage />
      </TogetherLayout>,
    );
    expect(screen.getByText(/No sit-downs logged yet/i)).toBeInTheDocument();
    expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    const notesLoads = fetchMock.mock.calls.filter(([input]) => String(input) === "/api/relationship");
    expect(notesLoads).toHaveLength(1);
  });
});
