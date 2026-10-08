import type { MetadataRoute } from "next";
import { recipes } from "@/lib/recipes";

const ORIGIN = "https://kitchen-recipes-app.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["/", "/shop", "/homes", "/payments", ...recipes.map((recipe) => `/recipes/${recipe.slug}`)];
  return paths.map((path) => ({
    url: `${ORIGIN}${path === "/" ? "/" : path}`,
  }));
}
