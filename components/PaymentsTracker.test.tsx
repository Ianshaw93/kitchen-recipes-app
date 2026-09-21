import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  PAYMENTS_STORAGE_KEY,
  addPayment,
  hasDuplicatePayment,
  savePayments,
  type PaymentDraft,
  type PaymentEntry,
} from "@/lib/payments";
import { PaymentsTracker } from "./PaymentsTracker";

function stubPaymentsApi(initial: PaymentEntry[] = []) {
  let entries = [...initial];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();
    const idMatch = url.match(/\/api\/payments\/([^/?]+)/);

    if (idMatch && method === "DELETE") {
      const id = decodeURIComponent(idMatch[1] ?? "");
      entries = entries.filter((entry) => entry.id !== id);
      return Response.json({ ok: true });
    }

    if (url.includes("/api/payments") && method === "POST") {
      const draft = JSON.parse(String(init?.body ?? "{}")) as PaymentDraft;
      if (hasDuplicatePayment(entries, draft)) {
        const existing = entries.find(
          (entry) =>
            entry.paidBy === draft.paidBy &&
            entry.amountPence === draft.amountPence &&
            entry.description === draft.description.trim() &&
            entry.date === draft.date,
        );
        return Response.json({ entry: existing });
      }
      entries = addPayment(entries, draft);
      return Response.json({ entry: entries[0] }, { status: 201 });
    }

    if (url.includes("/api/payments")) {
      return Response.json({ entries });
    }

    return new Response("not found", { status: 404 });
  });

  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock, getEntries: () => entries };
}

