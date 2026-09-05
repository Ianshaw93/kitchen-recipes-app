import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kusina — Ian & Avery",
    short_name: "Kusina",
    description:
      "Kitchen recipes for Ian and Avery. Dairy-free, wheat-free, low sugar.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6e6c8",
    theme_color: "#a83214",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
