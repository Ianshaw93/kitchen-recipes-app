import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CookMode } from "@/components/CookMode";
import { getRecipe, getRecipeSlugs } from "@/lib/recipes";

export function generateStaticParams() {
  return getRecipeSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/recipes/[slug]/cook">): Promise<Metadata> {
  const { slug } = await params;
  const recipe = getRecipe(slug);
  return {
    title: recipe ? `Cook · ${recipe.title}` : "Cook",
  };
}

export default async function CookPage({
  params,
}: PageProps<"/recipes/[slug]/cook">) {
  const { slug } = await params;
  const recipe = getRecipe(slug);
  if (!recipe) {
    notFound();
  }

  return <CookMode recipe={recipe} />;
}
