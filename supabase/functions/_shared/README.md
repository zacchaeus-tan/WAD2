# _shared

Code imported by more than one Edge Function. Supabase does not deploy folders
starting with `_` as functions.

| File | Used by | Contains |
|---|---|---|
| `cors.js` | every function | CORS headers so the Vite dev server and the deployed site can call the functions |
| `route-stats.js` | `recalc-route-stats` | Feature 4 maths: effective difficulty, hazard score/level, hazard note, averages |
| `llm.js` _(to add)_ | `match-explain`, `generate-checklist` | One helper that calls the LLM provider with `Deno.env.get('LLM_API_KEY')` |
