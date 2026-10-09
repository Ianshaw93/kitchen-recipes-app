import { render, screen, within } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GUIDE_SECTIONS, TOGETHER_SECTIONS } from "@/lib/us-sections";
import { SectionPager, SectionTabs } from "./SectionNav";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/us"),
}));

describe("SectionTabs", () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue("/us");
  });

  it("links every Together section and marks the current one", () => {
    vi.mocked(usePathname).mockReturnValue("/us/horsemen");
    render(<SectionTabs sections={TOGETHER_SECTIONS} label="Together sections" />);

    const nav = screen.getByRole("navigation", { name: /together sections/i });
    const links = within(nav).getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual(
      TOGETHER_SECTIONS.map((section) => section.href),
    );
    expect(within(nav).getByRole("link", { name: /horsemen/i })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: /standards/i })).not.toHaveAttribute("aria-current");
  });

  it("marks guide standards current at /us/guide without lighting up Together", () => {
    vi.mocked(usePathname).mockReturnValue("/us/guide");
    render(<SectionTabs sections={GUIDE_SECTIONS} label="Guide sections" />);

    const nav = screen.getByRole("navigation", { name: /guide sections/i });
    expect(within(nav).getByRole("link", { name: /standards/i })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getAllByRole("link").filter((link) => link.hasAttribute("aria-current"))).toHaveLength(1);
  });

  it("keeps every tab a comfortable tap target", () => {
    render(<SectionTabs sections={TOGETHER_SECTIONS} label="Together sections" />);
    for (const link of screen.getAllByRole("link")) {
      expect(link.className).toMatch(/min-h-12/);
    }
  });
});

describe("SectionPager", () => {
  it("offers only a next link on the first section", () => {
    vi.mocked(usePathname).mockReturnValue("/us");
    render(<SectionPager sections={TOGETHER_SECTIONS} />);

    const pager = screen.getByRole("navigation", { name: /more sections/i });
    expect(within(pager).getAllByRole("link")).toHaveLength(1);
    expect(within(pager).getByRole("link", { name: /next.*active listening/i })).toHaveAttribute(
      "href",
      "/us/listening",
    );
  });

  it("offers previous and next links in the middle", () => {
    vi.mocked(usePathname).mockReturnValue("/us/guide/listening");
    render(<SectionPager sections={GUIDE_SECTIONS} />);

    expect(screen.getByRole("link", { name: /previous.*our standards/i })).toHaveAttribute("href", "/us/guide");
    expect(screen.getByRole("link", { name: /next.*four horsemen/i })).toHaveAttribute(
      "href",
      "/us/guide/horsemen",
    );
  });

  it("renders nothing off-section", () => {
    vi.mocked(usePathname).mockReturnValue("/shop");
    const { container } = render(<SectionPager sections={TOGETHER_SECTIONS} />);
    expect(container).toBeEmptyDOMElement();
  });
});
