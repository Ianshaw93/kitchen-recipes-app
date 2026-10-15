import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE } from "@/app/api/relationship/tags/[id]/route";
import { GET as GET_LATEST } from "@/app/api/relationship/tags/latest/route";
import { GET, POST } from "@/app/api/relationship/tags/route";
import type { BehaviourTag } from "@/lib/behaviour-tags";
import {
  createBehaviourTagsMemoryStore,
  resetBehaviourTagsStoreForTests,
  setBehaviourTagsStoreForTests,
} from "@/lib/behaviour-tags-store";

const BASE = "http://localhost/api/relationship/tags";
const TOKEN = "test-token-not-a-secret";

function post(body: unknown, headers: Record<string, string> = { Authorization: `Bearer ${TOKEN}` }) {
  return POST(
    new Request(BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

function del(id: string, headers: Record<string, string> = { Authorization: `Bearer ${TOKEN}` }) {
  return DELETE(new Request(`${BASE}/${id}`, { method: "DELETE", headers }), {
    params: Promise.resolve({ id }),
  });
}

async function listTags(): Promise<BehaviourTag[]> {
  const response = await GET(new Request(BASE));
  return ((await response.json()) as { tags: BehaviourTag[] }).tags;
}

const win = { horseman: "criticism", kind: "win", text: "Generic win line", who: "ian", date: "2026-10-01" };
const slip = { horseman: "contempt", kind: "slip", text: "Generic slip line", date: "2026-10-03" };

describe("behaviour tags API", () => {
  beforeEach(() => {
    setBehaviourTagsStoreForTests(createBehaviourTagsMemoryStore());
    vi.stubEnv("BEHAVIOUR_TAGS_TOKEN", TOKEN);
    vi.stubEnv("PAYMENTS_HOUSEHOLD_TOKEN", "");
  });

  afterEach(() => {
    resetBehaviourTagsStoreForTests();
    vi.unstubAllEnvs();
  });

  it("GET lists no tags at first, uncached", async () => {
    const response = await GET(new Request(BASE));
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ tags: [] });
  });

  it("POST without a token, or with a wrong one, is 401 and stores nothing", async () => {
    expect((await post(win, {})).status).toBe(401);
    expect((await post(win, { Authorization: "Bearer nope" })).status).toBe(401);
    expect((await post(win, { "x-payments-token": TOKEN })).status).toBe(401);
    expect(await listTags()).toEqual([]);
  });

  it("POST is disabled when BEHAVIOUR_TAGS_TOKEN is unset", async () => {
    vi.stubEnv("BEHAVIOUR_TAGS_TOKEN", "");
    const response = await post(win, { Authorization: "Bearer " });
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "Behaviour tag writes are disabled." });
    expect(await listTags()).toEqual([]);
  });

  it("POST rejects invalid JSON and invalid tags with 400", async () => {
    expect((await post("{not json")).status).toBe(400);
    const response = await post({ ...win, horseman: "sarcasm" });
    expect(response.status).toBe(400);
    expect(((await response.json()) as { error: string }).error).toMatch(/horseman/i);
  });

  it("POST adds a tag and GET lists newest first", async () => {
    const created = await post(win);
    expect(created.status).toBe(201);
    const { tag } = (await created.json()) as { tag: BehaviourTag };
    expect(tag).toMatchObject({ horseman: "criticism", kind: "win", text: "Generic win line", who: "ian", date: "2026-10-01" });
    expect(tag.id).toEqual(expect.any(String));
    expect(Date.parse(tag.createdAt)).not.toBeNaN();

    await post(slip);
    expect((await listTags()).map((item) => item.text)).toEqual(["Generic slip line", "Generic win line"]);
  });

  it("latest returns just the ids, newest first, for the badge check", async () => {
    const a = ((await (await post(win)).json()) as { tag: BehaviourTag }).tag;
    const b = ((await (await post(slip)).json()) as { tag: BehaviourTag }).tag;
    const response = await GET_LATEST(new Request(`${BASE}/latest`));
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ ids: [b.id, a.id] });
  });

  it("DELETE needs the token, removes by id, and 404s on unknown ids", async () => {
    const { tag } = (await (await post(win)).json()) as { tag: BehaviourTag };

    expect((await del(tag.id, {})).status).toBe(401);
    expect((await del(tag.id, { Authorization: "Bearer nope" })).status).toBe(401);
    expect(await listTags()).toHaveLength(1);

    const removed = await del(tag.id);
    expect(removed.status).toBe(200);
    expect(await removed.json()).toEqual({ ok: true });
    expect(await listTags()).toEqual([]);
    expect((await del(tag.id)).status).toBe(404);
  });

  it("DELETE is disabled when BEHAVIOUR_TAGS_TOKEN is unset", async () => {
    vi.stubEnv("BEHAVIOUR_TAGS_TOKEN", "");
    expect((await del("anything")).status).toBe(503);
  });

  it("reads honour the household token when one is set, like the shared notes", async () => {
    vi.stubEnv("PAYMENTS_HOUSEHOLD_TOKEN", "household");
    expect((await GET(new Request(BASE))).status).toBe(401);
    expect((await GET_LATEST(new Request(`${BASE}/latest`))).status).toBe(401);
    expect((await GET(new Request(BASE, { headers: { "x-payments-token": "household" } }))).status).toBe(200);
    expect((await post(win)).status).toBe(201);
  });
});
