import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SEED_RELATIONSHIP } from "@/lib/relationship";
import UsPage, { metadata } from "./page";

function stubRelationshipApi() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const method = (init?.method ?? "GET").toUpperCase();
      if (String(input).includes("/api/relationship") && method === "GET") {
        return Response.json({ document: SEED_RELATIONSHIP });
      }
      return new Response("not found", { status: 404 });
    }),
  );
}

describe("/us page", () => {
  it("asks crawlers not to index or follow", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("renders the relationship sections without a header link to itself", async () => {
    stubRelationshipApi();
    render(<UsPage />);

    expect(screen.getByRole("heading", { name: /^us$/i })).toBeInTheDocument();
    expect(document.querySelector('a[href="/us"]')).toBeNull();
    expect(screen.getByRole("heading", { name: /non-negotiables/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /behaviour examples/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /toxic behaviours/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /active listening/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /things to work on/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /state of the union/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /four horsemen/i })).toBeInTheDocument();

    expect(await screen.findByText(/offered a hug/i)).toBeInTheDocument();
    expect(screen.getAllByText(/We need…/i).length).toBeGreaterThan(0);
  });
});
