"use client";

import { useSharedRelationship } from "@/lib/relationship-context";

export function RelationshipSyncError() {
  const { syncError } = useSharedRelationship();
  if (!syncError) {
    return null;
  }
  return (
    <p
      className="mt-4 rounded-3xl border border-brick/25 bg-brick/10 px-4 py-3 text-base font-semibold leading-snug text-ink"
      role="alert"
    >
      {syncError}
    </p>
  );
}
