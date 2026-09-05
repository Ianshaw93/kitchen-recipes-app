# Kusina

Phone-friendly cooking companion for **Ian & Avery**. One public URL, no login. Open it on both phones while you cook.

Six dairy-free, wheat-free, **low-sugar** recipes. No honey, no maple, no peanuts.

## Recipes

| Day | Dish | Time |
| --- | --- | --- |
| Mon | Ginisang Hipon | 15 min |
| Tue | Ginger–Sesame Chicken & Broccoli | 20–25 min |
| Wed | Sinigang na Hipon | 30 min |
| Thu | Asian Ground Chicken Rice Bowl | 30 min |
| Fri | Fish Sinigang | 30 min |
| Sat / Sun | Chicken Tinola (buffer / leftovers) | 40 min |

Home shows the week plan plus recipe cards. Each recipe has tap-to-tick ingredients and large steps. **Cook mode** is one big step at a time with Next / Back.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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
