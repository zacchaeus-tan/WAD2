# _shared

Code imported by more than one Edge Function. Supabase does not deploy folders
starting with `_` as functions.

| File | Used by | Contains |
|---|---|---|
| `cors.ts` | every function | CORS headers so the Vite dev server and the deployed site can call the functions |
| `route-stats.ts` | `recalc-route-stats` | Feature 4 maths: effective difficulty, hazard score/level, hazard note, averages |
| `llm.ts` _(to add)_ | `match-explain`, `generate-checklist` | One helper that calls the LLM provider with `Deno.env.get('LLM_API_KEY')` |
