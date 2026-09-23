-- Feature 5 checkpoints. Incident notes pin to these, so they are shared
-- between the itinerary view and the reviews feature.

create table if not exists public.route_points (
  id          uuid primary key default gen_random_uuid(),
  route_id    uuid not null references public.routes(id) on delete cascade,
  day_number  integer,
  sequence    integer not null,
  name        text not null,
  point_type  text not null default 'checkpoint',
  latitude    numeric,
  longitude   numeric,
  altitude_m  numeric,
  notes       text,
  created_at  timestamptz not null default now(),
  unique (route_id, sequence)
);

alter table public.route_points drop constraint if exists route_points_type_check;
alter table public.route_points add constraint route_points_type_check
  check (point_type in ('trailhead','checkpoint','camp','hut','water','summit','junction','viewpoint','finish'));

create index if not exists route_points_route_id_idx on public.route_points (route_id);

alter table public.route_points enable row level security;

drop policy if exists "Anyone can view route points" on public.route_points;
create policy "Anyone can view route points"
  on public.route_points for select
  using (true);

drop policy if exists "Only admins can modify route points" on public.route_points;
create policy "Only admins can modify route points"
  on public.route_points for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));
