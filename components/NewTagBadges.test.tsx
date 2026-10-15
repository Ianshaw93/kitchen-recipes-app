import { act, render, screen, waitFor, within } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { describe, expect, it, vi } from "vitest";
import { markTagsSeen } from "@/lib/behaviour-tags-seen";
import { TOGETHER_SECTIONS } from "@/lib/us-sections";
import { SectionTabs } from "./SectionNav";
import { SiteHeader } from "./SiteHeader";
import { TogetherSectionTabs } from "./TogetherSectionTabs";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/us"),
}));

function stubLatest(ids: string[] | "error") {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    if (ids !== "error" && String(input) === "/api/relationship/tags/latest") {
      return Response.json({ ids });
    }
    return new Response("nope", { status: 503 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function usLink() {
  return within(screen.getByRole("banner")).getByRole("link", { name: /^us\b/i });
}

function badgeText(link: HTMLElement): string | null {
  return link.querySelector("[data-badge-count]")?.textContent ?? null;
}

describe("New count badge on the header Us pill", () => {
  it("shows how many tags this device hasn't seen", async () => {
    stubLatest(["a", "b", "c"]);
    markTagsSeen(["a"]);
    render(<SiteHeader />);
    await waitFor(() => expect(usLink()).toHaveAccessibleName(/^us, 2 new$/i));
    expect(badgeText(usLink())).toBe("2");
    expect(usLink()).toHaveAttribute("href", "/us");
  });

  it("caps the visible count at 9+ but keeps the exact count for screen readers", async () => {
    stubLatest(Array.from({ length: 12 }, (_, index) => `t${index}`));
    render(<SiteHeader />);
    await waitFor(() => expect(usLink()).toHaveAccessibleName(/^us, 12 new$/i));
    expect(badgeText(usLink())).toBe("9+");
  });

  it("does not show when everything has been seen", async () => {
    const fetchMock = stubLatest(["a", "b"]);
    markTagsSeen(["a", "b"]);
    render(<SiteHeader />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/relationship/tags/latest", expect.anything()));
    await act(async () => {});
    expect(usLink()).toHaveAccessibleName("Us");
  });

  it("does not show when there are no tags or the check fails", async () => {
    const fetchMock = stubLatest([]);
    const view = render(<SiteHeader />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await act(async () => {});
    expect(usLink()).toHaveAccessibleName("Us");
    view.unmount();

    const failing = stubLatest("error");
    render(<SiteHeader />);
    await waitFor(() => expect(failing).toHaveBeenCalled());
    await act(async () => {});
    expect(usLink()).toHaveAccessibleName("Us");
  });

  it("makes no request at all when the badge is switched off (the guide)", async () => {
    const fetchMock = stubLatest(["a"]);
    render(<SiteHeader compact usBadge={false} />);
    await act(async () => {});
    expect(fetchMock).not.toHaveBeenCalled();
    expect(usLink()).toHaveAccessibleName("Us");
  });

  it("clears as soon as the tags are marked seen on this device", async () => {
    stubLatest(["a"]);
    render(<SiteHeader />);
    await waitFor(() => expect(usLink()).toHaveAccessibleName(/new/i));
    act(() => markTagsSeen(["a"]));
    expect(usLink()).toHaveAccessibleName("Us");
    expect(badgeText(usLink())).toBeNull();
  });
});

describe("New count badge on the Horsemen tab", () => {
  it("SectionTabs shows the count only on the badged tab, and nothing for 0", () => {
    vi.mocked(usePathname).mockReturnValue("/us");
    render(
      <SectionTabs sections={TOGETHER_SECTIONS} label="Together sections" badges={{ horsemen: 3, notes: 0 }} />,
    );
    const nav = screen.getByRole("navigation", { name: /together sections/i });
    const horsemen = within(nav).getByRole("link", { name: /^horsemen, 3 new$/i });
    expect(horsemen).toHaveAttribute("href", "/us/horsemen");
    expect(badgeText(horsemen)).toBe("3");
    expect(within(nav).getByRole("link", { name: /^notes$/i })).toBeInTheDocument();
    expect(nav.querySelectorAll("[data-badge-count]")).toHaveLength(1);
  });

  it("TogetherSectionTabs counts unseen tags on Horsemen and hides at 0", async () => {
    vi.mocked(usePathname).mockReturnValue("/us");
    stubLatest(["a", "b"]);
    render(<TogetherSectionTabs />);
    const nav = screen.getByRole("navigation", { name: /together sections/i });
    await waitFor(() => expect(within(nav).getByRole("link", { name: /^horsemen, 2 new$/i })).toBeInTheDocument());

    act(() => markTagsSeen(["a"]));
    expect(within(nav).getByRole("link", { name: /^horsemen, 1 new$/i })).toBeInTheDocument();
    act(() => markTagsSeen(["b"]));
    expect(within(nav).getByRole("link", { name: /^horsemen$/i })).toBeInTheDocument();
    expect(nav.querySelector("[data-badge-count]")).toBeNull();
  });
});
