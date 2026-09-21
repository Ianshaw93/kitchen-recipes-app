import { timingSafeEqual } from "node:crypto";

export const PAYMENTS_TOKEN_HEADER = "x-payments-token";

export function getHouseholdToken(): string | undefined {
  const token = process.env.PAYMENTS_HOUSEHOLD_TOKEN;
  return token ? token : undefined;
}

export function readRequestToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (authorization) {
    const match = authorization.match(/^Bearer\s+(.+)$/i);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  const headerToken = request.headers.get(PAYMENTS_TOKEN_HEADER);
  if (headerToken) {
    return headerToken.trim();
  }

  const queryToken = new URL(request.url).searchParams.get("token");
  if (queryToken) {
    return queryToken.trim();
  }

  return null;
}

export function isPaymentsAuthorized(request: Request): boolean {
  const expected = getHouseholdToken();
  if (!expected) {
    return true;
  }

  const incoming = readRequestToken(request);
  if (!incoming) {
    return false;
  }

  return tokensMatch(incoming, expected);
}

function tokensMatch(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) {
    return false;
  }

  return timingSafeEqual(a, b);
}
