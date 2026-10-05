-- Feature 2 (gear checklist) and Feature 3 (weather cache).

create table if not exists public.checklists (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  route_id     uuid not null references public.routes(id) on delete cascade,
  source       text not null default 'ai',
  generated_at timestamptz not null default now(),
  unique (user_id, route_id)
);

alter table public.checklists drop constraint if exists checklists_source_check;
alter table public.checklists add constraint checklists_source_check
  check (source in ('ai','fallback','manual'));

create table if not exists public.checklist_items (
  id           uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references public.checklists(id) on delete cascade,
  label        text not null,
  quantity     text,
  reason       text,
  category     text not null default 'other',
  is_checked   boolean not null default false,
  is_custom    boolean not null default false,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

alter table public.checklist_items drop constraint if exists checklist_items_category_check;
alter table public.checklist_items add constraint checklist_items_category_check
  check (category in ('clothing','safety','navigation','water_food','shelter','documents','other'));

create index if not exists checklist_items_checklist_id_idx on public.checklist_items (checklist_id);

alter table public.checklists enable row level security;
alter table public.checklist_items enable row level security;

drop policy if exists "Users manage their own checklists" on public.checklists;
create policy "Users manage their own checklists"
  on public.checklists for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage their own checklist items" on public.checklist_items;
create policy "Users manage their own checklist items"
  on public.checklist_items for all
  using (exists (select 1 from public.checklists c where c.id = checklist_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.checklists c where c.id = checklist_id and c.user_id = auth.uid()));

-- Weather is fetched by an edge function holding the API key. Readable by
-- everyone, writable only by the service role (no write policy on purpose).
create table if not exists public.weather_cache (
  route_id   uuid primary key references public.routes(id) on delete cascade,
  current    jsonb,
  forecast   jsonb,
  fetched_at timestamptz not null default now()
);

alter table public.weather_cache enable row level security;

drop policy if exists "Anyone can read cached weather" on public.weather_cache;
create policy "Anyone can read cached weather"
  on public.weather_cache for select
  using (true);
