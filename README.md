# CAIRN

**IS216 Web Application Development II · Section G6 · Team T6 "Cairns"**

CAIRN tells hikers whether a Southeast Asian trek matches their ability *before* they go,
what conditions to expect, and exactly what to pack.

> Between 2016 and 2024, Mount Rinjani National Park alone recorded 273 climbing accidents,
> 17 deaths and over 200 injuries, which officials linked to gaps in route awareness and
> preparation rather than the terrain alone. Trekkers still piece together trail info, weather
> and packing lists from scattered sources, or skip that research entirely for trips that look
> short on paper. CAIRN brings all of it into one place.

| | |
|---|---|
| **Live app** | _TODO: add the Vercel URL once deployed_ |
| **Git repo** | https://github.com/zacchaeus-tan/WAD2 |
| **Presentation video** | _TODO: add the YouTube link (also goes on the title slide)_ |
| **Dummy accounts** | See [Test accounts](#test-accounts) |

---

## Contents

1. [Features](#features)
2. [Project requirements checklist](#project-requirements-checklist)
3. [Tech stack](#tech-stack)
4. [Architecture: no Express, Supabase only](#architecture-no-express-supabase-only)
5. [Repository layout](#repository-layout)
6. [What goes in each folder](#what-goes-in-each-folder)
7. [Database](#database)
8. [Getting started](#getting-started)
9. [npm scripts](#npm-scripts)
10. [Testing](#testing)
11. [Deployment](#deployment)
12. [Team and ownership](#team-and-ownership)
13. [Working conventions](#working-conventions)
14. [Third-party code, data and credits](#third-party-code-data-and-credits)
15. [Roadmap and open items](#roadmap-and-open-items)

---

## Features

The five features come from our project proposal. Each row shows where the code lives,
so you can jump straight to it.

| # | Feature (proposal) | What it does | Main code |
|---|---|---|---|
| 1 | **Automated difficulty matching** | An onboarding quiz produces a 0–100 fitness score (weighted formula). Each route has a 0–100 demand score from distance, elevation gain, altitude, duration and effective difficulty. The gap between the two gives the verdict (*comfortable / good match / stretch / not ready*). An explanation and up to three tips are layered on top; the LLM will write these later, but it never changes the verdict. | `views/QuizView.vue`, `components/matching/`, `stores/match.js`, `services/matching.service.js` (`calcFitnessScore`, `calcRouteDemand`, `calcMatchVerdict`), `supabase/functions/match-explain/` |
| 2 | **Auto-generated gear checklist** | Builds a packing list from the route, the forecast and the user's experience, with quantities and a reason for each item. Users save it to their profile, then add, edit, remove and tick off items. | `components/checklist/`, `stores/checklist.js`, `services/checklist.service.js`, `supabase/functions/generate-checklist/` |
| 3 | **Live weather and safety flags** | Current conditions and a 5-day forecast at the trailhead coordinates, from the Open-Meteo public API. Each route also has an admin-curated status (*open / caution / closed*) with a reason. | `components/weather/`, `services/weather.service.js`, `components/admin/SafetyStatusTable.vue` |
| 4 | **Community ratings feeding recommendations** | Star rating, written review, completion flag and a "how hard did it actually feel" rating, plus up to three structured incident notes pinned to a checkpoint. After every review change, the `recalc-route-stats` Edge Function recomputes the route's averages, *effective difficulty* and *community hazard level*, and feature 1 uses these. | `components/reviews/`, `stores/reviews.js`, `services/reviews.service.js`, `supabase/functions/recalc-route-stats/`, `supabase/functions/_shared/route-stats.js` |
| 5 | **Day-by-day itinerary** | Breaks a trek into daily segments: distance, gain/loss, hours, overnight stop, altitude and facilities. Community warnings appear on the day they apply to. | `components/itinerary/`, `routes.service.js` (`itinerary_days`, `route_points`) |
| – | **Routes globe** | Interactive 3D globe (MapLibre) with every route coloured by difficulty, filters, and an optional layer of all mapped OpenStreetMap trails. | `views/RoutesGlobe.vue`, `routes.service.js` |
| – | **Admin console** | Admins set safety status and moderate reviews and incident notes. | `views/AdminView.vue`, `components/admin/`, `services/admin.service.js` |

---

## Project requirements checklist

How CAIRN meets each minimum requirement in the IS216 Group Project Briefing.
Keep this table current; it maps directly onto the presentation contents and the rubric.

| Requirement (briefing) | How we meet it | Status |
|---|---|---|
| Identify and solve a real problem | Trek preparation and safety in SEA (see the intro) | ✅ |
| HTML, CSS, JS | Vue SFCs, `index.html` entry page | ✅ |
| Bootstrap, Vue or alternatives | Vue 3 + Vue Router + Pinia; Bootstrap 5.3 (CDN in `index.html`) | ✅ |
| Responsive design and UI patterns | Bootstrap grid and utilities. Must be checked from iPhone 6 (375px) up to Bootstrap XL in Chrome DevTools | 🟡 audit before submission |
| Dynamic: interacts with a backend data store | Supabase (Postgres + Auth + Storage + RLS) through `@supabase/supabase-js` | ✅ |
| User authentication | Supabase Auth (email + password); `profiles` row created on first sign-in | ✅ |
| At least one external public API (async HTTP) | **Open-Meteo** forecast API (`services/weather.service.js`); OpenFreeMap map tiles | ✅ |
| E2E testing (Playwright or alternatives) | `tests/e2e/` with Playwright | ❌ not set up yet |
| Collaborate using GitHub | Feature branches + pull requests on `zacchaeus-tan/WAD2` | ✅ |
| Deploy to cloud | Vercel | ❌ not deployed yet |
| `index.html` as the entry page | Vite builds `dist/index.html` | ✅ |
| README with setup, live URL, git URL, dummy accounts | This file | 🟡 fill in the TODOs |
| Faculty and instructor added to the repo; members use SMU emails | GitHub settings | ⬜ check |

---

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Vue 3 (`<script setup>`), Vue Router 5, Pinia 4 | Covered in the course; SFCs keep each feature self-contained |
| Styling | Bootstrap 5.3 | Responsive grid and components with no build step |
| Maps | MapLibre GL 6 + OpenFreeMap tiles | Free, keyless 3D globe |
| Backend | Supabase: Postgres, Auth, Storage, Row Level Security | Replaces a hand-written Express server |
| Server-side code | Supabase Edge Functions (Deno) | Keeps the LLM API key off the browser |
| External API | Open-Meteo | Free, keyless, coordinate-level forecasts |
| Build | Vite 8 | Fast dev server; outputs a static site |
| Testing | Playwright (planned) | E2E requirement |
| Hosting | Vercel (planned) | Static hosting with Git deploys, as in the exemplar project |

Node `^22.18.0 || >=24.12.0` is required (see `package.json` → `engines`).

---

## Architecture: no Express, Supabase only

There is **no Express/Node server**. The browser talks to Supabase directly with the official
`@supabase/supabase-js` client.

Two team rules shape everything below:
1. **The database is built on the Supabase website** (Table Editor, Authentication → Policies,
   SQL editor). The repo keeps a read-only record of it in `supabase/schema.sql`.
2. **Logic lives in JS files.** Scoring, matching and stats are JavaScript in `src/services/`
   or in Edge Functions, not SQL functions or triggers.

Security still comes from **Row Level Security policies** in the database. Code in `src/` runs in
the user's browser, so users can skip or change it, and only the database can enforce who may read
or write what. Logic that writes **shared** data (community stats on `routes`) therefore runs in an
Edge Function, a JS/TS file executed on Supabase's servers, which users cannot change.

```
┌──────────────────────── Browser (Vue) ─────────────────────────┐
│                                                                │
│  views/  ──►  components/  ──►  stores/ (Pinia state)          │
│                                     │                          │
│                                     ▼                          │
│                              services/*.service.js             │
│                 (the ONLY place that calls Supabase or APIs)   │
└───────────┬───────────────────────┬─────────────────┬──────────┘
            │ supabase.from()       │ functions.invoke│ fetch()
            ▼                       ▼                 ▼
   ┌─────────────────┐   ┌──────────────────────┐  ┌──────────────┐
   │ Supabase        │   │ Edge Functions       │  │ Open-Meteo   │
   │ Postgres + RLS  │◄──│ recalc-route-stats   │  │ (public API) │
   │ Auth · Storage  │   │  (service-role key)  │  └──────────────┘
   └─────────────────┘   │ match-explain,       │
                         │ generate-checklist   │──► LLM provider
                         │  (LLM key)           │
                         └──────────────────────┘
```

Example: generating a checklist on a route page.

```
RouteDetail.vue
  └─ <ChecklistPanel>                         components/checklist/
       └─ checklistStore.generate()           stores/checklist.js
            ├─ checklistService.upsertChecklist()      → supabase.from('checklists')
            ├─ checklistService.generateChecklistItems() → rules today,
            │                                     functions.invoke('generate-checklist') later
            └─ checklistService.insertItems()          → supabase.from('checklist_items')
```

**Where logic lives:**

| Kind of logic | Lives in | Example |
|---|---|---|
| Logic that only affects the user's own data | `src/services/` (browser JS) | `calcFitnessScore`, `calcRouteDemand`, `calcMatchVerdict` |
| Logic that writes **shared** data, or needs a secret key | Edge Functions (server JS/TS) | `recalc-route-stats` (community stats); LLM calls |
| Who can read and write what | RLS policies, set on the Supabase website | Users edit only their own reviews; only admins change `safety_status`; nobody but the Edge Function writes route stats |
| Data access | `src/services/` | `getRoute(id)`, `upsertReview(...)` |
| UI state and orchestration | `src/stores/` | `loading`, `error`, current checklist |
| Presentation | `src/components/`, `src/views/` | Badges, forms, tables |

**Rule of thumb:** if a user could cheat by editing the calculation in DevTools, and that would
affect *other* users, the calculation belongs in an Edge Function rather than in `src/`.

---

## Repository layout

```
WAD2/
├── index.html                  # Entry page (Bootstrap CDN + #app mount point)
├── package.json                # Dependencies and npm scripts
├── vite.config.js              # Vite + Vue plugin, "@" → src alias
├── jsconfig.json               # Editor path alias for "@/"
├── .env.example                # Template for .env.local; never commit real keys
│
├── public/                     # Static files copied as-is into the build
├── src/                        # Vue application
│   ├── main.js                 #   Creates the app, installs Pinia + router
│   ├── App.vue                 #   App shell: navbar + <RouterView>
│   ├── router/                 #   URL → view mapping
│   ├── lib/                    #   Supabase client + pure helpers
│   ├── services/               #   All Supabase / external API calls
│   ├── stores/                 #   Pinia stores (state + actions)
│   ├── views/                  #   One file per page/route
│   └── components/             #   Reusable UI, grouped by feature
│       ├── common/  routes/  matching/  weather/
│       ├── checklist/  itinerary/  reviews/  admin/
│
├── supabase/
│   ├── schema.sql              # Read-only record of the database (exported from the dashboard)
│   ├── migrations/             # Legacy SQL history; delete once schema.sql is exported
│   ├── config.toml             # Supabase CLI settings (declares each function's index.js)
│   └── functions/              # Edge Functions (JavaScript running on Supabase's servers)
│       ├── _shared/  recalc-route-stats/  match-explain/  generate-checklist/
│
├── scripts/                    # One-off Node scripts for data import (service-role key)
├── data/                       # Source data, NOT served to the browser
│   ├── geojson/                #   Raw OpenStreetMap trail exports per country
│   └── geojson-route-audit.xlsx
│
└── tests/                      # TODO: create
    └── e2e/                    #   Playwright end-to-end tests
```

---

## What goes in each folder

Each section covers what the folder is for, what belongs there, what does **not**, and what it
contains today. If you are unsure where a new file goes, read the "does not belong" lines first.

### `src/router/`
**Purpose:** maps URLs to views.
**Belongs:** route definitions, lazy imports (`() => import('@/views/X.vue')`), and later navigation guards (e.g. redirect `/admin` for non-admins, `/quiz` for signed-out users).
**Does not belong:** data fetching.
**Today:** `index.js` with `/`, `/routes`, `/globe`, `/routes/:id`, `/auth`, `/profile`, `/quiz`, `/admin`.

### `src/lib/`
**Purpose:** framework-free building blocks used everywhere.
**Belongs:** the single Supabase client (`supabase.js`) and **pure** helper functions with no side effects (`format.js`: difficulty labels, badge classes, verdict text, dates).
**Does not belong:** queries, components, state.
**Rule:** only `src/services/` may import `lib/supabase.js`.

### `src/services/`
**Purpose:** the **data-access layer**, the only code that talks to Supabase or an external API.
**Belongs:** one `<feature>.service.js` per feature, exporting small named functions (`listRoutes`, `getRoute`, `upsertReview`). Supabase calls return the client's `{ data, error }` so stores decide how to handle errors; route reads also add a hiking-time-based duration estimate from distance and elevation when the stored duration is only the default one day. Rules-based generators that an Edge Function will replace also live here, so the swap touches one file.
**Does not belong:** Vue imports, reactive state, DOM code.

| File | Covers | Feature |
|---|---|---|
| `auth.service.js` | sign up/in/out, session, profile, quiz answers | 1 |
| `routes.service.js` | route list, detail, geometry, itinerary, checkpoints, warnings, trail files in Storage; estimates route days from distance and elevation | globe, 5 |
| `matching.service.js` | fitness score, route demand, match verdict, explanation and tips; saves `match_results` | 1 |
| `checklist.service.js` | checklist and item CRUD, item generator | 2 |
| `weather.service.js` | Open-Meteo forecast (external API) | 3 |
| `reviews.service.js` | reviews, incident notes, incident categories; triggers `recalc-route-stats` | 4 |
| `admin.service.js` | safety status updates, moderation queries | 3, admin |

### `src/stores/`
**Purpose:** shared application state (Pinia).
**Belongs:** state (`loading`, `error`, current records), getters, and actions that call services and update state. Use one store per domain: `auth`, `routes`, `match`, `checklist`, `reviews`.
**Does not belong:** `supabase.from(...)` calls (use a service), or HTML/formatting.
**Rule:** if only one component needs the data, it can call a service directly. Put data in a store when several components or pages share it.

### `src/views/`
**Purpose:** one component per page, matched to a route in `router/index.js`.
**Belongs:** reading route params, triggering the initial loads, and laying out feature components. Keep views thin: `RouteDetail.vue` is the model, about 90 lines composing nine components.
**Does not belong:** large blocks of feature UI (move them to `components/<feature>/`).

| View | URL | Purpose |
|---|---|---|
| `HomeView.vue` | `/` | Landing page |
| `AuthView.vue` | `/auth` | Sign in / register |
| `QuizView.vue` | `/quiz` | Onboarding proficiency quiz (feature 1) |
| `ProfileView.vue` | `/profile` | Saved checklists, quiz summary |
| `RoutesList.vue` | `/routes` | Filterable route cards |
| `RoutesGlobe.vue` | `/globe` | 3D globe of all routes |
| `RouteDetail.vue` | `/routes/:id` | One route: all five features |
| `AdminView.vue` | `/admin` | Safety status and moderation |

### `src/components/`
**Purpose:** reusable UI, grouped **by feature** so each owner works mainly in their own folder.
**Belongs:** presentational and feature components. They take data via props or a store and emit events upward.
**Does not belong:** route-level layout (use `views/`) or raw Supabase calls.

| Folder | Components | Feature |
|---|---|---|
| `common/` | `AppNavbar`, `LoadingSpinner` | shared |
| `routes/` | `RouteHeader`, `RouteStats`, `RouteFilters` | globe/list |
| `matching/` | `MatchVerdict` | 1 |
| `checklist/` | `ChecklistPanel` (route page), `ChecklistTable` (profile), `ChecklistForm` (add/edit) | 2 |
| `weather/` | `WeatherForecast` | 3 |
| `reviews/` | `ReviewSummary`, `ReviewForm`, `ReviewList` | 4 |
| `itinerary/` | `ItineraryDays` | 5 |
| `admin/` | `SafetyStatusTable`, `ReviewModeration` | admin |

New feature UI goes in that feature's folder (e.g. the hourly weather drop-down →
`weather/`, the incident map picker → `reviews/`, the bookmark button → `routes/`).

### `public/`
**Purpose:** static files served as-is at the site root (`/favicon.ico`).
**Belongs:** favicon, images and fonts referenced by absolute URL.
**Does not belong:** large data files. Trail GeoJSON is served from Supabase Storage, not from here.

### `supabase/schema.sql` (replaces `supabase/migrations/`)
**Purpose:** a **read-only record** of the database as built on the Supabase website: every table, column, constraint, index and RLS policy. It lets graders and teammates read the design in GitHub, and lets anyone rebuild the database by pasting it into the SQL editor.
**Belongs:** one file, exported from the live project with `supabase db dump --schema public -f supabase/schema.sql`. Re-export it whenever the database changes, and always before submission.
**Does not belong:** hand edits (change the database on the website, then re-export), row data, keys, and business logic (that lives in JS).
**Transition:** `supabase/migrations/` (0001–0009) is still in the repo because it is the only record until the first export exists. Once the dashboard cleanup in [Roadmap](#roadmap-and-open-items) is done and `schema.sql` is exported, delete `migrations/`.

### `supabase/functions/`
**Purpose:** Supabase Edge Functions, JS/TS code that runs on **Supabase's servers** instead of the browser. Use one for logic that writes shared data, or that needs a secret key.
**Belongs:** one folder per function with an `index.js` entry point, declared in `supabase/config.toml`; shared helpers in `_shared/`.

| Function | Does | Feature | Status |
|---|---|---|---|
| `recalc-route-stats/` | Recomputes a route's averages, effective difficulty and hazard level; writes them to `routes` with the service-role key | 4 | Written, needs deploying |
| `match-explain/` | LLM explanation/tips; replaces `explainMatch()` in `matching.service.js` | 1 | Skeleton |
| `generate-checklist/` | LLM checklist; replaces `generateChecklistItems()` in `checklist.service.js` | 2 | Skeleton |

See [`supabase/functions/README.md`](supabase/functions/README.md) for the CLI workflow.

### `scripts/`
**Purpose:** one-off Node scripts that maintain route data. They run on a developer machine with the **service-role key** and never ship to the browser.

| Script | npm script | Does |
|---|---|---|
| `list-geojson.mjs` | `routes:list` | Lists every trail (OSM id, name, file) in `data/geojson/` |
| `import-routes.mjs` | `routes:import` | Upserts trails from `data/geojson/` into `routes` (distance, start point, estimated difficulty; skips trails under 3 km) |
| `fill-elevation.mjs` | `routes:elevation` | Fills `elevation_gain_m` / `altitude_m` from a public elevation API (daily call budget) |
| `build-route-geometry.mjs` | `routes:geometry` | Regenerates `data/route-geometry.sql` (UPDATE statements linking routes to their OSM trail shape) from the Storage exports; run the output in the SQL editor |

### `data/`
**Purpose:** raw source data used by `scripts/`. It is **not** bundled or served.
**Belongs:** `geojson/<country>-routes.geojson` (OpenStreetMap exports), the route audit spreadsheet, and `route-geometry.sql` (generated by `npm run routes:geometry`; do not edit by hand).
**Note:** the globe's "show all trails" layer reads the same files from the public Supabase Storage bucket `route-geojson`. When you add a country, upload it there too and add it to `TRAIL_FILES` in `routes.service.js`.

### `tests/e2e/` (to create)
**Purpose:** Playwright end-to-end tests (required by the briefing; 10% of the web-app grade).
**Belongs:** one spec per user journey (see [Testing](#testing)), plus fixtures and auth helpers. Use stable selectors (`getByRole`, `getByLabel`, or `data-testid`), not CSS classes.

---

## Database

Supabase Postgres, **built and changed on the Supabase website**. The full definition is
recorded in `supabase/schema.sql`.

| Table / view | Purpose | Feature |
|---|---|---|
| `profiles` | One row per auth user: display name, `is_admin`, quiz answers, `fitness_score` (written by the quiz JS) | 1 |
| `routes` | Route profile, coordinates, `geometry`, safety status, community stats (written only by `recalc-route-stats`) | all |
| `itinerary_days` | Daily segments of a route | 5 |
| `route_points` | Checkpoints/huts along a route; incident notes pin to these | 4, 5 |
| `reviews` | One review per user per route | 4 |
| `review_incidents` | Up to three structured incident notes per review | 4 |
| `incident_categories` | Lookup: navigation, water hazard, landslide/rockfall, exposure/fall, … | 4 |
| `route_point_warnings` (view) | Aggregated incident warnings per checkpoint | 4, 5 |
| `match_results` | Last computed verdict/explanation per user and route | 1 |
| `checklists`, `checklist_items` | Saved gear checklists | 2 |
| `weather_cache` | Reserved for caching forecasts | 3 |

**Where the logic went.** The database stores data and enforces permissions; all calculations are JS:

| Logic | File | Previously |
|---|---|---|
| Fitness score from quiz answers | `src/services/matching.service.js` → `calcFitnessScore` (saved by `stores/auth.js`) | SQL `calc_fitness_score` + trigger |
| Route demand, match verdict | `src/services/matching.service.js` → `calcRouteDemand`, `calcMatchVerdict` | SQL `calc_route_demand`, `calc_match_verdict` |
| Effective difficulty, hazard score/level, averages | `supabase/functions/_shared/route-stats.js`, run by `recalc-route-stats` | SQL `recalc_route_stats` + triggers |
| Create profile on first sign-in | `src/stores/auth.js` → `fetchProfile` | SQL `handle_new_user` trigger |

The JS versions were checked against the original SQL functions on the live data, with 0 mismatches.

**Changing the database:**
1. Make the change on the Supabase website (Table Editor, Authentication → Policies, or SQL editor).
2. Re-export `supabase/schema.sql` and commit it with the code that needs the change.
3. Mention it in the PR description so teammates know the shared database changed.

**Permissions that must stay in place** (set in Authentication → Policies):

| Table | Rule |
|---|---|
| `profiles` | Users read and update only their own row; users can insert their own row |
| `routes` | Everyone reads; **only admins update** (users never write stats; the Edge Function uses the service-role key) |
| `reviews`, `review_incidents` | Everyone reads; users write only their own; admins can delete |
| `checklists`, `checklist_items`, `match_results` | Users access only their own |

---

## Getting started

### Prerequisites
- Node.js 22.18+ (or 24.12+)
- Access to the team Supabase project (ask Chloe)
- _Optional:_ the [Supabase CLI](https://supabase.com/docs/guides/cli), only needed for Edge Functions

### Setup

```bash
git clone https://github.com/zacchaeus-tan/WAD2.git
cd WAD2
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Used by | Where to find it |
|---|---|---|
| `VITE_SUPABASE_URL` | browser | Supabase → Project Settings → API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | browser | Supabase → Project Settings → API (publishable/anon key) |
| `SUPABASE_URL` | `scripts/` only | same URL |
| `SERVICE_ROLE_KEY` | `scripts/` only | Supabase → API → service role. **Bypasses RLS: never commit it and never prefix it with `VITE_`.** |

The LLM key does **not** go in `.env.local`. It is a Supabase secret (`supabase secrets set LLM_API_KEY=...`).

### Run

```bash
npm run dev
```

Open http://localhost:5173.

### Build and preview production

```bash
npm run build
npm run preview
```

---

## npm scripts

| Script | Does |
|---|---|
| `npm run dev` | Vite dev server with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serves `dist/` locally |
| `npm run routes:list` | List trails in `data/geojson/` |
| `npm run routes:import` | Import trails into `routes` (needs service-role key) |
| `npm run routes:elevation` | Fill elevation data (needs service-role key) |
| `npm run routes:geometry` | Regenerate `data/route-geometry.sql` |
| `npm run test:e2e` | _TODO_: run Playwright tests |

---

## Testing

> **Status: not set up yet.** The briefing requires E2E tests and grades coverage of the main
> user journeys, repeatability, stable selectors, and clear run instructions here.

### Setup (to do once)

```bash
npm init playwright@latest
```

Choose `tests/e2e` as the test folder. Point `playwright.config.js` → `webServer` at
`npm run dev` (port 5173) so tests start the app themselves. Then add
`"test:e2e": "playwright test"` to `package.json`.

### Journeys to cover (one spec each)

| Spec | Journey | Feature |
|---|---|---|
| `auth.spec.js` | Register → sign in → sign out; wrong password shows an error | 1 |
| `quiz.spec.js` | Complete the quiz → fitness score appears on quiz and profile | 1 |
| `routes.spec.js` | Filter by country/difficulty/multi-day → open a route | globe/list |
| `match.spec.js` | Signed-in user with a score sees a verdict, explanation and tips | 1 |
| `checklist.spec.js` | Generate → save → add/edit/remove item → tick → appears on profile | 2 |
| `weather.spec.js` | Forecast table renders (mock Open-Meteo with `page.route` for stability) | 3 |
| `reviews.spec.js` | Submit a review with an incident → summary and list update → delete | 4 |
| `itinerary.spec.js` | Multi-day route shows each day and its warnings | 5 |
| `admin.spec.js` | Admin changes a status → route page shows it; non-admin is blocked | admin |

Use dedicated test accounts (below). Stub external APIs so tests don't depend on network or quotas.

### Run

```bash
npx playwright install
npm run test:e2e
npx playwright show-report
```

---

## Deployment

> **Status: not deployed yet.**

1. Import `zacchaeus-tan/WAD2` into Vercel (framework preset: **Vite**; build `npm run build`; output `dist`).
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as Vercel environment variables.
3. Add a `vercel.json` at the repo root so deep links such as `/routes/123` don't 404 (the router uses HTML5 history mode):
   ```json
   { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
   ```
4. In Supabase → Authentication → URL configuration, add the Vercel URL as Site URL / redirect URL.
5. Put the live URL at the top of this README.

The briefing requires the app to stay up until Week 18, and graders test each feature around 5–6
times a day. Open-Meteo and OpenFreeMap are free and keyless, so they comfortably cover that.

---

## Team and ownership

| Member | Role | Owns |
|---|---|---|
| Zacchaeus Tan | Team Leader / Full Stack (Routes) | `routes.service.js`, `stores/routes.js`, `RoutesList`, `RoutesGlobe`, `components/routes/`, `scripts/`, `data/`, bookmarks |
| Daryl Pua | Full Stack / Front-End Lead | App shell and `components/common/`, overall UI and responsiveness, `components/reviews/`, `reviews.service.js`, incident flagging |
| Chloe Cheo | Back-End Lead / DB admin | Database on the Supabase website + `supabase/schema.sql`, RLS policies, `auth.service.js`, `AuthView`, `admin.service.js`, `components/admin/`, Edge Function setup |
| Lee Shan Rong | Full Stack (Gear Checklist) | `components/checklist/`, `checklist.service.js`, `stores/checklist.js`, `supabase/functions/generate-checklist/` |
| Sheryl Wee Xin Hui | Full Stack (Quiz) | `QuizView`, `components/matching/`, `matching.service.js`, `stores/match.js`, `supabase/functions/match-explain/` |

Weather (feature 3) and itinerary (feature 5) are shared. Agree an owner before starting work on them.

---

## Working conventions

**Git**
- Branch from the current feature branch: `feature/<area>-<short-name>` (e.g. `feature/checklist-table`).
- Open a pull request; at least one teammate reviews it before merge.
- If you changed the database on the Supabase website, re-export `supabase/schema.sql` and say so in the PR description.

**Code**
- Vue 3 `<script setup>`, Composition API, 2-space indent.
- Components are `PascalCase.vue`; services are `<feature>.service.js`; stores are `<domain>.js` exporting `use<Domain>Store`.
- Import with the `@/` alias (`@/services/routes.service`), never with long relative paths.
- Never import `@/lib/supabase` outside `src/services/`.
- Never put a secret in `src/` or in a `VITE_` variable. Anything in the browser bundle is public.
- Style with Bootstrap classes first; use `<style scoped>` only for what Bootstrap can't do.
- Use semantic labels (`<label for>`, `aria-label`) on every input. This is good accessibility, and it gives Playwright stable selectors.

---

## Test accounts

The briefing requires credentials for any dummy account needed to use the app. Create these in
the Supabase project, then fill in the table (never reuse personal passwords).

| Role | Email | Password | Notes |
|---|---|---|---|
| Hiker (quiz done) | _TODO_ | _TODO_ | Has a fitness score and a saved checklist |
| Admin | _TODO_ | _TODO_ | `profiles.is_admin = true` |

---

## Third-party code, data and credits

The briefing requires all third-party code and data to be credited, both here and in the presentation.

| Source | Used for | Licence |
|---|---|---|
| [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors | Trail geometry (`data/geojson/`) | ODbL |
| [Open-Meteo](https://open-meteo.com/) | Weather forecasts | CC BY 4.0 |
| [OpenFreeMap](https://openfreemap.org/) / OpenMapTiles | Globe base map tiles | Free / ODbL |
| [MapLibre GL JS](https://maplibre.org/) | Globe rendering | BSD-3 |
| [Bootstrap 5](https://getbootstrap.com/) | Styling | MIT |
| [Vue](https://vuejs.org/), [Vue Router](https://router.vuejs.org/), [Pinia](https://pinia.vuejs.org/) | Frontend framework | MIT |
| [Supabase](https://supabase.com/) | Database, auth, storage, edge functions | MIT (supabase-js) |
| Mount Rinjani accident figures | Problem statement | _TODO: add citation_ |

---

## Roadmap and open items

From the proposal's to-do list and the briefing. Tick these off as they land.

**Required for submission**
- [ ] Playwright E2E tests in `tests/e2e/` + `npm run test:e2e`
- [ ] Deploy to Vercel (+ `vercel.json`), add the live URL above
- [ ] Responsive audit, 375px → XL, in Chrome DevTools
- [ ] Test accounts created and listed above
- [ ] Faculty/instructor added to the GitHub repo
- [ ] Presentation slides (.pptx/.pdf) with the video link on the title slide

**Database: move logic out of SQL (do these in order)**
1. [ ] Deploy the stats function: `supabase functions deploy recalc-route-stats`
2. [ ] Submit a test review and check the route's figures update
3. [ ] In the Supabase SQL editor, drop the old SQL logic that the JS now replaces (list below)
4. [ ] Export `supabase/schema.sql` (`supabase db dump --schema public -f supabase/schema.sql`), then delete `supabase/migrations/`
- [ ] Bookmarks table for saved routes (proposal 4a)

SQL to drop in step 3 (the old triggers would otherwise keep running alongside the JS):

```sql
drop trigger if exists profiles_score_quiz           on public.profiles;
drop trigger if exists on_auth_user_created          on auth.users;
drop trigger if exists reviews_recalc_stats          on public.reviews;
drop trigger if exists review_incidents_recalc_stats on public.review_incidents;
drop trigger if exists review_incidents_set_route    on public.review_incidents;
drop trigger if exists routes_default_difficulty     on public.routes;
drop trigger if exists reviews_touch_updated_at      on public.reviews;

drop function if exists public.profiles_score_quiz();
drop function if exists public.handle_new_user();
drop function if exists public.reviews_stats_trigger();
drop function if exists public.review_incidents_stats_trigger();
drop function if exists public.review_incidents_set_route();
drop function if exists public.routes_default_difficulty();
drop function if exists public.recalc_route_stats(uuid);
drop function if exists public.calc_fitness_score(text, numeric, numeric, numeric);
drop function if exists public.calc_route_demand(numeric, numeric, numeric, integer, numeric);
drop function if exists public.calc_match_verdict(numeric, numeric);
drop function if exists public.calc_effective_difficulty(numeric, integer[], boolean[]);
drop function if exists public.calc_hazard_score(integer[], integer);
drop function if exists public.calc_hazard_level(numeric);
drop function if exists public.difficulty_from_text(text);
drop function if exists public.touch_updated_at();
```

Keep the `route_point_warnings` view: it is a saved query, not app logic, and the itinerary reads it.

**Features (proposal to-do list)**
- [ ] 1: Profile fields at sign-up: name, age, gender, country, about
- [ ] 1: Quiz additions: hike types (multi-day / overnight / summit), years hiking
- [ ] 1: `match-explain` Edge Function (LLM explanation, verdict stays DB-computed)
- [ ] 2: `generate-checklist` Edge Function; generate button hidden after generating; table view on route page
- [ ] 3: Hourly forecast drop-down per day, more weather detail
- [ ] 4: Incident location as free text; pick the incident point on a map
- [ ] Globe: search bar, bookmark button, all eight countries in `TRAIL_FILES` (New Zealand and Australia are missing)
- [ ] Admin: alerts and warnings per route; investigate automating them
- [ ] Router guards for `/admin`, `/quiz`, `/profile`
- [ ] Globe: disable the "show all trails" switch until the map has loaded (clicking it earlier currently throws)
