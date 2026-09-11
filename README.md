# Kusina

Phone-friendly cooking companion for **Ian & Avery**. One public URL, no login. Open it on both phones while you cook.

Seven dairy-free, wheat-free, **low-sugar** recipes in the bank. No honey, no maple, no peanuts. The default week plan still uses six of them; the bank can also hold imports that are not assigned to a day.

## Recipes

Default week plan:

| Day | Dish | Time |
| --- | --- | --- |
| Mon | Ginisang Hipon | 15 min |
| Tue | Ginger–Sesame Chicken & Broccoli | 20–25 min |
| Wed | Sinigang na Hipon | 30 min |
| Thu | Asian Ground Chicken Rice Bowl | 30 min |
| Fri | Fish Sinigang | 30 min |
| Sat / Sun | Chicken Tinola (buffer / leftovers) | 40 min |

**Bank-only (not on the default week):** Cheat Chicken & Sweetcorn Soup — imported from Instagram [@jimmy_chews](https://www.instagram.com/reel/DdE0bmSoKN8/). Assign it under **Edit week** if you want it on a day.

Home shows the week plan plus every recipe card in the bank. **Edit week** lets you reassign any recipe to any day. That custom plan is stored in the phone’s `localStorage` only — it is per-device until sync exists. **Reset to default** restores the table above.

Each recipe has tap-to-tick ingredients and steps (progress + Clear ticks, stored separately on the device). **Cook mode** is one big step at a time with Next / Back.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Test

```bash
npm test
```

Vitest + Testing Library. The suite is written TDD-style and covers:

- all recipes on the home list (week plan plus bank-only imports)
- ingredients and steps on every detail page
- ingredient checklist toggle
- step checklist toggle, persist, clear, and isolation from ingredient ticks
- cook-mode Next / Back
- no honey, maple, or peanut in recipe content
- week plan default, save, reset, and persisted read in WeekPlan

Watch mode:

```bash
npm run test:watch
```

## Build

```bash
npm run build
npm start
```

## Deploy on Vercel

This is a standard Next.js App Router app. Import the GitHub repo in Vercel (framework preset: Next.js). No environment variables for v1.

On a phone: Share → Add to Home Screen. A PWA manifest is included.

## Stack

Next.js App Router, TypeScript, Tailwind CSS.
