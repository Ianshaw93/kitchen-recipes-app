"use client";

import { LISTENING_CHECKLIST_KEY, LISTENING_GROUPS, listeningStepCount } from "@/lib/relationship";
import { useCheckedItems } from "@/lib/use-checked-items";
import { TickBox } from "./TickBox";

export function ListeningChecklist({
  storageKey = LISTENING_CHECKLIST_KEY,
}: {
  storageKey?: string;
}) {
  const { checked, toggle, reset } = useCheckedItems(storageKey);
  const steps = LISTENING_GROUPS.flatMap((group) => group.steps);
  const done = steps.filter((step) => checked[step.id]).length;

  return (
    <section aria-labelledby="listening-heading">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 id="listening-heading" className="font-display text-2xl font-bold">
            Active listening
          </h2>
          <p className="text-sm font-semibold text-ink-soft">
            Speaker-Listener, then swap. Tap to tick · {done}/{listeningStepCount()}
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="tap shrink-0 rounded-full px-3 text-sm font-bold text-brick underline-offset-4 hover:underline"
        >
          Reset
        </button>
      </div>
      <div className="space-y-4">
        {LISTENING_GROUPS.map((group) => (
          <div key={group.id}>
            <p className="mb-2 text-[0.7rem] font-extrabold uppercase tracking-[0.22em] text-brick">
              {group.title}
            </p>
            <ol className="overflow-hidden rounded-3xl border-2 border-line/15 bg-cream">
              {group.steps.map((step, index) => {
                const isOn = Boolean(checked[step.id]);
                return (
                  <li key={step.id} className={index === 0 ? "" : "border-t-2 border-line/10"}>
                    <button
                      type="button"
                      onClick={() => toggle(step.id)}
                      aria-pressed={isOn}
                      className="tap flex w-full items-start gap-3 px-4 py-3 text-left"
                    >
                      <TickBox on={isOn} />
                      <span
                        className={`min-w-0 text-base font-semibold leading-snug ${
                          isOn ? "text-ink-soft line-through" : "text-ink"
                        }`}
                      >
                        {step.text}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}
