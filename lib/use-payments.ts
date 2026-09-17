"use client";

import { useSyncExternalStore } from "react";
import {
  PAYMENTS_STORAGE_KEY,
  addPayment,
  deletePayment,
  loadPayments,
  savePayments,
  type PaymentDraft,
  type PaymentEntry,
} from "./payments";

const empty: PaymentEntry[] = [];
let cache: { raw: string; value: PaymentEntry[] } | null = null;
const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

function emit() {
  listeners.forEach((listener) => listener());
}

function snapshot(): PaymentEntry[] {
  const raw =
    typeof window === "undefined"
      ? "[]"
      : (window.localStorage.getItem(PAYMENTS_STORAGE_KEY) ?? "[]");
  if (cache && cache.raw === raw) {
    return cache.value;
  }

  const value = loadPayments();
  cache = { raw, value };
  return value;
}

function commit(next: PaymentEntry[]) {
  savePayments(next);
  cache = {
    raw: window.localStorage.getItem(PAYMENTS_STORAGE_KEY) ?? "[]",
    value: next,
  };
  emit();
}

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function usePayments() {
  const hydrated = useHydrated();
  const stored = useSyncExternalStore(subscribe, snapshot, () => empty);
  const entries = hydrated ? stored : empty;

  function add(draft: PaymentDraft) {
    commit(addPayment(snapshot(), draft));
  }

  function remove(id: string) {
    commit(deletePayment(snapshot(), id));
  }

  return { entries, add, remove, hydrated };
}
