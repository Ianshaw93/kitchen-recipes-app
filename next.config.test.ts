import { describe, expect, it } from "vitest";
import nextConfig from "./next.config";

describe("next.config redirects", () => {
  it("sends the old Horsemen sections back to the start of Together and the guide, temporarily", async () => {
    const redirects = (await nextConfig.redirects?.()) ?? [];
    expect(redirects).toEqual(
      expect.arrayContaining([
        { source: "/us/horsemen", destination: "/us", permanent: false },
        { source: "/us/guide/horsemen", destination: "/us/guide", permanent: false },
      ]),
    );
  });
});
