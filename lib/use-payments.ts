"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  addPayment,
  deletePayment,
  loadPayments,
  savePayments,
  type PaymentDraft,
  type PaymentEntry,
} from "./payments";
import {
  PaymentsApiError,
  deleteSharedPaymentRequest,
  fetchSharedPayments,
  postSharedPayment,
} from "./payments-client";

export type PaymentsSyncStatus = "loading" | "ready" | "error";

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof PaymentsApiError) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export function usePayments() {
  const [entries, setEntries] = useState<PaymentEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [status, setStatus] = useState<PaymentsSyncStatus>("loading");
  const loadPromiseRef = useRef<Promise<PaymentEntry[]>>(Promise.resolve([]));
  const entriesRef = useRef<PaymentEntry[]>([]);

  const replaceEntries = useCallback((next: PaymentEntry[]) => {
    entriesRef.current = next;
    setEntries(next);
    savePayments(next);
  }, []);

  useEffect(() => {
    const pending = fetchSharedPayments()
      .then((remote) => {
        replaceEntries(remote);
        setSyncError(null);
        setStatus("ready");
        setHydrated(true);
        return remote;
      })
      .catch((error: unknown) => {
        const cached = loadPayments();
        if (cached.length > 0) {
          entriesRef.current = cached;
          setEntries(cached);
        }
        setSyncError(errorMessage(error, "Couldn't load shared payments."));
        setStatus("error");
        setHydrated(true);
        return cached;
      });

    loadPromiseRef.current = pending;
  }, [replaceEntries]);

  const add = useCallback(
    async (draft: PaymentDraft): Promise<boolean> => {
      await loadPromiseRef.current;
      const previous = entriesRef.current;
      const optimistic = addPayment(previous, draft);
      replaceEntries(optimistic);
      setSyncError(null);

      try {
        await postSharedPayment(draft);
        const remote = await fetchSharedPayments();
        replaceEntries(remote);
        setStatus("ready");
        return true;
      } catch (error) {
        replaceEntries(previous);
        setSyncError(errorMessage(error, "Couldn't save that spend."));
        setStatus("error");
        return false;
      }
    },
    [replaceEntries],
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      await loadPromiseRef.current;
      const previous = entriesRef.current;
      replaceEntries(deletePayment(previous, id));
      setSyncError(null);

      try {
        await deleteSharedPaymentRequest(id);
        const remote = await fetchSharedPayments();
        replaceEntries(remote);
        setStatus("ready");
        return true;
      } catch (error) {
        replaceEntries(previous);
        setSyncError(errorMessage(error, "Couldn't remove that spend."));
        setStatus("error");
        return false;
      }
    },
    [replaceEntries],
  );

  return { entries, add, remove, hydrated, syncError, status };
}
