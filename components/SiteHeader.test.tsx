import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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

  it("puts the nav on its own row under the logo on phones so four pills never squeeze beside it", () => {
    render(<SiteHeader compact />);

    const row = within(screen.getByRole("banner")).getByRole("navigation").parentElement as HTMLElement;
    expect(row.className).toMatch(/(^|\s)flex-col(\s|$)/);
    expect(row.className).toMatch(/sm:flex-row/);
    expect(within(screen.getByRole("banner")).getByRole("navigation").className).toMatch(/flex-nowrap/);
  });
});
