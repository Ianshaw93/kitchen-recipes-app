import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IngredientList } from "@/components/IngredientList";
import { RecipeMark } from "@/components/RecipeMark";
import { SiteHeader } from "@/components/SiteHeader";
import { accentClass } from "@/lib/accents";
import { getRecipe, getRecipeSlugs } from "@/lib/recipes";

export function generateStaticParams() {
  return getRecipeSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/recipes/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const recipe = getRecipe(slug);
  if (!recipe) {
    return { title: "Recipe" };
  }
  return {
    title: recipe.title,
    description: recipe.summary,
  };
}

export default async function RecipePage({
  params,
}: PageProps<"/recipes/[slug]">) {
  const { slug } = await params;
  const recipe = getRecipe(slug);
  if (!recipe) {
    notFound();
  }

  const accent = accentClass[recipe.accent];

  return (
    <div className="pb-28">
      <SiteHeader compact />
      <article className="mx-auto max-w-xl px-4 sm:px-6">
        <div className={`rounded-3xl border-2 border-line/15 ${accent.wash} px-5 py-6`}>
          <div className="flex items-start gap-3">
            <RecipeMark accent={recipe.accent} className="h-16 w-16 shrink-0" />
            <div>
              <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.22em] text-ink-soft">
                No. {recipe.number}
              </p>
              <h1 className="font-display text-3xl font-bold leading-tight">
                {recipe.title}
              </h1>
              {recipe.filipino ? (
                <p className="mt-1 text-base font-semibold text-ink-soft">
                  {recipe.filipino}
                </p>
              ) : null}
            </div>
          </div>
          <p className="mt-4 text-lg font-semibold leading-snug">{recipe.summary}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1.5 text-sm font-extrabold ${accent.chip}`}>
              {recipe.time}
            </span>
            <span className="rounded-full bg-cream px-3 py-1.5 text-sm font-extrabold text-ink">
              Serves {recipe.serves}
            </span>
            <span className="rounded-full bg-cream px-3 py-1.5 text-sm font-extrabold text-ink">
              Low sugar
            </span>
          </div>
        </div>

        <div className="mt-8">
          <IngredientList slug={recipe.slug} ingredients={recipe.ingredients} />
        </div>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold">Steps</h2>
          <ol className="mt-3 space-y-3">
            {recipe.steps.map((step, index) => (
              <li
                key={step}
                className="rounded-3xl border-2 border-line/15 bg-cream px-4 py-4"
              >
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brick">
                  Step {index + 1}
                </p>
                <p className="mt-1 text-xl font-semibold leading-snug">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        {recipe.notes?.length ? (
          <aside className="mt-8 rounded-3xl border-2 border-gold/40 bg-gold/15 px-4 py-4">
            {recipe.notes.map((note) => (
              <p key={note} className="text-base font-semibold leading-snug">
                {note}
              </p>
            ))}
          </aside>
        ) : null}
      </article>

      <div className="fixed inset-x-0 bottom-0 border-t-2 border-line/10 bg-paper/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Link
          href={`/recipes/${recipe.slug}/cook`}
          className="tap mx-auto flex max-w-xl items-center justify-center rounded-2xl bg-brick text-xl font-extrabold text-cream"
        >
          Cook mode
        </Link>
      </div>
    </div>
  );
}
