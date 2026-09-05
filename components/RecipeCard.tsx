import Link from "next/link";
import { accentClass } from "@/lib/accents";
import type { Recipe } from "@/lib/recipes";
import { RecipeMark } from "./RecipeMark";

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const accent = accentClass[recipe.accent];

  return (
    <Link
      href={`/recipes/${recipe.slug}`}
      className="card-shadow tap flex min-h-[7.5rem] items-stretch overflow-hidden rounded-3xl border-2 border-line/15 bg-cream"
    >
      <span className={`w-2 shrink-0 ${accent.bar}`} aria-hidden="true" />
      <div className="flex flex-1 items-center gap-3 px-4 py-4">
        <RecipeMark accent={recipe.accent} className="h-14 w-14 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.2em] text-ink-soft">
            No. {recipe.number}
          </p>
          <h3 className="font-display text-xl font-bold leading-tight">{recipe.title}</h3>
          <p className="mt-1 text-sm font-semibold text-ink-soft">
            {recipe.time} · {recipe.serves}
            {recipe.filipino ? ` · ${recipe.filipino}` : ""}
          </p>
        </div>
      </div>
    </Link>
  );
}
