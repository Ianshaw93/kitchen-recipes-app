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

**Payments** (`/payments`, linked from the header) is a separate settle-up page: log what Ian or Avery bought for the house, see who is owed half, and delete mistakes. Same `localStorage` caveat as the week plan — each phone keeps its own list. There is no login or cloud sync.

**Trips** (`/trips`, also in the header) is a first-class area next to recipes. Seed data lives in `lib/trips.ts` (no database yet). First trip: **Thailand (honey / baby moon)** at `/trips/thailand` — Ian + Abby, ~2 weeks, planning.

Thailand detail shows shared savings (Ian / Abby / Combined vs the selected **Buffer £2,000** target, Abby-soft 60/40), a buffer gap callout, on-ground bands (lean £1,200 / comfort £1,500 / buffer £2,000), flights as a paid strip outside the save-target, budget **by category** (rooms 40% · food 25% · local transport 15% · activities 10% · misc 5% · contingency 5%) and **by place** (Bangkok → overnight sleeper → Chiang Mai → Chiang Rai, with Koh Kood as the island alt). Place photos are Unsplash URLs. Optional extra contributions save in `localStorage` on that phone only. Spend on RBS Platinum joint + Going Abroad (0% FX). No live bank sync or bookings in v1.

### Payments query import

Chat (or any link) can add a spend on the phone that opens it. After `/payments` hydrates, a valid query is written once into `localStorage`, then the URL is replaced with `/payments` so a refresh does not double-add. If the same `paidBy` + amount + description + date is already logged, the add is skipped and the params are still stripped.

Example:

```
/payments?paidBy=Ian&amount=57.60&description=Asda%20shop&date=2026-09-17&note=Delivery%20Fri%2018%20Sep%202026%2C%202%E2%80%933pm%20%C2%B7%2018%20Millhouse%20Drive%2C%20G20%200UE
```

| Param | Required | Notes |
| --- | --- | --- |
| `paidBy` | yes | `Ian` or `Avery` |
| `amount` | yes | Pounds string, e.g. `57.60` (same parsing as the form) |
| `description` | yes | What it was for |
| `date` | no | `YYYY-MM-DD`. Defaults to today |
| `note` | no | Extra detail |

A short banner appears when an entry is added, e.g. `Added: Asda shop £57.60 (Ian)`.

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
- payments add, 50/50 balance, delete, localStorage load, `/payments` render, and one-tap query-param import (parse, add, no double-add)
- trips seed (Thailand budget bands, savings, category/leg splits), `/trips` list, `/trips/thailand` detail (savings + buffer gap + photos), header Trips nav, and local contribution add

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
