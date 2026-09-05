export type Ingredient = {
  id: string;
  item: string;
  group?: string;
};

export type Recipe = {
  slug: string;
  number: string;
  title: string;
  filipino?: string;
  time: string;
  minutes: number;
  serves: string;
  accent: "brick" | "leaf" | "gold" | "ocean" | "ginger" | "chili";
  summary: string;
  ingredients: Ingredient[];
  steps: string[];
  notes?: string[];
};

export type WeekSlot = {
  day: string;
  slug: string | null;
  tag: string;
};

export const dietLine =
  "Dairy-free · wheat-free · low sugar · no honey · no maple · no peanuts";

export const recipes: Recipe[] = [
  {
    slug: "asian-chicken-rice-bowl",
    number: "01",
    title: "Asian Ground Chicken Rice Bowl",
    time: "30 min",
    minutes: 30,
    serves: "2–3",
    accent: "brick",
    summary: "Brown the meat, throw in veg, gloss with a savoury sauce. Dinner over rice.",
    ingredients: [
      { id: "rice", group: "Rice", item: "200 g jasmine rice, uncooked" },
      { id: "meat", group: "Bowl", item: "300–350 g ground chicken or beef" },
      { id: "onion", group: "Bowl", item: "1 onion, diced" },
      { id: "pepper", group: "Bowl", item: "1 red pepper, sliced" },
      { id: "carrots", group: "Bowl", item: "2 carrots, thin sticks" },
      { id: "broccoli", group: "Bowl", item: "1 small head broccoli, florets" },
      { id: "garlic", group: "Bowl", item: "3 garlic cloves, minced" },
      { id: "aminos", group: "Sauce", item: "3 tbsp coconut aminos or GF tamari" },
      { id: "fish", group: "Sauce", item: "1 tsp fish sauce (optional)" },
      { id: "sesame", group: "Sauce", item: "1 tsp toasted sesame oil" },
      { id: "cornflour", group: "Sauce", item: "1 tsp cornflour + 2 tbsp water" },
      { id: "season", group: "Finish", item: "Salt, pepper, chilli flakes" },
      { id: "herbs", group: "Finish", item: "Coriander or spring onion" },
    ],
    steps: [
      "Rinse the rice. Cook as usual. Keep warm.",
      "Hot wide pan. Brown the meat, breaking it up. Salt and pepper.",
      "Add onion. Cook until soft.",
      "Add garlic, carrots, pepper, broccoli. Stir 4–5 min until tender-crisp.",
      "Stir aminos or tamari, optional fish sauce, sesame oil, and cornflour slurry. Pour in. Toss 1 min until glossy.",
      "Taste. Chilli if you want heat. Serve over rice. Herbs on top.",
    ],
  },
  {
    slug: "ginger-sesame-chicken",
    number: "02",
    title: "Ginger–Sesame Chicken & Broccoli",
    time: "20–25 min",
    minutes: 25,
    serves: "2–3",
    accent: "ginger",
    summary: "Hot sear, then a sharp sesame–tamari sauce. No sweetener.",
    ingredients: [
      { id: "chicken", item: "400 g chicken thigh or breast, bite-size" },
      { id: "broccoli", item: "1 large head broccoli, florets" },
      { id: "ginger", item: "1 thumb ginger, grated" },
      { id: "onion", item: "3 spring onions, white and green split" },
      { id: "tamari", item: "3 tbsp GF tamari" },
      { id: "vinegar", item: "1 tbsp rice vinegar" },
      { id: "sesame", item: "1 tsp toasted sesame oil" },
      { id: "slurry", item: "1 tsp cornflour + 3 tbsp water" },
      { id: "oil", item: "Neutral oil, for searing" },
      { id: "pepper", item: "Black pepper" },
    ],
    steps: [
      "Mix tamari, rice vinegar, sesame oil, and cornflour slurry. No sweetener.",
      "Hot pan, a little oil. Sear chicken until browned and just cooked. Set aside.",
      "Same pan: broccoli plus a splash of water. Cover 2–3 min until bright and tender-crisp.",
      "Add ginger and spring onion whites. Stir 30 seconds.",
      "Chicken back in. Pour the sauce. Toss until thick and glossy.",
      "Spring onion greens on top. Serve with rice if you want.",
    ],
    notes: ["Sauce stays savoury — do not add sugar or sweetener."],
  },
  {
    slug: "sinigang-na-hipon",
    number: "03",
    title: "Sinigang na Hipon",
    filipino: "Sour prawn soup",
    time: "30 min",
    minutes: 30,
    serves: "2–3",
    accent: "ocean",
    summary: "Tamarind broth, prawns last. Sour, not sweet.",
    ingredients: [
      { id: "prawns", item: "400 g raw prawns, peeled" },
      { id: "tomato", item: "1 large tomato, wedged" },
      { id: "onion", item: "1 onion, wedged" },
      { id: "patis", item: "2 tbsp fish sauce" },
      { id: "sour", item: "Sugar-free sinigang mix, or 2–3 tbsp tamarind paste" },
      { id: "daikon", item: "200 g daikon (labanos), thick half-moons" },
      { id: "beans", item: "150 g green beans or okra" },
      { id: "greens", item: "2 handfuls greens (kangkong, spinach, or mustard)" },
      { id: "water", item: "1.2 L water" },
      { id: "chilli", item: "1 green chilli (optional)" },
    ],
    steps: [
      "Boil the water. Add onion and tomato. Simmer 5 min.",
      "Add daikon. Cook until just tender, about 8 min.",
      "Stir in tamarind or sugar-free sinigang mix. Season with fish sauce. Taste — sour, not sweet. No sugar.",
      "Add beans or okra. Simmer 3 min.",
      "Prawns in. Cook until just pink, 2–3 min. Do not overcook.",
      "Greens in until wilted. Chilli if you want heat. Serve hot with rice.",
    ],
    notes: ["Use a sugar-free mix or plain tamarind. Skip any packet that lists sugar."],
  },
  {
    slug: "ginisang-hipon",
    number: "04",
    title: "Ginisang Hipon",
    filipino: "Garlic-ginger prawns",
    time: "15 min",
    minutes: 15,
    serves: "2–3",
    accent: "chili",
    summary: "Fast sauté. Garlic, ginger, tamari. No sweet sauce.",
    ingredients: [
      { id: "prawns", item: "400 g raw prawns, peeled" },
      { id: "garlic", item: "4 garlic cloves, minced" },
      { id: "ginger", item: "1 thumb ginger, thin matchsticks" },
      { id: "onion", item: "3 spring onions, sliced" },
      { id: "tamari", item: "2 tbsp GF tamari" },
      { id: "oil", item: "Neutral oil" },
      { id: "pepper", item: "Black pepper" },
    ],
    steps: [
      "Hot pan, a little oil. Garlic and ginger until fragrant — do not burn.",
      "Prawns in. Cook until just pink, turning once.",
      "Splash in tamari. Toss. No sweet sauce.",
      "Spring onion and pepper. 30 seconds more. Eat with rice.",
    ],
  },
  {
    slug: "fish-sinigang",
    number: "05",
    title: "Fish Sinigang",
    filipino: "Sour fish soup",
    time: "30 min",
    minutes: 30,
    serves: "2–3",
    accent: "leaf",
    summary: "Same sour pot as the prawn sinigang. Fish goes in last so it stays in chunks.",
    ingredients: [
      { id: "fish", item: "500 g cod or haddock, large chunks" },
      { id: "tomato", item: "1 large tomato, wedged" },
      { id: "onion", item: "1 onion, wedged" },
      { id: "patis", item: "2 tbsp fish sauce" },
      { id: "sour", item: "Sugar-free sinigang mix, or 2–3 tbsp tamarind paste" },
      { id: "daikon", item: "200 g daikon (labanos), thick half-moons" },
      { id: "beans", item: "150 g green beans or okra" },
      { id: "greens", item: "2 handfuls greens (kangkong, spinach, or mustard)" },
      { id: "water", item: "1.2 L water" },
      { id: "chilli", item: "1 green chilli (optional)" },
    ],
    steps: [
      "Boil the water. Add onion and tomato. Simmer 5 min.",
      "Add daikon. Cook until just tender, about 8 min.",
      "Stir in tamarind or sugar-free sinigang mix. Fish sauce. Taste — sour, not sweet. No sugar.",
      "Add beans or okra. Simmer 3 min.",
      "Fish in last. Gentle simmer 5–6 min until just opaque. Do not stir hard.",
      "Greens in until wilted. Serve hot with rice.",
    ],
    notes: ["Same pot as shrimp sinigang. Fish only needs the last 5–6 minutes."],
  },
  {
    slug: "chicken-tinola",
    number: "06",
    title: "Chicken Tinola",
    filipino: "Ginger chicken soup · buffer",
    time: "40 min",
    minutes: 40,
    serves: "2–3",
    accent: "gold",
    summary: "Ginger broth, soft squash, spinach. Zero sugar. Good leftover pot.",
    ingredients: [
      { id: "chicken", item: "600 g bone-in chicken pieces or thighs" },
      { id: "ginger", item: "1 large thumb ginger, smashed and sliced" },
      { id: "onion", item: "1 onion, sliced" },
      { id: "patis", item: "2 tbsp fish sauce" },
      { id: "squash", item: "2 courgettes or 1 green papaya, chunked" },
      { id: "spinach", item: "2 handfuls spinach" },
      { id: "water", item: "1.2 L water" },
      { id: "pepper", item: "Black pepper" },
    ],
    steps: [
      "Sauté ginger and onion until fragrant.",
      "Add chicken. Light sear. Splash in fish sauce.",
      "Pour in water. Simmer until the chicken is tender, about 25 min.",
      "Add courgette or papaya. Cook 6–8 min until just soft.",
      "Spinach in. Off the heat when wilted. Pepper. Serve with rice.",
    ],
    notes: ["Buffer meal — make a bigger pot and eat again on Sunday."],
  },
];

export const weekPlan: WeekSlot[] = [
  { day: "Mon", slug: "ginisang-hipon", tag: "15 min" },
  { day: "Tue", slug: "ginger-sesame-chicken", tag: "Stir-fry" },
  { day: "Wed", slug: "sinigang-na-hipon", tag: "Sinigang" },
  { day: "Thu", slug: "asian-chicken-rice-bowl", tag: "Bowl" },
  { day: "Fri", slug: "fish-sinigang", tag: "Fish" },
  { day: "Sat", slug: "chicken-tinola", tag: "Buffer" },
  { day: "Sun", slug: "chicken-tinola", tag: "Leftovers" },
];

const bySlug = new Map(recipes.map((recipe) => [recipe.slug, recipe]));

export function getRecipe(slug: string) {
  return bySlug.get(slug);
}

export function getRecipeSlugs() {
  return recipes.map((recipe) => recipe.slug);
}
