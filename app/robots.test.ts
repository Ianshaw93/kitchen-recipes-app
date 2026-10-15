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

  it("covers the hidden /us-dev area through the /us prefix without naming it", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    const disallow = rules?.disallow;
    const listed = (Array.isArray(disallow) ? disallow : [disallow]).filter((rule): rule is string => !!rule);
    expect(listed.some((rule) => "/us-dev/horsemen".startsWith(rule))).toBe(true);
    expect(JSON.stringify(result)).not.toContain("us-dev");
  });
});
