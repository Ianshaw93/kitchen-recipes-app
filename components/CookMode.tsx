"use client";

import Link from "next/link";
import { useState } from "react";
import type { Recipe } from "@/lib/recipes";

export function CookMode({ recipe }: { recipe: Recipe }) {
  const [step, setStep] = useState(0);
  const total = recipe.steps.length;
  const last = step === total - 1;
  const first = step === 0;

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="flex items-center justify-between gap-3 px-4 pt-5 pb-2">
        <Link
          href={`/recipes/${recipe.slug}`}
          className="tap inline-flex items-center rounded-full px-1 text-base font-bold text-brick"
        >
          ← Recipe
        </Link>
        <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-ink-soft">
          Step {step + 1} / {total}
        </p>
      </header>

      <div className="px-4">
        <div className="h-2 overflow-hidden rounded-full bg-paper-deep">
          <div
            className="h-full bg-brick transition-[width] duration-300"
            style={{ width: `${((step + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-5 py-8">
        <p className="font-display text-6xl font-bold leading-none text-brick/30">
          {String(step + 1).padStart(2, "0")}
        </p>
        <p className="mt-4 font-display text-3xl font-bold leading-snug text-ink sm:text-4xl">
          {recipe.steps[step]}
        </p>
      </main>

      <div className="sticky bottom-0 border-t-2 border-line/10 bg-paper/95 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto grid max-w-xl grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setStep((value) => Math.max(0, value - 1))}
            disabled={first}
            className="tap rounded-2xl border-2 border-line/20 bg-cream text-xl font-extrabold text-ink disabled:opacity-35"
          >
            Back
          </button>
          {last ? (
            <Link
              href={`/recipes/${recipe.slug}`}
              className="tap flex items-center justify-center rounded-2xl bg-leaf text-xl font-extrabold text-cream"
            >
              Done
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setStep((value) => Math.min(total - 1, value + 1))}
              className="tap rounded-2xl bg-brick text-xl font-extrabold text-cream"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
