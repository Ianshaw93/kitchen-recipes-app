import { describe, expect, it } from "vitest";
import sitemap from "./sitemap";

describe("sitemap", () => {
  it("lists public pages and excludes /us", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toContain("https://kitchen-recipes-app.vercel.app/");
    expect(urls).toContain("https://kitchen-recipes-app.vercel.app/shop");
    expect(urls).toContain("https://kitchen-recipes-app.vercel.app/homes");
    expect(urls).toContain("https://kitchen-recipes-app.vercel.app/payments");
    expect(urls.some((url) => url.includes("/us"))).toBe(false);
  });
});
