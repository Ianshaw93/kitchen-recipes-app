"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ShopApiError, fetchSharedShop, postShopMutation } from "./shop-client";
import {
  applyShopMutation,
  loadShop,
  saveShop,
  type ShopDocument,
  type ShopListId,
  type ShopStandingSection,
} from "./shop";

export type ShopSyncStatus = "loading" | "ready" | "error";

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ShopApiError) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export function useShop() {
  const [shop, setShop] = useState<ShopDocument | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [status, setStatus] = useState<ShopSyncStatus>("loading");
  const loadPromiseRef = useRef<Promise<ShopDocument | null>>(Promise.resolve(null));
  const shopRef = useRef<ShopDocument | null>(null);
  const queueRef = useRef(Promise.resolve());

  const replaceShop = useCallback((next: ShopDocument) => {
    shopRef.current = next;
    setShop(next);
    saveShop(next);
  }, []);

  useEffect(() => {
    const pending = fetchSharedShop()
      .then((remote) => {
        replaceShop(remote);
        setSyncError(null);
        setStatus("ready");
        setHydrated(true);
        return remote;
      })
      .catch((error: unknown) => {
        const cached = loadShop();
        if (cached) {
          shopRef.current = cached;
          setShop(cached);
        }
        setSyncError(errorMessage(error, "Couldn't load the shared shop list."));
        setStatus("error");
        setHydrated(true);
        return cached;
      });

    loadPromiseRef.current = pending;
  }, [replaceShop]);

  const runMutation = useCallback(
    (mutate: (current: ShopDocument) => Promise<boolean>) => {
      const run = async () => {
        await loadPromiseRef.current;
        return mutate(shopRef.current as ShopDocument);
      };
      const pending = queueRef.current.then(run, run);
      queueRef.current = pending.then(
        () => undefined,
        () => undefined,
      );
      return pending;
    },
    [],
  );

  const toggle = useCallback(
    (section: ShopListId, id: string) =>
      runMutation(async (current) => {
        if (!current) {
          return false;
        }
        const optimistic = applyShopMutation(current, { op: "toggle", section, id });
        if (!optimistic) {
          return false;
        }
        replaceShop(optimistic);
        setSyncError(null);
        try {
          replaceShop(await postShopMutation({ op: "toggle", section, id }));
          setStatus("ready");
          return true;
        } catch (error) {
          replaceShop(current);
          setSyncError(errorMessage(error, "Couldn't update the shared shop list."));
          setStatus("error");
          return false;
        }
      }),
    [replaceShop, runMutation],
  );

  const add = useCallback(
    (section: ShopListId, label: string) =>
      runMutation(async (current) => {
        const trimmed = label.trim();
        if (!current || !trimmed) {
          return false;
        }
        const optimistic = applyShopMutation(current, { op: "add", section, label: trimmed });
        if (!optimistic) {
          return false;
        }
        replaceShop(optimistic);
        setSyncError(null);
        try {
          replaceShop(await postShopMutation({ op: "add", section, label: trimmed }));
          setStatus("ready");
          return true;
        } catch (error) {
          replaceShop(current);
          setSyncError(errorMessage(error, "Couldn't update the shared shop list."));
          setStatus("error");
          return false;
        }
      }),
    [replaceShop, runMutation],
  );

  const needThisWeek = useCallback(
    (section: ShopStandingSection, id: string) =>
      runMutation(async (current) => {
        if (!current) {
          return false;
        }
        const optimistic = applyShopMutation(current, { op: "needThisWeek", section, id });
        if (!optimistic) {
          return false;
        }
        replaceShop(optimistic);
        setSyncError(null);
        try {
          replaceShop(await postShopMutation({ op: "needThisWeek", section, id }));
          setStatus("ready");
          return true;
        } catch (error) {
          replaceShop(current);
          setSyncError(errorMessage(error, "Couldn't update the shared shop list."));
          setStatus("error");
          return false;
        }
      }),
    [replaceShop, runMutation],
  );

  const clear = useCallback(
    (section: ShopListId) =>
      runMutation(async (current) => {
        if (!current) {
          return false;
        }
        const optimistic = applyShopMutation(current, { op: "clear", section });
        if (!optimistic) {
          return false;
        }
        replaceShop(optimistic);
        setSyncError(null);
        try {
          replaceShop(await postShopMutation({ op: "clear", section }));
          setStatus("ready");
          return true;
        } catch (error) {
          replaceShop(current);
          setSyncError(errorMessage(error, "Couldn't update the shared shop list."));
          setStatus("error");
          return false;
        }
      }),
    [replaceShop, runMutation],
  );

  return { shop, hydrated, syncError, status, toggle, add, clear, needThisWeek };
}
