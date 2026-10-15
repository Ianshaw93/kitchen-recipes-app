import { createHash, timingSafeEqual } from "node:crypto";

export const BEHAVIOUR_TAGS_TOKEN_ENV = "BEHAVIOUR_TAGS_TOKEN";

export type TagsWriteAccess = "ok" | "unauthorized" | "disabled";

/** Hashing first gives equal-length buffers, so the compare is constant-time whatever the input length. */
export function tokensEqual(left: string, right: string): boolean {
  const a = createHash("sha256").update(left).digest();
  const b = createHash("sha256").update(right).digest();
  return timingSafeEqual(a, b);
}

function bearerToken(request: Request): string | null {
  const match = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  return token ? token : null;
}

export function checkBehaviourTagsWrite(request: Request): TagsWriteAccess {
  const expected = process.env[BEHAVIOUR_TAGS_TOKEN_ENV];
  if (!expected) {
    return "disabled";
  }
  const incoming = bearerToken(request);
  if (!incoming || !tokensEqual(incoming, expected)) {
    return "unauthorized";
  }
  return "ok";
}
