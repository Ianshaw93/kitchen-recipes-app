import { describe, expect, it } from "vitest";
import {
  GUIDE_SECTIONS,
  TOGETHER_SECTIONS,
  adjacentSections,
  sectionForPathname,
} from "./us-sections";

describe("us sections", () => {
  it("gives Together one deep-linkable URL per section, standards first at /us", () => {
    expect(TOGETHER_SECTIONS.map((section) => section.href)).toEqual([
      "/us",
      "/us/listening",
      "/us/horsemen",
      "/us/reviewed",
      "/us/notes",
    ]);
    expect(TOGETHER_SECTIONS[0]?.slug).toBe("standards");
  });

  it("gives the guide its own URLs under /us/guide, standards first", () => {
    expect(GUIDE_SECTIONS.map((section) => section.href)).toEqual([
      "/us/guide",
      "/us/guide/listening",
      "/us/guide/horsemen",
      "/us/guide/reflect",
    ]);
  });

  it("keeps tab labels short enough for a 390px phone", () => {
    for (const section of [...TOGETHER_SECTIONS, ...GUIDE_SECTIONS]) {
      expect(section.label.length).toBeLessThanOrEqual(9);
      expect(section.title.length).toBeGreaterThan(0);
    }
  });

  it("matches the current pathname to a section, tolerating a trailing slash", () => {
    expect(sectionForPathname(TOGETHER_SECTIONS, "/us")?.slug).toBe("standards");
    expect(sectionForPathname(TOGETHER_SECTIONS, "/us/")?.slug).toBe("standards");
    expect(sectionForPathname(TOGETHER_SECTIONS, "/us/horsemen/")?.slug).toBe("horsemen");
    expect(sectionForPathname(GUIDE_SECTIONS, "/us/guide/reflect")?.slug).toBe("reflect");
    expect(sectionForPathname(TOGETHER_SECTIONS, "/us/guide")).toBeUndefined();
    expect(sectionForPathname(TOGETHER_SECTIONS, null)).toBeUndefined();
  });

  it("finds the previous and next sections for the pager", () => {
    expect(adjacentSections(TOGETHER_SECTIONS, "standards")).toEqual({
      previous: undefined,
      next: TOGETHER_SECTIONS[1],
    });
    expect(adjacentSections(TOGETHER_SECTIONS, "reviewed")).toEqual({
      previous: TOGETHER_SECTIONS[2],
      next: TOGETHER_SECTIONS[4],
    });
    expect(adjacentSections(GUIDE_SECTIONS, "reflect")).toEqual({
      previous: GUIDE_SECTIONS[2],
      next: undefined,
    });
  });
});
