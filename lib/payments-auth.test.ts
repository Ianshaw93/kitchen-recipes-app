import { afterEach, describe, expect, it, vi } from "vitest";
import { isPaymentsAuthorized, readRequestToken } from "./payments-auth";

function requestWith(
  headers: HeadersInit = {},
  url = "http://localhost/api/payments",
): Request {
  return new Request(url, { headers });
}

describe("payments household token", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows every request when PAYMENTS_HOUSEHOLD_TOKEN is unset", () => {
    vi.stubEnv("PAYMENTS_HOUSEHOLD_TOKEN", "");
    expect(isPaymentsAuthorized(requestWith())).toBe(true);
  });

  it("accepts a matching Bearer token", () => {
    vi.stubEnv("PAYMENTS_HOUSEHOLD_TOKEN", "household-secret");
    expect(
      isPaymentsAuthorized(requestWith({ Authorization: "Bearer household-secret" })),
    ).toBe(true);
  });

  it("accepts x-payments-token and a token query param", () => {
    vi.stubEnv("PAYMENTS_HOUSEHOLD_TOKEN", "household-secret");
    expect(
      isPaymentsAuthorized(requestWith({ "x-payments-token": "household-secret" })),
    ).toBe(true);
    expect(
      isPaymentsAuthorized(requestWith({}, "http://localhost/api/payments?token=household-secret")),
    ).toBe(true);
  });

  it("rejects a missing or wrong token when one is configured", () => {
    vi.stubEnv("PAYMENTS_HOUSEHOLD_TOKEN", "household-secret");
    expect(isPaymentsAuthorized(requestWith())).toBe(false);
    expect(isPaymentsAuthorized(requestWith({ Authorization: "Bearer nope" }))).toBe(false);
  });

  it("reads the Bearer token from the request", () => {
    expect(readRequestToken(requestWith({ Authorization: "Bearer abc" }))).toBe("abc");
    expect(readRequestToken(requestWith())).toBeNull();
  });
});
