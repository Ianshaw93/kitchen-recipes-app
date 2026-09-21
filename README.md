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

**Payments** (`/payments`, linked from the header) is a **shared** settle-up page for Ian & Avery: log what either of you bought, see who is owed half, and delete mistakes. Both phones read and write the same ledger through `/api/payments` (Upstash Redis / Vercel KV). `localStorage` is only an offline cache, not the source of truth.

### Shared payments setup (required on Vercel)

Payments will not persist across phones until Redis is configured. On the Vercel free tier, add **Upstash Redis** (Storage / Marketplace). That injects:

| Env var | Where | Purpose |
| --- | --- | --- |
| `UPSTASH_REDIS_REST_URL` | Server | Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Server | Redis REST token |

Legacy Vercel KV names also work if that is what the store already injected:

| Env var | Where | Purpose |
| --- | --- | --- |
| `KV_REST_API_URL` | Server | Same as Upstash URL |
| `KV_REST_API_TOKEN` | Server | Same as Upstash token |

Optional but recommended so random visitors cannot wipe the ledger. Use the **same random string** for both:

| Env var | Where | Purpose |
| --- | --- | --- |
| `PAYMENTS_HOUSEHOLD_TOKEN` | Server | Required on GET/POST/DELETE (`Authorization: Bearer …`, `x-payments-token`, or `?token=`) |
| `NEXT_PUBLIC_PAYMENTS_TOKEN` | Client (baked into the JS bundle at **build** time) | Both phones send this automatically — no login, no PIN prompt |

1. Vercel → kitchen-recipes-app → **Storage** → create **Upstash Redis** (free) and link it to the project.  
2. Vercel → **Settings → Environment Variables** → add `PAYMENTS_HOUSEHOLD_TOKEN` and `NEXT_PUBLIC_PAYMENTS_TOKEN` with the same value (Production + Preview).  
3. **Redeploy** (env vars, especially `NEXT_PUBLIC_*`, are applied at build time).  
4. Open [https://kitchen-recipes-app.vercel.app/payments](https://kitchen-recipes-app.vercel.app/payments) on both phones. The first request seeds:

   - Ian, £57.60, Asda shop (17 Sep 2026) — delivery note for 18 Millhouse Drive  
   - Ian, £72.00, Car oil change (21 Sep 2026)

After that, adds/deletes on one phone show on the other after refresh (or immediately if you already have the page open and you reload).

Prove the seed from a terminal (use the same token you set, or omit `-H` if you skipped the household token):

```bash
curl -sS https://kitchen-recipes-app.vercel.app/api/payments \
  -H "Authorization: Bearer $NEXT_PUBLIC_PAYMENTS_TOKEN"
```

You should see both `Asda shop` and `Car oil change`. Local `next dev` without Redis uses an in-memory store (lost on restart, not shared). Production returns `503` until Redis env vars are set.

### Payments query import

Chat (or any link) can add a spend on the **shared** ledger. After `/payments` loads from the API, a valid query is POSTed once, then the URL is replaced with `/payments` so a refresh does not double-add. If the same `paidBy` + amount + description + date is already logged (including the seeded Asda shop), the add is skipped and the params are still stripped.

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
- payments add, 50/50 balance, delete, shared API load/seed, `/payments` render, one-tap query-param import (parse, POST, no double-add), and Redis/token helpers

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

This is a standard Next.js App Router app. Import the GitHub repo in Vercel (framework preset: Next.js).

**Payments (both phones):** create Upstash Redis, set `PAYMENTS_HOUSEHOLD_TOKEN` + `NEXT_PUBLIC_PAYMENTS_TOKEN` to the same secret, then redeploy. See [Shared payments setup](#shared-payments-setup-required-on-vercel) above. Until Redis is linked, `/api/payments` returns 503 in production.

On a phone: Share → Add to Home Screen. A PWA manifest is included.

## Stack

Next.js App Router, TypeScript, Tailwind CSS.
