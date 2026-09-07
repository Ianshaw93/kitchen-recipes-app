"use client";

import { useEffect, useState } from "react";
import { readChecked, writeChecked } from "./checked-items";

export function useCheckedItems(storageKey: string) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  useEffect(() => {
    setChecked(readChecked(storageKey));
    setLoadedKey(storageKey);
  }, [storageKey]);

  useEffect(() => {
    if (loadedKey !== storageKey) {
      return;
    }
    writeChecked(storageKey, checked);
  }, [checked, loadedKey, storageKey]);

  function toggle(id: string) {
    setChecked((current) => ({ ...current, [id]: !current[id] }));
  }

  function reset() {
    setChecked({});
  }

  return { checked, toggle, reset };
}
