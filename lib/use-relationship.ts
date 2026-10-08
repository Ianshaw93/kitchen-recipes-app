"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  RelationshipApiError,
  fetchSharedRelationship,
  putSharedRelationship,
} from "./relationship-client";
import {
  SEED_RELATIONSHIP,
  loadRelationship,
  saveRelationship,
  type RelationshipDocument,
} from "./relationship";

export type RelationshipSyncStatus = "loading" | "ready" | "error";

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof RelationshipApiError) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export function useRelationship() {
  const [document, setDocument] = useState<RelationshipDocument | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [status, setStatus] = useState<RelationshipSyncStatus>("loading");
  const loadPromiseRef = useRef<Promise<RelationshipDocument | null>>(Promise.resolve(null));
  const documentRef = useRef<RelationshipDocument | null>(null);
  const queueRef = useRef(Promise.resolve());

  const replaceDocument = useCallback((next: RelationshipDocument) => {
    documentRef.current = next;
    setDocument(next);
    saveRelationship(next);
  }, []);

  useEffect(() => {
    const pending = fetchSharedRelationship()
      .then((remote) => {
        replaceDocument(remote);
        setSyncError(null);
        setStatus("ready");
        setHydrated(true);
        return remote;
      })
      .catch((error: unknown) => {
        const cached = loadRelationship() ?? SEED_RELATIONSHIP;
        documentRef.current = cached;
        setDocument(cached);
        setSyncError(errorMessage(error, "Couldn't load the shared notes."));
        setStatus("error");
        setHydrated(true);
        return cached;
      });

    loadPromiseRef.current = pending;
  }, [replaceDocument]);

  const save = useCallback(
    (mutate: (current: RelationshipDocument) => RelationshipDocument | null) => {
      const run = async () => {
        await loadPromiseRef.current;
        const current = documentRef.current;
        if (!current) {
          return false;
        }
        const next = mutate(current);
        if (!next) {
          return false;
        }
        replaceDocument(next);
        setSyncError(null);
        try {
          replaceDocument(await putSharedRelationship(next));
          setStatus("ready");
          return true;
        } catch (error) {
          replaceDocument(current);
          setSyncError(errorMessage(error, "Couldn't save the shared notes."));
          setStatus("error");
          return false;
        }
      };

      const pending = queueRef.current.then(run, run);
      queueRef.current = pending.then(
        () => undefined,
        () => undefined,
      );
      return pending;
    },
    [replaceDocument],
  );

  return { document, hydrated, syncError, status, save };
}
