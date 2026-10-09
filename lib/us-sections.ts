export type UsSection = {
  slug: string;
  href: string;
  /** Tab label. Kept short so every tab fits on a 390px phone. */
  label: string;
  title: string;
};

export const TOGETHER_SECTIONS: readonly UsSection[] = [
  { slug: "standards", href: "/us", label: "Standards", title: "Our standards" },
  { slug: "listening", href: "/us/listening", label: "Listen", title: "Active listening" },
  { slug: "horsemen", href: "/us/horsemen", label: "Horsemen", title: "Four Horsemen" },
  { slug: "reviewed", href: "/us/reviewed", label: "Reviewed", title: "Reviewed together" },
  { slug: "notes", href: "/us/notes", label: "Notes", title: "Notes" },
];

export const GUIDE_SECTIONS: readonly UsSection[] = [
  { slug: "standards", href: "/us/guide", label: "Standards", title: "Our standards" },
  { slug: "listening", href: "/us/guide/listening", label: "Listen", title: "Active listening" },
  { slug: "horsemen", href: "/us/guide/horsemen", label: "Horsemen", title: "Four Horsemen" },
  { slug: "reflect", href: "/us/guide/reflect", label: "Reflect", title: "Reflect" },
];

function trimTrailingSlash(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
}

export function sectionForPathname(
  sections: readonly UsSection[],
  pathname: string | null | undefined,
): UsSection | undefined {
  if (!pathname) {
    return undefined;
  }
  const path = trimTrailingSlash(pathname);
  return sections.find((section) => section.href === path);
}

export function adjacentSections(
  sections: readonly UsSection[],
  slug: string,
): { previous: UsSection | undefined; next: UsSection | undefined } {
  const index = sections.findIndex((section) => section.slug === slug);
  if (index === -1) {
    return { previous: undefined, next: undefined };
  }
  return { previous: sections[index - 1], next: sections[index + 1] };
}
