# Supabase Edge Functions

Server-side code that Supabase hosts for us. This is where anything needing a
**secret key** runs, so the key never reaches the browser. There is no Express
server in this project; Edge Functions fill that role.

```
Vue component → store → src/services/*.service.js
                          └─ supabase.functions.invoke('<name>', { body })
                                └─ supabase/functions/<name>/index.js  (reads LLM_API_KEY)
                                      └─ LLM API
```

| Function | Feature (proposal) | Why it runs on the server | Called from | Status |
|---|---|---|---|---|
| `recalc-route-stats/` | 4. Community ratings | Writes shared stats on `routes` with the service-role key, so users never get write access to `routes` | `reviews.service.js` → `recalcRouteStats()` after every review/incident change | **Written, needs deploying** |
| `match-explain/` | 1. Automated difficulty matching | Holds the LLM key; replaces `explainMatch()` in `matching.service.js` | `matching.service.js` | Skeleton |
| `generate-checklist/` | 2. Auto-generated gear checklist | Holds the LLM key; replaces `generateChecklistItems()` in `checklist.service.js` | `checklist.service.js` | Skeleton |
| `_shared/` | — | — | `cors.js` (CORS headers), `route-stats.js` (feature 4 maths) | — |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected into every function
automatically; you only set your own secrets (e.g. `LLM_API_KEY`).

## Working on a function

1. Install the [Supabase CLI](https://supabase.com/docs/guides/cli) and run `supabase login`.
2. Link the project once: `supabase link --project-ref <project-ref>`.
3. Create the entry point, e.g. `supabase/functions/generate-checklist/index.js`, and declare it in `supabase/config.toml` (the CLI looks for `index.ts` unless told otherwise).
4. Store the key as a secret (never in `.env` or a `VITE_` variable):
   `supabase secrets set LLM_API_KEY=...`
5. Run locally: `supabase functions serve generate-checklist`
6. Deploy: `supabase functions deploy generate-checklist`

## Rules

- The function must return the **same shape** as the rules-based function it
  replaces, so stores and components do not change.
- Keep the verdict anchored to the database score (`calc_match_verdict`); the
  LLM only writes the explanation and tips.
- Validate the request body and the user's JWT. `supabase.functions.invoke`
  sends the signed-in user's token automatically.
