import { afterEach, describe, expect, it, vi } from "vitest";
import { GET, PUT } from "@/app/api/relationship/route";
import { SEED_RELATIONSHIP, addTakeaway, type RelationshipDocument } from "@/lib/relationship";
import {
  createRelationshipMemoryStore,
  resetRelationshipStoreForTests,
  setRelationshipStoreForTests,
} from "@/lib/relationship-store";

function request(path = "http://localhost/api/relationship", init?: RequestInit): Request {
  return new Request(path, init);
}

describe("relationship API routes", () => {
  afterEach(() => {
    resetRelationshipStoreForTests();
    vi.unstubAllEnvs();
  });

  it("GET seeds the research notes on an empty store", async () => {
    setRelationshipStoreForTests(createRelationshipMemoryStore());

    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");

    const body = (await response.json()) as { document: RelationshipDocument };
    expect(body.document.behaviourExamples.avery).toHaveLength(29);
    expect(body.document.behaviourExamples.ian).toHaveLength(13);
    expect(body.document.thingsToWorkOn).toHaveLength(7);
    expect(body.document.nonNegotiables.mustHaves).toEqual([]);
    expect(body.document.toxicDocUrl).toBe("");
  });

  it("PUT validates and round-trips the whole document", async () => {
    setRelationshipStoreForTests(createRelationshipMemoryStore());
    await GET(request());

    const next = addTakeaway(SEED_RELATIONSHIP, {
      date: "2026-10-08",
      speaker: "Avery",
      whatIHeard: "Need a slower start",
      whatTheyNeed: "A pause",
      oneThingIllDo: "Mirror first",
      whatINeed: "A cup of tea after",
    });

    const saved = await PUT(
      request("http://localhost/api/relationship", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      }),
    );
    expect(saved.status).toBe(200);
    const savedBody = (await saved.json()) as { document: RelationshipDocument };
    expect(savedBody.document.takeaways[0]?.whatIHeard).toBe("Need a slower start");

    const listed = await GET(request());
    const body = (await listed.json()) as { document: RelationshipDocument };
    expect(body.document.takeaways[0]?.whatINeed).toBe("A cup of tea after");
    expect(body.document.behaviourExamples.avery).toHaveLength(29);
  });

  it("rejects invalid PUT bodies", async () => {
    setRelationshipStoreForTests(createRelationshipMemoryStore());
    const response = await PUT(
      request("http://localhost/api/relationship", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: 1, nope: true }),
      }),
    );
    expect(response.status).toBe(400);
  });

  it("returns 401 when the household token does not match", async () => {
    vi.stubEnv("PAYMENTS_HOUSEHOLD_TOKEN", "household-secret");
    setRelationshipStoreForTests(createRelationshipMemoryStore());

    const response = await GET(request());
    expect(response.status).toBe(401);

    const allowed = await GET(
      request("http://localhost/api/relationship", {
        headers: { Authorization: "Bearer household-secret" },
      }),
    );
    expect(allowed.status).toBe(200);
  });
});
