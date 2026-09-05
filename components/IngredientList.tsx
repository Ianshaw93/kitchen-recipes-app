"use client";

import { useEffect, useMemo, useState } from "react";
import type { Ingredient } from "@/lib/recipes";

const storageKey = (slug: string) => `kusina:checked:${slug}`;

export function IngredientList({
  slug,
  ingredients,
}: {
  slug: string;
  ingredients: Ingredient[];
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey(slug));
      if (raw) {
        setChecked(JSON.parse(raw) as Record<string, boolean>);
      } else {
        setChecked({});
      }
    } catch {
      setChecked({});
    }
    setReady(true);
  }, [slug]);

  useEffect(() => {
    if (!ready) {
      return;
    }
    try {
      window.localStorage.setItem(storageKey(slug), JSON.stringify(checked));
    } catch {
      // Ignore quota / private mode.
    }
  }, [checked, ready, slug]);

  const groups = useMemo(() => {
    const seen: string[] = [];
    const map = new Map<string, Ingredient[]>();

    for (const ingredient of ingredients) {
      const group = ingredient.group ?? "";
      if (!map.has(group)) {
        map.set(group, []);
        seen.push(group);
      }
      map.get(group)?.push(ingredient);
    }

    return seen.map((name) => ({ name, items: map.get(name) ?? [] }));
  }, [ingredients]);

  const done = ingredients.filter((item) => checked[item.id]).length;

  function toggle(id: string) {
    setChecked((current) => ({ ...current, [id]: !current[id] }));
  }

  function reset() {
    setChecked({});
  }

  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">Ingredients</h2>
          <p className="text-sm font-semibold text-ink-soft">
            Tap to tick · {done}/{ingredients.length}
          </p>
        </div>
        {done > 0 ? (
          <button
            type="button"
            onClick={reset}
            className="tap rounded-full px-3 text-sm font-bold text-brick underline-offset-4 hover:underline"
          >
            Clear ticks
          </button>
        ) : null}
      </div>
      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.name || "all"}>
            {group.name ? (
              <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.2em] text-ink-soft">
                {group.name}
              </p>
            ) : null}
            <ul className="overflow-hidden rounded-3xl border-2 border-line/15 bg-cream">
              {group.items.map((ingredient, index) => {
                const isOn = Boolean(checked[ingredient.id]);
                return (
                  <li
                    key={ingredient.id}
                    className={index === 0 ? "" : "border-t-2 border-line/10"}
                  >
                    <button
                      type="button"
                      onClick={() => toggle(ingredient.id)}
                      aria-pressed={isOn}
                      className="tap flex w-full items-center gap-3 px-4 py-3 text-left"
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 ${
                          isOn
                            ? "border-leaf bg-leaf text-cream"
                            : "border-line/30 bg-paper"
                        }`}
                        aria-hidden="true"
                      >
                        {isOn ? (
                          <svg viewBox="0 0 16 16" className="h-5 w-5" fill="none">
                            <path
                              d="M3 8.5 6.2 12 13 4"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : null}
                      </span>
                      <span
                        className={`text-lg font-semibold leading-snug ${
                          isOn ? "text-ink-soft line-through" : "text-ink"
                        }`}
                      >
                        {ingredient.item}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
