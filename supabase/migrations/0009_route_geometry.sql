-- Keep /routes and /globe backed by the same Supabase rows.
-- GeoJSON is imported by import-routes.mjs using the service role key.

alter table public.routes
  add column if not exists osm_id  text,
  add column if not exists country text,
  add column if not exists geometry jsonb;

alter table public.routes
  add constraint routes_osm_id_key unique (osm_id);

alter table public.routes enable row level security;

drop policy if exists "public read routes" on public.routes;
create policy "public read routes"
  on public.routes for select
  using (true);
