-- Feature 4: structured incident / near-miss notes attached to a review and
-- pinned to a point on the route. Severity drives the hazard score.

create table if not exists public.incident_categories (
  category   text primary key,
  label      text not null,
  severity   smallint not null check (severity between 1 and 3),
  sort_order smallint not null default 0
);

insert into public.incident_categories (category, label, severity, sort_order) values
  ('navigation',        'Lost the trail / unclear junction',            2, 1),
  ('water_hazard',      'Flash flood or difficult river crossing',      3, 2),
  ('landslide_rockfall','Landslide or rockfall',                        3, 3),
  ('exposure_fall',     'Slippery, loose or exposed section',           3, 4),
  ('water_source',      'Water source dry or unusable',                 2, 5),
  ('facility',          'Campsite, hut or toilet closed or unusable',   1, 6),
  ('wildlife',          'Aggressive wildlife or insects',               1, 7),
  ('other',             'Something else',                               1, 8)
on conflict (category) do update
  set label = excluded.label,
      severity = excluded.severity,
      sort_order = excluded.sort_order;

alter table public.incident_categories enable row level security;

drop policy if exists "Anyone can view incident categories" on public.incident_categories;
create policy "Anyone can view incident categories"
  on public.incident_categories for select
  using (true);

create table if not exists public.review_incidents (
  id         uuid primary key default gen_random_uuid(),
  review_id  uuid not null references public.reviews(id) on delete cascade,
  route_id   uuid not null references public.routes(id) on delete cascade,
  point_id   uuid references public.route_points(id) on delete set null,
  category   text not null references public.incident_categories(category),
  note       text not null,
  created_at timestamptz not null default now()
);

create index if not exists review_incidents_route_id_idx on public.review_incidents (route_id);
create index if not exists review_incidents_review_id_idx on public.review_incidents (review_id);
create index if not exists review_incidents_point_id_idx on public.review_incidents (point_id);

-- route_id is denormalised so hazard queries avoid a join; keep it honest.
create or replace function public.review_incidents_set_route()
returns trigger
language plpgsql
as $$
begin
  select r.route_id into new.route_id from public.reviews r where r.id = new.review_id;
  return new;
end;
$$;

drop trigger if exists review_incidents_set_route on public.review_incidents;
create trigger review_incidents_set_route
  before insert or update on public.review_incidents
  for each row execute function public.review_incidents_set_route();

alter table public.review_incidents enable row level security;

drop policy if exists "Anyone can view incident notes" on public.review_incidents;
create policy "Anyone can view incident notes"
  on public.review_incidents for select
  using (true);

drop policy if exists "Users manage notes on their own review" on public.review_incidents;
create policy "Users manage notes on their own review"
  on public.review_incidents for all
  using (exists (select 1 from public.reviews r where r.id = review_id and r.user_id = auth.uid()))
  with check (exists (select 1 from public.reviews r where r.id = review_id and r.user_id = auth.uid()));

drop policy if exists "Admins can moderate incident notes" on public.review_incidents;
create policy "Admins can moderate incident notes"
  on public.review_incidents for delete
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));
