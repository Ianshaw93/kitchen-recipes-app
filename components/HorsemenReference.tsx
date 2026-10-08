"use client";

import { useState } from "react";
import { HORSEMEN } from "@/lib/horsemen";

export function HorsemenReference({
  framing,
}: {
  framing: "together" | "journal";
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);

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
      <button
        type="button"
        aria-pressed={showOriginal}
        onClick={() => setShowOriginal((current) => !current)}
        className="tap mt-3 rounded-full px-3 text-sm font-bold text-ink-soft underline-offset-4 hover:underline"
      >
        Original wording
      </button>
      <ul className="mt-4 space-y-3">
        {HORSEMEN.map((card) => {
          const open = openId === card.id;
          const panelId = `horseman-${card.id}`;
          return (
            <li key={card.id} className="overflow-hidden rounded-3xl border-2 border-line/15 bg-cream">
              <button
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenId(open ? null : card.id)}
                className="grid w-full grid-cols-2 text-left"
              >
                <span className="border-r-2 border-line/10 bg-brick/10 px-3 py-3">
                  <span className="text-xl leading-none" aria-hidden="true">
                    {card.icon}
                  </span>
                  <span className="mt-1 block text-sm font-extrabold uppercase tracking-wide text-brick">
                    {card.horseman}
                  </span>
                  <span className="mt-1 block text-sm font-semibold leading-snug">{card.definition}</span>
                  {showOriginal ? (
                    <span className="mt-2 block text-xs font-semibold leading-snug text-ink-soft">
                      {card.originalDefinition}
                    </span>
                  ) : null}
                </span>
                <span className="bg-leaf/10 px-3 py-3">
                  <span className="sr-only">Antidote. </span>
                  <span className="block text-sm font-extrabold uppercase tracking-wide text-leaf">
                    {card.antidote}
                  </span>
                  <span className="mt-1 block text-sm font-semibold leading-snug">
                    {card.antidoteDefinition}
                  </span>
                  {showOriginal ? (
                    <span className="mt-2 block text-xs font-semibold leading-snug text-ink-soft">
                      {card.originalAntidote}
                    </span>
                  ) : null}
                </span>
              </button>
              {open ? (
                <div id={panelId} className="space-y-3 border-t-2 border-line/10 px-4 py-4">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-ink-soft">
                    {card.exampleLabel}
                  </p>
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
            </li>
          );
        })}
      </ul>
    </section>
  );
}
