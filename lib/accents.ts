import type { Recipe } from "./recipes";

export const accentClass: Record<
  Recipe["accent"],
  { chip: string; bar: string; wash: string }
> = {
  brick: {
    chip: "bg-brick text-cream",
    bar: "bg-brick",
    wash: "bg-brick/12",
  },
  leaf: {
    chip: "bg-leaf text-cream",
    bar: "bg-leaf",
    wash: "bg-leaf/12",
  },
  gold: {
    chip: "bg-gold text-ink",
    bar: "bg-gold",
    wash: "bg-gold/18",
  },
  ocean: {
    chip: "bg-ocean text-cream",
    bar: "bg-ocean",
    wash: "bg-ocean/12",
  },
  ginger: {
    chip: "bg-ginger text-ink",
    bar: "bg-ginger",
    wash: "bg-ginger/18",
  },
  chili: {
    chip: "bg-chili text-cream",
    bar: "bg-chili",
    wash: "bg-chili/12",
  },
};
