import { describe, expect, it } from "vitest";
import robots from "./robots";

describe("robots.txt", () => {
  it("disallows /us", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    const disallow = rules?.disallow;
    const listed = Array.isArray(disallow) ? disallow : [disallow];
    expect(listed).toContain("/us");
  });
});
