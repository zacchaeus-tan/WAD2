# match-explain

Proposal feature 1: Automated Difficulty Matching.

**Input** (`body`): `{ routeId, demand }`. Look up the route and the caller's
profile server-side rather than trusting the browser.

**Output**: `{ explanation: string, tips: string[] (max 3), model: string }`.
This is the same shape as `explainMatch()` in `src/services/matching.service.js`.

The verdict is computed by `calc_match_verdict` in the database and passed in
the prompt. The model must not change it, only explain it in plain language
using the user's free-text goals and the route's full profile.
