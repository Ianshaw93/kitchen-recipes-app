"use client";

import { useState } from "react";
import { HORSEMEN } from "@/lib/horsemen";

export function HorsemenReference({
  framing,
}: {
  framing: "together" | "journal";
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section aria-labelledby="horsemen-heading">
      <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.22em] text-ink-soft">Reference</p>
      <h2 id="horsemen-heading" className="mt-1 font-display text-2xl font-bold">
        Four Horsemen → antidotes
      </h2>
      <p className="mt-2 text-sm font-semibold leading-snug text-ink-soft">
        {framing === "journal"
          ? "Spot the pattern in your own writing. Name the pattern, not the person."
          : "Name the pattern, not the person."}
      </p>
      <ul className="mt-4 space-y-2">
        {HORSEMEN.map((card) => (
          <li key={card.id} className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-extrabold uppercase tracking-wide text-brick">{card.horseman}</span>
            <span className="text-right text-sm font-semibold text-ink">{card.antidote}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 space-y-2">
        {HORSEMEN.map((card) => {
          const open = openId === card.id;
          const panelId = `horseman-${card.id}`;
          return (
            <div key={card.id} className="overflow-hidden rounded-3xl border-2 border-line/15 bg-cream">
              <button
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenId(open ? null : card.id)}
                className="tap flex w-full items-center justify-between gap-3 px-4 text-left"
              >
                <span className="text-lg font-extrabold">{card.horseman}</span>
                <span className="text-sm font-bold text-ink-soft">{open ? "Hide" : "Show"}</span>
              </button>
              {open ? (
                <div id={panelId} className="space-y-3 px-4 pb-4">
                  <p className="text-base font-semibold leading-snug">{card.definition}</p>
                  <p className="text-sm font-semibold text-ink-soft">
                    {card.antidote}: {card.antidoteDefinition}
                  </p>
                  <p className="text-xs font-extrabold uppercase tracking-wide text-ink-soft">{card.exampleLabel}</p>
                  <div className="rounded-2xl border-2 border-brick/30 bg-brick/10 px-4 py-3">
                    <p className="text-xs font-extrabold uppercase tracking-wide text-brick">Sounds like</p>
                    <p className="mt-1 text-base font-semibold leading-snug">{card.soundsLike}</p>
                  </div>
                  <div className="rounded-2xl border-2 border-leaf/30 bg-leaf/10 px-4 py-3">
                    <p className="text-xs font-extrabold uppercase tracking-wide text-leaf">Try instead</p>
                    <p className="mt-1 text-base font-semibold leading-snug">{card.tryInstead}</p>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
