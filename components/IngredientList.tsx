"use client";

import { useMemo } from "react";
import type { Ingredient } from "@/lib/recipes";
import { checklistStorageKey } from "@/lib/checked-items";
import { useCheckedItems } from "@/lib/use-checked-items";
import { ChecklistHeader } from "./ChecklistHeader";
import { TickBox } from "./TickBox";

export function IngredientList({
  slug,
  ingredients,
}: {
  slug: string;
  ingredients: Ingredient[];
}) {
  const { checked, toggle, reset } = useCheckedItems(
    checklistStorageKey("ingredients", slug),
  );

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

  return (
    <section>
      <ChecklistHeader
        title="Ingredients"
        done={done}
        total={ingredients.length}
        onClear={reset}
      />
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
                      <TickBox on={isOn} />
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
