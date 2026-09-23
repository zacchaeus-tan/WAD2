-- Feature 1. Fitness score from the quiz, demand score for the route, and the
-- verdict from the gap between them. The LLM writes the explanation; it never
-- decides the verdict.

-- 0-100 from the onboarding quiz answers.
create or replace function public.calc_fitness_score(
  p_experience_level     text,
  p_longest_distance_km  numeric,
  p_max_elevation_gain_m numeric,
  p_highest_altitude_m   numeric
)
returns numeric
language sql
immutable
as $$
  select round(
      case lower(coalesce(p_experience_level, ''))
        when 'beginner'    then 0
        when 'occasional'  then 8
        when 'regular'     then 16
        when 'experienced' then 25
        else 0
      end
    + least(coalesce(p_longest_distance_km, 0)  / 30.0,   1) * 25
    + least(coalesce(p_max_elevation_gain_m, 0) / 2000.0, 1) * 30
    + least(coalesce(p_highest_altitude_m, 0)   / 3500.0, 1) * 20
  , 1);
$$;

-- 0-100 for what the route asks of you. Uses effective difficulty, so the
-- community's view feeds straight into the match.
create or replace function public.calc_route_demand(
  p_distance_km    numeric,
  p_elevation_gain numeric,
  p_altitude_m     numeric,
  p_duration_days  integer,
  p_difficulty     numeric
)
returns numeric
language sql
immutable
as $$
  select round(
      least(coalesce(p_distance_km, 0)    / 30.0,   1) * 25
    + least(coalesce(p_elevation_gain, 0) / 2500.0, 1) * 30
    + least(coalesce(p_altitude_m, 0)     / 4000.0, 1) * 20
    + least(greatest(coalesce(p_duration_days, 1) - 1, 0) * 5, 10)
    + (least(greatest(coalesce(p_difficulty, 2), 1), 4) - 1) / 3.0 * 15
  , 1);
$$;

create or replace function public.calc_match_verdict(
  p_fitness numeric,
  p_demand  numeric
)
returns text
language sql
immutable
as $$
  select case
    when p_fitness is null or p_demand is null then 'unknown'
    when p_fitness - p_demand >= 10  then 'comfortable'
    when p_fitness - p_demand >= -5  then 'good_match'
    when p_fitness - p_demand >= -20 then 'stretch'
    else 'not_ready'
  end;
$$;

-- Keeps the profile's fitness score in step with the quiz answers.
create or replace function public.profiles_score_quiz()
returns trigger
language plpgsql
as $$
begin
  if new.experience_level is not null
     or new.longest_distance_km is not null
     or new.max_elevation_gain_m is not null
     or new.highest_altitude_m is not null then
    new.fitness_score := public.calc_fitness_score(
      new.experience_level, new.longest_distance_km,
      new.max_elevation_gain_m, new.highest_altitude_m);
    if new.quiz_completed_at is null then
      new.quiz_completed_at := now();
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_score_quiz on public.profiles;
create trigger profiles_score_quiz
  before insert or update on public.profiles
  for each row execute function public.profiles_score_quiz();

-- Cached LLM explanations so the same user/route pair is not re-billed.
create table if not exists public.match_results (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.profiles(id) on delete cascade,
  route_id             uuid not null references public.routes(id) on delete cascade,
  fitness_score        numeric not null,
  route_demand         numeric not null,
  verdict              text not null,
  explanation          text,
  tips                 jsonb,
  effective_difficulty numeric,
  model                text,
  created_at           timestamptz not null default now(),
  unique (user_id, route_id)
);

alter table public.match_results drop constraint if exists match_results_verdict_check;
alter table public.match_results add constraint match_results_verdict_check
  check (verdict in ('comfortable','good_match','stretch','not_ready','unknown'));

alter table public.match_results enable row level security;

drop policy if exists "Users read their own match results" on public.match_results;
create policy "Users read their own match results"
  on public.match_results for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
