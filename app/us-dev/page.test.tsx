import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { BehaviourTag } from "@/lib/behaviour-tags";
import UsDevPage, { metadata } from "./page";

const SAMPLE: BehaviourTag[] = [
  {
    id: "w1",
    horseman: "criticism",
    kind: "win",
    text: "Generic win: raised it early",
    who: "ian",
    date: "2026-10-01",
    createdAt: "2026-10-01T09:00:00.000Z",
  },
  {
    id: "s1",
    horseman: "criticism",
    kind: "slip",
    text: "Generic slip: a sharp 'you always'",
    who: "both",
    date: "2026-10-05",
    createdAt: "2026-10-05T09:00:00.000Z",
  },
];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) {
      return sourceFiles(full);
    }
    return /\.(tsx?|mdx?)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [full] : [];
  });
}

describe("/us-dev hidden Horsemen area", () => {
  it("asks crawlers not to index or follow it", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("renders the Together horsemen cards with the Our moments tags", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) =>
        String(input) === "/api/relationship/tags"
          ? Response.json({ tags: SAMPLE })
          : new Response("not found", { status: 404 }),
      ),
    );
    render(<UsDevPage />);

    expect(screen.getByRole("heading", { level: 2, name: /four horsemen/i })).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(4);
    const list = await screen.findByRole("list", { name: /criticism moments/i });
    expect(within(list).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      expect.stringMatching(/Slip.*Generic slip/),
      expect.stringMatching(/Win.*Generic win/),
    ]);
    expect(screen.getByRole("button", { name: /original wording/i })).toBeInTheDocument();
  });

  it("is not linked from anywhere in the app", () => {
    const root = process.cwd();
    const files = ["app", "components", "lib"].flatMap((dir) => sourceFiles(path.join(root, dir)));
    const linking = files.filter(
      (file) => !file.startsWith(path.join(root, "app", "us-dev")) && readFileSync(file, "utf8").includes("/us-dev"),
    );
    expect(linking).toEqual([]);
  });
});
