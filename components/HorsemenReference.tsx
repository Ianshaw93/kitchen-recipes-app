"use client";

import { useState } from "react";
import { HORSEMEN } from "@/lib/horsemen";

const CARD_HEADING = "flex items-center gap-2 text-[1.0625rem] font-extrabold uppercase leading-tight tracking-wide";
const HALF_LABEL = "text-xs font-bold uppercase tracking-[0.16em] text-ink-soft";

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
          Four Horsemen and what to do instead
        </h2>
        <p className="mt-2 text-base leading-relaxed text-ink-soft">
          {framing === "journal"
            ? "Spot the pattern in your own writing. Name the pattern, not the person."
            : "Name the pattern, not the person."}{" "}
          Each one has a positive to reach for.
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

      <ul className="space-y-4">
        {HORSEMEN.map((card) => {
          const open = openId === card.id;
          const panelId = `horseman-${card.id}`;
          return (
            <li key={card.id}>
              <article
                aria-labelledby={`${panelId}-name`}
                className={`overflow-hidden rounded-3xl border bg-cream card-shadow transition-colors ${
                  open ? "border-line/25" : "border-line/10"
                }`}
              >
                <div className="bg-brick/[0.08] px-4 pt-4 pb-4">
                  <p className={HALF_LABEL}>Horseman</p>
                  <h3 id={`${panelId}-name`} className={`mt-1.5 ${CARD_HEADING}`}>
                    <span className="text-xl leading-none" aria-hidden="true">
                      {card.icon}
                    </span>
                    <span className="text-brick">{card.horseman}</span>
                  </h3>
                  <p className="mt-2 text-base leading-snug">{card.definition}</p>
                  {showOriginal ? (
                    <p className="mt-3 border-t border-brick/15 pt-3 text-sm italic leading-snug text-ink-soft">
                      {card.originalDefinition}
                    </p>
                  ) : null}
                </div>

                <div className="border-t border-line/10 bg-leaf/[0.09] px-4 pt-4 pb-4">
                  <p className={HALF_LABEL}>Do this instead</p>
                  <h3 className={`mt-1.5 ${CARD_HEADING}`}>
                    <span
                      aria-hidden="true"
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-leaf text-xs text-cream"
                    >
                      ✓
                    </span>
                    <span className="text-leaf">{card.positive}</span>
                  </h3>
                  <dl className="mt-3 space-y-3">
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-wide text-leaf">What it looks like</dt>
                      <dd className="mt-0.5 text-base leading-snug">{card.positiveLooksLike}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-wide text-leaf">Say it like</dt>
                      <dd className="mt-1 rounded-2xl bg-cream/80 px-3 py-2.5 text-base font-semibold leading-snug">
                        {card.sayItLike}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-wide text-leaf">Everyday habit</dt>
                      <dd className="mt-0.5 text-base leading-snug">{card.everydayHabit}</dd>
                    </div>
                  </dl>
                  {showOriginal ? (
                    <div className="mt-3 border-t border-leaf/20 pt-3 text-sm leading-snug text-ink-soft">
                      <p className="font-bold not-italic">{`Gottman's antidote: ${card.gottmanAntidote}`}</p>
                      <p className="mt-1 italic">{card.originalAntidote}</p>
                    </div>
                  ) : null}
                </div>

                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => setOpenId(open ? null : card.id)}
                  className="flex min-h-12 w-full items-center justify-center gap-1.5 border-t border-line/10 text-sm font-bold text-ocean"
                >
                  {open ? "Hide example" : "See an example"}{" "}
                  <span className="sr-only">of {card.horseman}</span>
                  <span
                    aria-hidden="true"
                    className={`inline-block transition-transform ${open ? "rotate-180" : ""}`}
                  >
                    ▾
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
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
