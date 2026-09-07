"use client";

import { checklistStorageKey } from "@/lib/checked-items";
import { useCheckedItems } from "@/lib/use-checked-items";
import { ChecklistHeader } from "./ChecklistHeader";
import { TickBox } from "./TickBox";

export function StepList({ slug, steps }: { slug: string; steps: string[] }) {
  const { checked, toggle, reset } = useCheckedItems(
    checklistStorageKey("steps", slug),
  );
  const done = steps.filter((_, index) => checked[String(index)]).length;

  return (
    <section>
      <ChecklistHeader
        title="Steps"
        done={done}
        total={steps.length}
        onClear={reset}
      />
      <ol className="overflow-hidden rounded-3xl border-2 border-line/15 bg-cream">
        {steps.map((step, index) => {
          const id = String(index);
          const isOn = Boolean(checked[id]);

          return (
            <li
              key={`${id}-${step}`}
              className={index === 0 ? "" : "border-t-2 border-line/10"}
            >
              <button
                type="button"
                onClick={() => toggle(id)}
                aria-pressed={isOn}
                className="tap flex w-full items-start gap-3 px-4 py-3 text-left"
              >
                <TickBox on={isOn} />
                <span className="min-w-0">
                  <span className="block text-xs font-extrabold uppercase tracking-[0.2em] text-brick">
                    Step {index + 1}
                  </span>
                  <span
                    className={`mt-1 block text-xl font-semibold leading-snug ${
                      isOn ? "text-ink-soft line-through" : "text-ink"
                    }`}
                  >
                    {step}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
