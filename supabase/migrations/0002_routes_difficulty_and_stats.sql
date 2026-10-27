-- Routes: numeric official difficulty (1-4) plus the community-derived columns
-- that the reviews trigger maintains.

alter table public.routes
  add column if not exists official_difficulty      smallint,
  add column if not exists avg_rating               numeric(3,2),
  add column if not exists avg_perceived_difficulty numeric(3,2),
  add column if not exists review_count             integer not null default 0,
  add column if not exists completion_rate          numeric(4,3),
  add column if not exists effective_difficulty     numeric(3,2),
  add column if not exists community_hazard_level   text not null default 'low',
  add column if not exists community_hazard_note    text,
  add column if not exists stats_updated_at         timestamptz;

-- 1 Easy, 2 Moderate, 3 Hard, 4 Strenuous
create or replace function public.difficulty_from_text(p_text text)
returns smallint
language sql
immutable
as $$
  select case lower(coalesce(p_text, ''))
    when 'easy'       then 1
    when 'moderate'   then 2
    when 'hard'       then 3
    when 'strenuous'  then 4
    else 2
  end::smallint;
$$;

update public.routes
   set official_difficulty = public.difficulty_from_text(technical_rating)
 where official_difficulty is null;

-- Keeps Person 2's seed script working without having to set the numeric grade by hand.
create or replace function public.routes_default_difficulty()
returns trigger
language plpgsql
as $$
begin
  if new.official_difficulty is null then
    new.official_difficulty := public.difficulty_from_text(new.technical_rating);
  end if;
  if new.effective_difficulty is null then
    new.effective_difficulty := new.official_difficulty;
  end if;
  return new;
end;
$$;

drop trigger if exists routes_default_difficulty on public.routes;
create trigger routes_default_difficulty
  before insert or update on public.routes
  for each row execute function public.routes_default_difficulty();

update public.routes
   set effective_difficulty = official_difficulty
 where effective_difficulty is null;

alter table public.routes alter column official_difficulty set not null;

alter table public.routes drop constraint if exists routes_official_difficulty_check;
alter table public.routes add constraint routes_official_difficulty_check
  check (official_difficulty between 1 and 4);

alter table public.routes drop constraint if exists routes_effective_difficulty_check;
alter table public.routes add constraint routes_effective_difficulty_check
  check (effective_difficulty is null or effective_difficulty between 1 and 4);

alter table public.routes drop constraint if exists routes_safety_status_check;
alter table public.routes add constraint routes_safety_status_check
  check (safety_status in ('open','caution','closed'));

alter table public.routes drop constraint if exists routes_hazard_level_check;
alter table public.routes add constraint routes_hazard_level_check
  check (community_hazard_level in ('low','moderate','elevated'));
