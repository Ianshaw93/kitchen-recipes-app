"use client";

import { type FormEvent, useState } from "react";
import { useTripSavings } from "@/lib/use-trip-savings";
import { formatGbp, parsePounds, type Traveller, type Trip } from "@/lib/trips";

const travellers: Traveller[] = ["Ian", "Abby"];

export function TripSavings({ trip }: { trip: Trip }) {
  const { summary, add } = useTripSavings(trip);
  const [traveller, setTraveller] = useState<Traveller>("Ian");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amountGbp = parsePounds(amount);
    if (!amountGbp) {
      setError("Enter an amount in pounds.");
      return;
    }

    add({ traveller, amountGbp });
    setAmount("");
    setError("");
  }

  return (
    <div>
      <div className="sticky top-0 z-10 -mx-4 mb-6 border-b-2 border-line/10 bg-paper/95 px-4 py-3 sm:-mx-6 sm:px-6">
        <dl className="mx-auto grid max-w-xl grid-cols-3 gap-2 text-center">
          <div>
            <dt className="text-[0.65rem] font-extrabold uppercase tracking-[0.18em] text-ink-soft">
              On-ground
            </dt>
            <dd className="font-display text-lg font-bold">{formatGbp(summary.targetGbp)}</dd>
          </div>
          <div>
            <dt className="text-[0.65rem] font-extrabold uppercase tracking-[0.18em] text-ink-soft">
              Saved
            </dt>
            <dd className="font-display text-lg font-bold">Saved {formatGbp(summary.combinedGbp)}</dd>
          </div>
          <div>
            <dt className="text-[0.65rem] font-extrabold uppercase tracking-[0.18em] text-ink-soft">
              Gap
            </dt>
            <dd className="font-display text-lg font-bold">Gap {formatGbp(summary.gapGbp)}</dd>
          </div>
        </dl>
      </div>

      <section>
        <h2 className="font-display text-2xl font-bold">Shared savings</h2>
        <p className="mt-1 text-sm font-semibold text-ink-soft">
          Manual log, both phones. No bank sync. Abby-soft split — not 50/50.
        </p>

        <div
          className="mt-4 flex h-4 overflow-hidden rounded-full border-2 border-line/15 bg-paper-deep"
          role="group"
          aria-label={`Ian ${formatGbp(summary.ianSavedGbp)}, Abby ${formatGbp(summary.abbySavedGbp)}, remaining ${formatGbp(summary.remainingGbp)} of ${formatGbp(summary.targetGbp)}`}
        >
          <span className="bg-ocean" style={{ width: `${summary.ianPct}%` }} />
          <span className="bg-gold" style={{ width: `${summary.abbyPct}%` }} />
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-xs font-extrabold uppercase tracking-wide text-ink-soft">
          <span>
            <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-ocean" />
            Ian
          </span>
          <span>
            <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-gold" />
            Abby
          </span>
          <span>
            <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-paper-deep" />
            Remaining
          </span>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-3xl border-2 border-line/15 bg-cream px-4 py-3">
            <dt className="text-sm font-semibold text-ink-soft">Ian saved</dt>
            <dd className="font-display text-2xl font-bold">{formatGbp(summary.ianSavedGbp)}</dd>
            <p className="text-xs font-semibold text-ink-soft">
              Target {formatGbp(summary.ianShareOfTargetGbp)}
            </p>
          </div>
          <div className="rounded-3xl border-2 border-line/15 bg-cream px-4 py-3">
            <dt className="text-sm font-semibold text-ink-soft">Abby saved</dt>
            <dd className="font-display text-2xl font-bold">{formatGbp(summary.abbySavedGbp)}</dd>
            <p className="text-xs font-semibold text-ink-soft">
              Target {formatGbp(summary.abbyShareOfTargetGbp)}
            </p>
          </div>
          <div className="rounded-3xl border-2 border-line/15 bg-cream px-4 py-3">
            <dt className="text-sm font-semibold text-ink-soft">Combined</dt>
            <dd className="font-display text-2xl font-bold">{formatGbp(summary.combinedGbp)}</dd>
          </div>
          <div className="rounded-3xl border-2 border-gold/40 bg-gold/15 px-4 py-3">
            <dt className="text-sm font-semibold text-ink-soft">Target</dt>
            <dd className="font-display text-2xl font-bold">{formatGbp(summary.targetGbp)}</dd>
          </div>
        </dl>
      </section>

      <aside className="mt-6 rounded-3xl border-2 border-brick/30 bg-brick/10 px-4 py-4">
        <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.22em] text-brick">Buffer</p>
        <p className="mt-1 font-display text-2xl font-bold">
          Target − Saved = Gap
        </p>
        <p className="mt-1 text-base font-semibold leading-snug">
          {formatGbp(summary.targetGbp)} − {formatGbp(summary.combinedGbp)} ={" "}
          <span className="font-extrabold">{formatGbp(summary.gapGbp)}</span>
        </p>
        <p className="mt-2 text-sm font-semibold text-ink-soft">
          Contingency is its own category below, not buried in Misc. The £2,000 band stays
          visible.
        </p>
      </aside>

      <form onSubmit={onSubmit} className="mt-6">
        <fieldset>
          <legend className="text-sm font-extrabold uppercase tracking-wide text-ink-soft">
            Who saved
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {travellers.map((person) => {
              const selected = traveller === person;
              return (
                <button
                  key={person}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setTraveller(person)}
                  className={`tap rounded-2xl border-2 text-xl font-extrabold ${
                    selected
                      ? "border-brick bg-brick text-cream"
                      : "border-line/20 bg-cream text-ink"
                  }`}
                >
                  {person}
                </button>
              );
            })}
          </div>
        </fieldset>
        <label className="mt-4 block">
          <span className="text-sm font-extrabold uppercase tracking-wide text-ink-soft">
            Amount (£)
          </span>
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="50"
            className="tap mt-2 w-full rounded-2xl border-2 border-line/20 bg-cream px-4 text-lg font-semibold text-ink"
          />
        </label>
        {error ? (
          <p className="mt-3 text-base font-bold text-brick" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          className="tap mt-4 w-full rounded-2xl bg-ocean text-xl font-extrabold text-cream"
        >
          Add contribution
        </button>
      </form>
    </div>
  );
}
