import { RecipeCard } from "@/components/RecipeCard";
import { SiteHeader } from "@/components/SiteHeader";
import { WeekPlan } from "@/components/WeekPlan";
import { recipes } from "@/lib/recipes";

export default function Home() {
  return (
    <div className="pb-16">
      <SiteHeader />
      <WeekPlan />
      <section className="mx-auto mt-10 max-w-xl px-4 sm:px-6">
        <h2 className="font-display text-2xl font-bold">All recipes</h2>
        <p className="mt-1 text-sm font-semibold text-ink-soft">
          Six weeknight plates. Open the same link on either phone.
        </p>
        <ul className="mt-4 space-y-3">
          {recipes.map((recipe) => (
            <li key={recipe.slug}>
              <RecipeCard recipe={recipe} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
