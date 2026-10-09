"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useRelationship } from "./use-relationship";

type SharedRelationship = ReturnType<typeof useRelationship>;

const RelationshipContext = createContext<SharedRelationship | null>(null);

/** Loads the shared household notes once so every Together section reads the same copy. */
export function RelationshipProvider({ children }: { children: ReactNode }) {
  const shared = useRelationship();
  return <RelationshipContext.Provider value={shared}>{children}</RelationshipContext.Provider>;
}

export function useSharedRelationship(): SharedRelationship {
  const shared = useContext(RelationshipContext);
  if (!shared) {
    throw new Error("useSharedRelationship must be used inside RelationshipProvider");
  }
  return shared;
}
