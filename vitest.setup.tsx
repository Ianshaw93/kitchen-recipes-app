import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method ?? "GET").toUpperCase();
      if (url.includes("/api/payments") && method === "GET") {
        return Response.json({ entries: [] });
      }
      if (url.includes("/api/payments") && method === "POST") {
        return Response.json(
          {
            entry: {
              id: "stub-entry",
              date: "2026-09-21",
              description: "stub",
              amountPence: 100,
              paidBy: "Ian",
              createdAt: "2026-09-21T00:00:00.000Z",
            },
          },
          { status: 201 },
        );
      }
      if (url.includes("/api/payments") && method === "DELETE") {
        return Response.json({ ok: true });
      }
      if (url.includes("/api/calendar") && method === "GET") {
        return Response.json({ events: [] });
      }
      if (url.includes("/api/calendar") && method === "POST") {
        return Response.json(
          {
            event: {
              id: "stub-event",
              title: "stub",
              startDate: "2026-09-21",
              allDay: true,
              who: "Both",
              createdAt: "2026-09-21T00:00:00.000Z",
            },
          },
          { status: 201 },
        );
      }
      if (url.includes("/api/calendar") && method === "PATCH") {
        return Response.json({
          event: {
            id: "stub-event",
            title: "stub",
            startDate: "2026-09-21",
            allDay: true,
            who: "Both",
            createdAt: "2026-09-21T00:00:00.000Z",
          },
        });
      }
      if (url.includes("/api/calendar") && method === "DELETE") {
        return Response.json({ ok: true });
      }
      return new Response("not found", { status: 404 });
    }),
  );
});

vi.mock("next/link", () => ({
  default: function MockLink({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
}));

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  useRouter: () => ({
    replace: vi.fn(),
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));
