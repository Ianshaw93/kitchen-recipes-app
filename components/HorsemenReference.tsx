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
    <section aria-labelledby="horsemen-heading" className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brick">Reference</p>
        <h2 id="horsemen-heading" className="mt-1 font-display text-[1.7rem] font-bold leading-tight tracking-tight">
          Four Horsemen → antidotes
        </h2>
        <p className="mt-2 text-base leading-relaxed text-ink-soft">
          {framing === "journal"
            ? "Spot the pattern in your own writing. Name the pattern, not the person."
            : "Name the pattern, not the person."}{" "}
          Tap a row for an example.
        </p>
      </div>

      <button
        type="button"
        aria-pressed={showOriginal}
        onClick={() => setShowOriginal((current) => !current)}
        className="flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border border-line/10 bg-cream/70 px-4 text-left"
      >
        <span className="text-base font-bold text-ink">Original wording</span>
        <span
          aria-hidden="true"
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
            showOriginal ? "bg-leaf" : "bg-paper-deep"
          }`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-cream shadow transition-[left] ${
              showOriginal ? "left-6" : "left-1"
            }`}
          />
        </span>
      </button>

      <div aria-hidden="true" className="grid grid-cols-2 px-1 text-xs font-bold uppercase tracking-wide">
        <span className="px-3 text-brick">Horseman</span>
        <span className="px-3 text-leaf">Antidote</span>
      </div>

      <ul className="space-y-3">
        {HORSEMEN.map((card) => {
          const open = openId === card.id;
          const panelId = `horseman-${card.id}`;
          return (
            <li
              key={card.id}
              className={`overflow-hidden rounded-3xl border bg-cream card-shadow transition-colors ${
                open ? "border-line/25" : "border-line/10"
              }`}
            >
              <button
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenId(open ? null : card.id)}
                className="block w-full text-left"
              >
                <span className="grid grid-cols-2">
                  <span className="border-r border-line/10 bg-brick/[0.07] px-3 py-3.5">
                    <span className="flex items-center gap-2">
                      <span className="text-lg leading-none" aria-hidden="true">
                        {card.icon}
                      </span>
                      <span className="text-base font-bold leading-tight text-brick">{card.horseman}</span>
                    </span>
                    <span className="mt-1.5 block text-sm leading-snug">{card.definition}</span>
                    {showOriginal ? (
                      <span className="mt-2 block border-t border-line/10 pt-2 text-sm italic leading-snug text-ink-soft">
                        {card.originalDefinition}
                      </span>
                    ) : null}
                  </span>
                  <span className="bg-leaf/[0.07] px-3 py-3.5">
                    <span className="sr-only">Antidote. </span>
                    <span className="block text-base font-bold leading-tight text-leaf">{card.antidote}</span>
                    <span className="mt-1.5 block text-sm leading-snug">{card.antidoteDefinition}</span>
                    {showOriginal ? (
                      <span className="mt-2 block border-t border-line/10 pt-2 text-sm italic leading-snug text-ink-soft">
                        {card.originalAntidote}
                      </span>
                    ) : null}
                  </span>
                </span>
                <span className="flex min-h-11 items-center justify-center gap-1.5 border-t border-line/10 text-sm font-bold text-ocean">
                  {open ? "Hide example" : "See an example"}
                  <span
                    aria-hidden="true"
                    className={`inline-block transition-transform ${open ? "rotate-180" : ""}`}
                  >
                    ▾
                  </span>
                </span>
              </button>
              {open ? (
                <div id={panelId} className="space-y-3 border-t border-line/10 px-4 py-4">
                  <p className="text-sm text-ink-soft">{card.exampleLabel}</p>
                  <div className="rounded-2xl bg-brick/[0.08] px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-brick">Sounds like</p>
                    <p className="mt-1 text-base font-semibold leading-snug">{card.soundsLike}</p>
                  </div>
                  <div className="rounded-2xl bg-leaf/[0.08] px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-leaf">Try instead</p>
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
