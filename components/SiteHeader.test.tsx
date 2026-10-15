import { act, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SiteHeader } from "./SiteHeader";

describe("SiteHeader", () => {
  for (const compact of [false, true]) {
    it(`links Shop, Homes, Payments, then Us in the ${compact ? "compact" : "home"} header`, () => {
      render(<SiteHeader compact={compact} />);

      const nav = within(screen.getByRole("banner")).getByRole("navigation");
      const links = within(nav).getAllByRole("link");
      expect(links.map((link) => link.textContent)).toEqual(["Shop", "Homes", "Payments", "Us"]);
      expect(links.map((link) => link.getAttribute("href"))).toEqual(["/shop", "/homes", "/payments", "/us"]);

      const us = within(nav).getByRole("link", { name: /^us$/i });
      expect(us.className).toBe(within(nav).getByRole("link", { name: /^shop$/i }).className);
      expect(within(nav).queryByRole("link", { name: /guide/i })).not.toBeInTheDocument();
    });
  }

  it("shows a plain Us pill with no unseen-tag badge and never checks for tags", async () => {
    const fetchMock = vi.fn(async () => Response.json({ ids: ["a", "b"] }));
    vi.stubGlobal("fetch", fetchMock);
    render(<SiteHeader />);
    await act(async () => {});

    const us = within(screen.getByRole("banner")).getByRole("link", { name: /^us\b/i });
    expect(us).toHaveAccessibleName("Us");
    expect(us.querySelector("[data-badge-count]")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("puts the nav on its own row under the logo on phones so four pills never squeeze beside it", () => {
    render(<SiteHeader compact />);

    const row = within(screen.getByRole("banner")).getByRole("navigation").parentElement as HTMLElement;
    expect(row.className).toMatch(/(^|\s)flex-col(\s|$)/);
    expect(row.className).toMatch(/sm:flex-row/);
    expect(within(screen.getByRole("banner")).getByRole("navigation").className).toMatch(/flex-nowrap/);
  });
});
