"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getRecipe, recipes, weekPlan } from "@/lib/recipes";
import {
  assignRecipeToDay,
  loadWeekPlan,
  resetWeekPlan,
  saveWeekPlan,
} from "@/lib/week-plan";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function WeekPlan() {
  const [today, setToday] = useState<string | null>(null);
  const [plan, setPlan] = useState(weekPlan);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setToday(dayNames[new Date().getDay()]);
    setPlan(loadWeekPlan());
  }, []);

  function assignDay(day: string, slug: string) {
    setPlan((current) => {
      const next = assignRecipeToDay(current, day, slug);
      saveWeekPlan(next);
      return next;
    });
  }

  function reset() {
    setPlan(resetWeekPlan());
  }

  return (
    <section className="mx-auto max-w-xl px-4 sm:px-6">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">This week</h2>
          <p className="text-sm font-semibold text-ink-soft">
            {editing ? "Pick a dish for each day" : "Tap a day"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing((current) => !current)}
          className="tap rounded-full border-2 border-line/20 bg-cream px-4 text-sm font-extrabold uppercase tracking-wide text-ink"
        >
          {editing ? "Done" : "Edit week"}
        </button>
      </div>
      <ol className="overflow-hidden rounded-3xl border-2 border-line/15 bg-cream card-shadow">
        {plan.map((slot, index) => {
          const recipe = slot.slug ? getRecipe(slot.slug) : undefined;
          const isToday = today === slot.day;
          const href = recipe ? `/recipes/${recipe.slug}` : "/";

          return (
            <li key={slot.day} className={index === 0 ? "" : "border-t-2 border-line/10"}>
              {editing ? (
                <div
                  className={`flex items-center gap-3 px-4 py-3 ${isToday ? "bg-gold/20" : ""}`}
                >
                  <span
                    className={`w-12 shrink-0 text-sm font-extrabold uppercase tracking-wide ${
                      isToday ? "text-brick" : "text-ink-soft"
                    }`}
                  >
                    {slot.day}
                  </span>
                  <label className="min-w-0 flex-1">
                    <span className="sr-only">Recipe for {slot.day}</span>
                    <select
                      value={slot.slug ?? ""}
                      onChange={(event) => assignDay(slot.day, event.target.value)}
                      className="tap w-full rounded-2xl border-2 border-line/20 bg-paper px-3 text-base font-semibold leading-tight text-ink"
                    >
                      {recipes.map((option) => (
                        <option key={option.slug} value={option.slug}>
                          {option.title}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : (
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
              )}
            </li>
          );
        })}
      </ol>
      {editing ? (
        <button
          type="button"
          onClick={reset}
          className="tap mt-3 w-full rounded-full px-3 text-sm font-bold text-brick underline-offset-4 hover:underline"
        >
          Reset to default
        </button>
      ) : null}
    </section>
  );
}