describe("PaymentsTracker", () => {
  it("renders the empty state and how it works", async () => {
    stubPaymentsApi();
    render(<PaymentsTracker />);

    expect(screen.getByRole("heading", { name: /who paid/i })).toBeInTheDocument();
    expect(screen.getByText("Settled")).toBeInTheDocument();
    expect(
      await screen.findByText(/shared 50\/50\. whoever didn't pay owes half/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/same list on both phones/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add spend/i })).toBeInTheDocument();
  });

  it("adds an entry via the API and shows the 50/50 balance", async () => {
    const user = userEvent.setup();
    const api = stubPaymentsApi();
    render(<PaymentsTracker />);
    await screen.findByText(/nothing logged yet/i);

    await user.click(screen.getByRole("button", { name: /^ian$/i }));
    await user.type(screen.getByLabelText(/amount/i), "10");
    await user.type(screen.getByLabelText(/what it was for/i), "Tesco shop");
    await user.click(screen.getByRole("button", { name: /add spend/i }));

    expect(await screen.findByText("Ian is owed £5.00")).toBeInTheDocument();
    expect(screen.getByText("Tesco shop")).toBeInTheDocument();
    expect(screen.getByText("£10.00")).toBeInTheDocument();
    expect(screen.getByText(/paid by ian/i)).toBeInTheDocument();

    expect(api.fetchMock).toHaveBeenCalledWith(
      "/api/payments",
      expect.objectContaining({ method: "POST" }),
    );

    const stored = JSON.parse(window.localStorage.getItem(PAYMENTS_STORAGE_KEY) ?? "null");
    expect(stored).toHaveLength(1);
    expect(stored[0].description).toBe("Tesco shop");
    expect(api.getEntries()).toHaveLength(1);
    expect(screen.getByLabelText(/amount/i)).toHaveValue("");
    expect(screen.getByLabelText(/what it was for/i)).toHaveValue("");
  });

  it("loads entries from the shared API", async () => {
    stubPaymentsApi(
      addPayment([], {
        date: "2026-09-12",
        description: "Waitrose",
        amountPence: 2000,
        paidBy: "Avery",
        note: "fruit",
      }),
    );

    render(<PaymentsTracker />);

    expect(await screen.findByText("Waitrose")).toBeInTheDocument();
    expect(screen.getByText("Avery is owed £10.00")).toBeInTheDocument();
    expect(screen.getByText("£20.00")).toBeInTheDocument();
    expect(screen.getByText(/paid by avery/i)).toBeInTheDocument();
    expect(screen.getByText("fruit")).toBeInTheDocument();
  });

  it("shows cached entries and an error when the API is offline", async () => {
    savePayments(
      addPayment([], {
        date: "2026-09-12",
        description: "Waitrose",
        amountPence: 2000,
        paidBy: "Avery",
      }),
    );
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      get: () => false,
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );

    render(<PaymentsTracker />);

    expect(await screen.findByText("Waitrose")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(/offline/i);

    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      get: () => true,
    });
  });

  it("imports a spend from query params by POSTing to the shared API", async () => {
    const onImportHandled = vi.fn();
    const api = stubPaymentsApi();

    render(
      <PaymentsTracker
        importParams={{
          paidBy: "Ian",
          amount: "57.60",
          description: "Asda shop",
          date: "2026-09-17",
          note: "Delivery Fri 18 Sep 2026, 2–3pm · 18 Millhouse Drive, G20 0UE",
        }}
        onImportHandled={onImportHandled}
      />,
    );

    expect(await screen.findByText("Asda shop")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Added: Asda shop £57.60 (Ian)");
    expect(screen.getByText("Ian is owed £28.80")).toBeInTheDocument();
    await waitFor(() => expect(onImportHandled).toHaveBeenCalledTimes(1));
    expect(api.fetchMock).toHaveBeenCalledWith(
      "/api/payments",
      expect.objectContaining({ method: "POST" }),
    );

    const stored = JSON.parse(window.localStorage.getItem(PAYMENTS_STORAGE_KEY) ?? "null");
    expect(stored).toHaveLength(1);
    expect(stored[0].description).toBe("Asda shop");
    expect(stored[0].paidBy).toBe("Ian");
    expect(stored[0].amountPence).toBe(5760);
    expect(stored[0].note).toContain("Millhouse");
  });

  it("does not import the same query payload twice", async () => {
    const payload = {
      paidBy: "Ian" as const,
      amount: "57.60",
      description: "Asda shop",
      date: "2026-09-17",
    };
    const api = stubPaymentsApi();

    const first = render(<PaymentsTracker importParams={payload} onImportHandled={vi.fn()} />);
    expect(await screen.findByText("Asda shop")).toBeInTheDocument();
    await waitFor(() => expect(api.getEntries()).toHaveLength(1));
    first.unmount();

    render(<PaymentsTracker importParams={payload} onImportHandled={vi.fn()} />);
    expect(await screen.findByText("Asda shop")).toBeInTheDocument();

    expect(screen.getAllByText("Asda shop")).toHaveLength(1);
    await waitFor(() => expect(api.getEntries()).toHaveLength(1));
    const stored = JSON.parse(window.localStorage.getItem(PAYMENTS_STORAGE_KEY) ?? "null");
    expect(stored).toHaveLength(1);
  });

  it("deletes an entry after confirm via the API", async () => {
    const user = userEvent.setup();
    const initial = addPayment([], {
      date: "2026-09-12",
      description: "Waitrose",
      amountPence: 2000,
      paidBy: "Avery",
    });
    const api = stubPaymentsApi(initial);

    render(<PaymentsTracker />);
    expect(await screen.findByText("Waitrose")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /delete waitrose/i }));
    const dialog = screen.getByRole("dialog", { name: /remove this spend/i });
    await user.click(within(dialog).getByRole("button", { name: /remove/i }));

    expect(await screen.findByText("Settled")).toBeInTheDocument();
    expect(screen.queryByText("Waitrose")).not.toBeInTheDocument();
    expect(window.localStorage.getItem(PAYMENTS_STORAGE_KEY)).toBe("[]");
    expect(api.fetchMock).toHaveBeenCalledWith(
      `/api/payments/${initial[0]!.id}`,
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
