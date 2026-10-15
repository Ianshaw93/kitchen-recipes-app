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

describe("New badge on the header Us pill", () => {
  it("shows when this device has an unseen tag", async () => {
    stubLatest(["a", "b"]);
    markTagsSeen(["a"]);
    render(<SiteHeader />);
    await waitFor(() => expect(usLink()).toHaveAccessibleName(/^us, new$/i));
    expect(usLink()).toHaveAttribute("href", "/us");
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
  });
});

describe("New badge on the Horsemen tab", () => {
  it("SectionTabs marks only the badged tab", () => {
    vi.mocked(usePathname).mockReturnValue("/us");
    render(<SectionTabs sections={TOGETHER_SECTIONS} label="Together sections" badges={{ horsemen: true }} />);
    const nav = screen.getByRole("navigation", { name: /together sections/i });
    expect(within(nav).getByRole("link", { name: /^horsemen, new$/i })).toHaveAttribute("href", "/us/horsemen");
    expect(within(nav).getByRole("link", { name: /^standards$/i })).toBeInTheDocument();
    expect(within(nav).getAllByText(/new/i)).toHaveLength(1);
  });

  it("TogetherSectionTabs badges Horsemen when a tag is unseen, and not otherwise", async () => {
    vi.mocked(usePathname).mockReturnValue("/us");
    stubLatest(["a"]);
    render(<TogetherSectionTabs />);
    const nav = screen.getByRole("navigation", { name: /together sections/i });
    await waitFor(() => expect(within(nav).getByRole("link", { name: /^horsemen, new$/i })).toBeInTheDocument());

    act(() => markTagsSeen(["a"]));
    expect(within(nav).getByRole("link", { name: /^horsemen$/i })).toBeInTheDocument();
  });
});
