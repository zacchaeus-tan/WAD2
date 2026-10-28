# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Anyone planning a trek in Southeast Asia: regional and visiting travellers, not only Singapore residents. They range from people who have only done short walks to people who have done multi-day treks or big summits (Kinabalu, Rinjani). The main moment of use is before the trip: deciding whether a route is realistic for them, then preparing for it (itinerary, weather, gear).

A second audience: the people grading CAIRN as a WAD2 course project. They judge it against the course rubric.

## Product Purpose

CAIRN helps a hiker find out whether a trek suits them before they go, then prepare for it. It compares the hiker's own experience (from a short quiz) with what each route asks of them, and gives a clear verdict with reasons. It then helps them plan with day-by-day itineraries, live weather warnings, gear checklists, and reviews from people who walked the route.

Success means a hiker picks a route they can actually finish safely, knowing up front where it will stretch them.

## Positioning

Two things set CAIRN apart, and they work together:

1. **A personal fit verdict.** Fixed rules compare the hiker's quiz history with each route: distance and elevation gain per day, highest altitude, trip length, and experience level against grade. A route can ask up to 25% more than the hiker has done before and still count as within their experience. Above 2,500 m, the altitude-sickness risk is flagged (CDC Yellow Book, Wilderness Medical Society). An LLM may explain the verdict, but it never decides it.
2. **Community-corrected difficulty.** Each route keeps its official grade (1 Easy, 2 Moderate, 3 Hard, 4 Strenuous) next to an effective difficulty based on reviews. When hikers keep rating a route harder than its official grade, the grade moves. That effective grade feeds the fit verdict.

Incident reports pinned to checkpoints back up both pillars, but they are not the headline.

## Operating Context

- Planning happens at home before the trip, usually across several sessions: browse or explore on the globe, open a route, check fit, plan, pack.
- Hikers move between a global/regional view (the 3D globe and the routes list) and the detail of one route.
- Reviews come in after a hike: rating, perceived difficulty, whether they finished, and incidents tied to a category and checkpoint.
- Weather is checked for both the trailhead and the summit, with warnings for storms, near-freezing feels-like temperatures, very high UV, strong gusts, wet afternoons, and recent rain.

## Capabilities and Constraints

**Built today**
- Routes list and a MapLibre 3D globe with an intro/loading sequence (`src/views/RoutesList.vue`, `src/views/RoutesGlobe.vue`).
- Route detail page: overview, difficulty and community feedback, "Is this route right for you?" verdict, safety and hazards, itinerary planner, community reviews, gear checklist (`src/views/RouteDetail.vue`).
- Five-question experience quiz feeding a 0–100 fitness score and the matching rules (`src/lib/quizQuestions.js`, `src/lib/matching.js`, `supabase/migrations/0007_matching.sql`).
- AI itinerary (1 to 60 days, relaxed/moderate/fast pace) and AI gear checklist. Both use OpenAI `gpt-4.1-mini` through Supabase edge functions, so keys stay server-side.
- Open-Meteo weather forecasts with threshold-based warnings (`src/controller/weatherController.js`).
- Supabase auth, profiles, and role-gated admin. The admin view is still a stub.

**Technical constraints**
- Vue 3 + Vite + Pinia + vue-router, organised as model / controller / views. Supabase for the database, auth, and edge functions. MapLibre GL for maps.
- Bootstrap 5 stays as the base framework.
- Shared team codebase: teammates own different views, so changes should stay contained, readable, and consistent with the existing code style.
- Graded course project with a rubric and a deadline.
- The team wants to explore Motion (motion.dev) for animation.

**Terminology**
- Difficulty grades: Easy, Moderate, Hard, Strenuous (1–4). "Official" grade vs "effective" (community-corrected) grade.
- Trip types: day hike, overnight hike, multi-day trek.
- Overall verdict: Comfortable (no checks failed), Good challenge (one or two failed), A stretch (three or more), Not enough information yet. Each rule check is pass / fail / unknown; safety warnings sit next to the verdict without changing it.

**Open decisions**
- Geographic scope wording. The audience is Southeast Asia travellers, the route data also covers Australia and New Zealand, and the globe tagline says "anywhere on Earth". Pick one framing.
- The quiz's elevation hint uses Bukit Timah, a Singapore landmark, as its reference. It may need a more regional reference for the broader audience.
- Admin features are not defined yet.
- Exact deadline and rubric criteria are not recorded here.

## Brand Commitments

- Name: **CAIRN** (shown in capitals).
- Current lines in use: "Know whether a trek matches you before you go" (homepage) and "Find your next trail, anywhere on Earth" (globe intro).
- Voice in the existing copy: plain, specific, safety-minded. It cites sources for thresholds and explains verdicts in concrete numbers ("12 km a day is within your experience (10 km)").

## Evidence on Hand

- Real route geometry for Australia, Indonesia, Malaysia, New Zealand, the Philippines, Singapore, Thailand, and Vietnam (`data/geojson/*.geojson`, loaded by migrations `0009`/`0010`). Do not replace it with placeholder data.
- Route stats and reviews live in Supabase; community difficulty is recalculated by triggers and the `recalc-route-stats` function.
- Image asset: `public/clouds.jpg`.
- **Do not fabricate:** there are no testimonials, user counts, route counts, partner logos, press, or accuracy claims. Do not invent any.

## Product Principles

1. **Rules decide, AI explains.** Every verdict and warning comes from transparent thresholds the hiker can see. Generated text never overrides them.
2. **Honest about difficulty.** Show the official grade and the community-corrected grade side by side, and say why they differ.
3. **Safety information is never decoration.** Verdicts, hazards, and weather warnings must be unmistakable and readable without relying on colour, and must never be hidden behind an interaction.
4. **Stretch, don't gamble.** Frame fit as comfortable, a good challenge, or a stretch, so hikers grow step by step rather than jumping too far.
5. **Show the numbers.** Back claims with concrete per-day figures and sources instead of vague reassurance.
