"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getRecipe, weekPlan } from "@/lib/recipes";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function WeekPlan() {
  const [today, setToday] = useState<string | null>(null);

  useEffect(() => {
    setToday(dayNames[new Date().getDay()]);
  }, []);

  return (
    <section className="mx-auto max-w-xl px-4 sm:px-6">
      <div className="mb-3 flex items-end justify-between">
        <h2 className="font-display text-2xl font-bold">This week</h2>
        <p className="text-sm font-semibold text-ink-soft">Tap a day</p>
      </div>
      <ol className="overflow-hidden rounded-3xl border-2 border-line/15 bg-cream card-shadow">
        {weekPlan.map((slot, index) => {
          const recipe = slot.slug ? getRecipe(slot.slug) : undefined;
          const isToday = today === slot.day;
          const href = recipe ? `/recipes/${recipe.slug}` : "/";

          return (
            <li key={slot.day} className={index === 0 ? "" : "border-t-2 border-line/10"}>
              <Link
                href={href}
                className={`tap flex items-center gap-3 px-4 py-3 ${
                  isToday ? "bg-gold/20" : ""
                }`}
              >
                <span
                  className={`w-12 shrink-0 text-sm font-extrabold uppercase tracking-wide ${
                    isToday ? "text-brick" : "text-ink-soft"
                  }`}
                >
                  {slot.day}
                </span>
                <span className="min-w-0 flex-1 text-lg font-semibold leading-tight">
                  {recipe?.title ?? "Leftovers"}
                </span>
                <span className="shrink-0 rounded-full bg-paper-deep px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-ink-soft">
                  {slot.tag}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
