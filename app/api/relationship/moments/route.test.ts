import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE } from "@/app/api/relationship/moments/[id]/route";
import { GET, POST } from "@/app/api/relationship/moments/route";
import { POST as POST_TAG } from "@/app/api/relationship/tags/route";
import type { BehaviourTag } from "@/lib/behaviour-tags";
import {
  createBehaviourTagsMemoryStore,
  resetBehaviourTagsStoreForTests,
  setBehaviourTagsStoreForTests,
} from "@/lib/behaviour-tags-store";
import { migratedExampleId } from "@/lib/moments";
import { emptyRelationshipDocument } from "@/lib/relationship";
import {
  createRelationshipMemoryStore,
  resetRelationshipStoreForTests,
  setRelationshipStoreForTests,
} from "@/lib/relationship-store";

const BASE = "http://localhost/api/relationship/moments";
const SCAN_TOKEN = "scan-token-not-a-secret";
const HOUSEHOLD = "household-token-not-a-secret";

function post(body: unknown, headers: Record<string, string> = {}) {
  return POST(
    new Request(BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

function del(id: string, headers: Record<string, string> = {}) {
  return DELETE(new Request(`${BASE}/${encodeURIComponent(id)}`, { method: "DELETE", headers }), {
    params: Promise.resolve({ id }),
  });
}

async function list(headers: Record<string, string> = {}): Promise<BehaviourTag[]> {
  const response = await GET(new Request(BASE, { headers }));
  return ((await response.json()) as { moments: BehaviourTag[] }).moments;
}

const typed = { who: "avery", kind: "win", text: "Generic win typed in the app", date: "2026-10-10" };

describe("moments API (in-app)", () => {
  beforeEach(() => {
    setBehaviourTagsStoreForTests(createBehaviourTagsMemoryStore());
    setRelationshipStoreForTests(
      createRelationshipMemoryStore({
        ...emptyRelationshipDocument("2026-10-01T00:00:00.000Z"),
        behaviourExamples: { avery: [{ id: "a1", text: "Generic example", date: "2026-02-01" }], ian: [] },
      }),
    );
    vi.stubEnv("BEHAVIOUR_TAGS_TOKEN", SCAN_TOKEN);
    vi.stubEnv("PAYMENTS_HOUSEHOLD_TOKEN", "");
  });

  afterEach(() => {
    resetBehaviourTagsStoreForTests();
    resetRelationshipStoreForTests();
    vi.unstubAllEnvs();
  });

  it("GET lists the migrated examples, uncached", async () => {
    const response = await GET(new Request(BASE));
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const { moments } = (await response.json()) as { moments: BehaviourTag[] };
    expect(moments).toEqual([
      expect.objectContaining({ id: migratedExampleId("avery", "a1"), kind: "win", who: "avery", text: "Generic example" }),
    ]);
  });

  it("POST needs no bearer token and returns the new moment", async () => {
    const response = await post(typed);
    expect(response.status).toBe(201);
    const { moment } = (await response.json()) as { moment: BehaviourTag };
    expect(moment).toMatchObject(typed);
    expect((await list())[0]?.id).toBe(moment.id);
  });

  it("POST rejects bad JSON and invalid drafts with a reason", async () => {
    expect((await post("{nope")).status).toBe(400);
    const response = await post({ ...typed, who: "someone" });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "who must be one of: ian, avery, both." });
  });

  it("DELETE removes a moment, and 404s when it's gone", async () => {
    const id = migratedExampleId("avery", "a1");
    await list();
    expect((await del(id)).status).toBe(200);
    expect((await del(id)).status).toBe(404);
    expect(await list()).toEqual([]);
  });

  it("sits behind the household token when one is set, like the shared notes", async () => {
    vi.stubEnv("PAYMENTS_HOUSEHOLD_TOKEN", HOUSEHOLD);
    expect((await GET(new Request(BASE))).status).toBe(401);
    expect((await post(typed)).status).toBe(401);
    expect((await del("x")).status).toBe(401);

    const ok = { "x-payments-token": HOUSEHOLD };
    expect((await post(typed, ok)).status).toBe(201);
    expect(await list(ok)).toHaveLength(2);
  });

  it("shows tags the weekly scan POSTs with its bearer token, which still needs that token", async () => {
    const scan = { horseman: "criticism", kind: "slip", text: "Generic scan slip", who: "both", date: "2026-10-12" };
    const send = (headers: Record<string, string>) =>
      POST_TAG(
        new Request("http://localhost/api/relationship/tags", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify(scan),
        }),
      );
    expect((await send({})).status).toBe(401);
    expect((await send({ Authorization: `Bearer ${SCAN_TOKEN}` })).status).toBe(201);
    expect((await list())[0]).toMatchObject(scan);
  });
});
