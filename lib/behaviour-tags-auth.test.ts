import { afterEach, describe, expect, it, vi } from "vitest";
import { BEHAVIOUR_TAGS_TOKEN_ENV, checkBehaviourTagsWrite, tokensEqual } from "./behaviour-tags-auth";

function request(headers: Record<string, string> = {}, url = "http://localhost/api/relationship/tags") {
  return new Request(url, { method: "POST", headers });
}

describe("behaviour tag write auth", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reads the token from BEHAVIOUR_TAGS_TOKEN", () => {
    expect(BEHAVIOUR_TAGS_TOKEN_ENV).toBe("BEHAVIOUR_TAGS_TOKEN");
  });

  it("disables writes when the env var is unset or empty", () => {
    vi.stubEnv("BEHAVIOUR_TAGS_TOKEN", "");
    expect(checkBehaviourTagsWrite(request({ Authorization: "Bearer anything" }))).toBe("disabled");
  });

  it("rejects a missing, malformed, or wrong bearer token", () => {
    vi.stubEnv("BEHAVIOUR_TAGS_TOKEN", "correct-horse-battery");
    expect(checkBehaviourTagsWrite(request())).toBe("unauthorized");
    expect(checkBehaviourTagsWrite(request({ Authorization: "correct-horse-battery" }))).toBe("unauthorized");
    expect(checkBehaviourTagsWrite(request({ Authorization: "Basic correct-horse-battery" }))).toBe("unauthorized");
    expect(checkBehaviourTagsWrite(request({ Authorization: "Bearer wrong" }))).toBe("unauthorized");
    expect(checkBehaviourTagsWrite(request({ Authorization: "Bearer correct-horse-batterz" }))).toBe("unauthorized");
    expect(checkBehaviourTagsWrite(request({ Authorization: "Bearer correct-horse-battery-extra" }))).toBe(
      "unauthorized",
    );
  });

  it("only accepts the Authorization header, not the household token header or query string", () => {
    vi.stubEnv("BEHAVIOUR_TAGS_TOKEN", "correct-horse-battery");
    expect(checkBehaviourTagsWrite(request({ "x-payments-token": "correct-horse-battery" }))).toBe("unauthorized");
    expect(
      checkBehaviourTagsWrite(request({}, "http://localhost/api/relationship/tags?token=correct-horse-battery")),
    ).toBe("unauthorized");
  });

  it("accepts the right bearer token", () => {
    vi.stubEnv("BEHAVIOUR_TAGS_TOKEN", "correct-horse-battery");
    expect(checkBehaviourTagsWrite(request({ Authorization: "Bearer correct-horse-battery" }))).toBe("ok");
    expect(checkBehaviourTagsWrite(request({ authorization: "bearer   correct-horse-battery  " }))).toBe("ok");
  });

  it("compares tokens of any length without throwing", () => {
    expect(tokensEqual("abc", "abc")).toBe(true);
    expect(tokensEqual("abc", "abd")).toBe(false);
    expect(tokensEqual("short", "a much longer token")).toBe(false);
    expect(tokensEqual("", "x")).toBe(false);
  });
});
