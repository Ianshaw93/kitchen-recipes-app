import { render, screen, within } from "@testing-library/react";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { describe, expect, it, vi } from "vitest";
import { SEED_RELATIONSHIP } from "@/lib/relationship";
import TogetherLayout, { metadata as layoutMetadata } from "./layout";
import HorsemenPage, { metadata as horsemenMetadata } from "./horsemen/page";
import ListeningPage, { metadata as listeningMetadata } from "./listening/page";
import NotesPage, { metadata as notesMetadata } from "./notes/page";
import UsPage, { metadata } from "./page";
import ReviewedPage, { metadata as reviewedMetadata } from "./reviewed/page";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/us"),
}));

function stubRelationshipApi() {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = (init?.method ?? "GET").toUpperCase();
    if (String(input).includes("/api/relationship") && method === "GET") {
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
  /behaviour examples/i,
];

function expectOnlyRegions(...visible: RegExp[]) {
  for (const name of ALL_REGIONS) {
    if (visible.includes(name)) {
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
      horsemenMetadata,
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
    expect(document.querySelector('header nav a[href="/us"]')).toBeNull();

    const tabs = screen.getByRole("navigation", { name: /together sections/i });
    expect(within(tabs).getByRole("link", { name: /standards/i })).toHaveAttribute("aria-current", "page");

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

  it("puts the horsemen chart on /us/horsemen", () => {
    stubRelationshipApi();
    renderRoute("/us/horsemen", HorsemenPage);

    expectOnlyRegions(/four horsemen/i);
    expect(screen.getByRole("button", { name: /original wording/i })).toBeInTheDocument();
  });

  it("puts the reviewed log, check-in list, and weekly prompt on /us/reviewed", async () => {
    stubRelationshipApi();
    renderRoute("/us/reviewed", ReviewedPage);

    expectOnlyRegions(/reviewed together/i);
    expect(screen.getByRole("region", { name: /state of the union/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /check-in list/i })).toBeInTheDocument();
    expect(await screen.findByText(/No sit-downs logged yet/i)).toBeInTheDocument();
  });

  it("keeps behaviour examples, things to work on, and the doc link on /us/notes", async () => {
    stubRelationshipApi();
    renderRoute("/us/notes", NotesPage);

    expectOnlyRegions(/behaviour examples/i);
    expect(screen.getByRole("region", { name: /things to work on/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /toxic behaviours/i })).toBeInTheDocument();
    expect(await screen.findByText(/offered a hug/i)).toBeInTheDocument();
  });

  it("loads the shared notes once and keeps them while switching sections", async () => {
    const fetchMock = stubRelationshipApi();
    const view = renderRoute("/us/notes", NotesPage);
    expect(await screen.findByText(/offered a hug/i)).toBeInTheDocument();

    vi.mocked(usePathname).mockReturnValue("/us/reviewed");
    view.rerender(
      <TogetherLayout>
        <ReviewedPage />
      </TogetherLayout>,
    );
    expect(screen.getByText(/No sit-downs logged yet/i)).toBeInTheDocument();
    expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
