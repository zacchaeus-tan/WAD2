-- Feature 4 logic. The maths lives in small pure functions so it can be tested
-- without inserting rows; recalc_route_stats() gathers the data and writes the
-- cached columns on routes.

-- Weighted average of community difficulty against the official grade.
--   k     = official rating counts as this many reviews (prior weight)
--   gate  = ignore divergence smaller than half a grade
--   clamp = community can move the grade by at most one step
-- Reviews from people who did not finish count half: useful signal, but they
-- may have turned back for reasons unrelated to the route.
create or replace function public.calc_effective_difficulty(
  p_official  numeric,
  p_perceived integer[],
  p_completed boolean[]
)
returns numeric
language plpgsql
immutable
as $$
declare
  k       constant numeric := 5;
  gate    constant numeric := 0.5;
  clamp   constant numeric := 1.0;
  sum_w     numeric := 0;
  sum_wp    numeric := 0;
  w         numeric;
  i         integer;
  community numeric;
  blended   numeric;
  result    numeric;
begin
  if p_official is null then
    return null;
  end if;

  if p_perceived is null or array_length(p_perceived, 1) is null then
    return p_official;
  end if;

  for i in 1 .. array_length(p_perceived, 1) loop
    if p_perceived[i] is not null then
      w := case when coalesce(p_completed[i], false) then 1.0 else 0.5 end;
      sum_w  := sum_w + w;
      sum_wp := sum_wp + w * p_perceived[i];
    end if;
  end loop;

  if sum_w = 0 then
    return p_official;
  end if;

  community := sum_wp / sum_w;

  if abs(community - p_official) < gate then
    return p_official;
  end if;

  blended := (k * p_official + sum_wp) / (k + sum_w);
  result  := least(greatest(blended, p_official - clamp), p_official + clamp);

  return round(least(greatest(result, 1), 4), 2);
end;
$$;

-- Severity-weighted incidents per review. The +3 stops one report on a
-- barely-reviewed route from reading as dangerous.
create or replace function public.calc_hazard_score(
  p_severities  integer[],
  p_review_count integer
)
returns numeric
language plpgsql
immutable
as $$
declare
  smoothing constant numeric := 3;
  total     numeric := 0;
  s         integer;
begin
  if p_severities is null or array_length(p_severities, 1) is null then
    return 0;
  end if;

  foreach s in array p_severities loop
    total := total + coalesce(s, 0);
  end loop;

  return round(total / (coalesce(p_review_count, 0) + smoothing), 3);
end;
$$;

create or replace function public.calc_hazard_level(p_score numeric)
returns text
language sql
immutable
as $$
  select case
    when coalesce(p_score, 0) > 0.40 then 'elevated'
    when coalesce(p_score, 0) >= 0.15 then 'moderate'
    else 'low'
  end;
$$;

-- Recomputes every cached figure for one route. security definer because RLS
-- only lets admins write to routes.
create or replace function public.recalc_route_stats(p_route_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_official   numeric;
  v_perceived  integer[];
  v_completed  boolean[];
  v_count      integer := 0;
  v_avg_rating numeric;
  v_avg_pd     numeric;
  v_completion numeric;
  v_sev        integer[];
  v_score      numeric;
  v_level      text;
  v_note       text;
  v_eff        numeric;
  v_top_label  text;
  v_top_users  integer;
begin
  select official_difficulty into v_official from public.routes where id = p_route_id;
  if v_official is null then
    return;
  end if;

  select count(*),
         round(avg(rating)::numeric, 2),
         round(avg(perceived_difficulty)::numeric, 2),
         round(avg(case when completed then 1 else 0 end)::numeric, 3),
         array_agg(perceived_difficulty order by created_at),
         array_agg(completed order by created_at)
    into v_count, v_avg_rating, v_avg_pd, v_completion, v_perceived, v_completed
    from public.reviews
   where route_id = p_route_id;

  v_eff := public.calc_effective_difficulty(v_official, v_perceived, v_completed);

  select array_agg(c.severity)
    into v_sev
    from public.review_incidents ri
    join public.incident_categories c on c.category = ri.category
   where ri.route_id = p_route_id
     and ri.created_at > now() - interval '24 months';

  v_score := public.calc_hazard_score(v_sev, v_count);
  v_level := public.calc_hazard_level(v_score);

  if v_level <> 'low' then
    select c.label, count(distinct r.user_id)
      into v_top_label, v_top_users
      from public.review_incidents ri
      join public.reviews r on r.id = ri.review_id
      join public.incident_categories c on c.category = ri.category
     where ri.route_id = p_route_id
       and ri.created_at > now() - interval '24 months'
     group by c.label
     order by count(*) desc, c.label
     limit 1;

    if v_top_label is not null then
      v_note := v_top_users
                || case when v_top_users = 1 then ' hiker reported: ' else ' hikers reported: ' end
                || lower(v_top_label);
    end if;
  end if;

  update public.routes
     set avg_rating               = v_avg_rating,
         avg_perceived_difficulty = v_avg_pd,
         review_count             = coalesce(v_count, 0),
         completion_rate          = v_completion,
         effective_difficulty     = v_eff,
         community_hazard_level   = v_level,
         community_hazard_note    = v_note,
         stats_updated_at         = now()
   where id = p_route_id;
end;
$$;

create or replace function public.reviews_stats_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalc_route_stats(old.route_id);
    return old;
  end if;

  if tg_op = 'UPDATE' and new.route_id is distinct from old.route_id then
    perform public.recalc_route_stats(old.route_id);
  end if;

  perform public.recalc_route_stats(new.route_id);
  return new;
end;
$$;

drop trigger if exists reviews_recalc_stats on public.reviews;
create trigger reviews_recalc_stats
  after insert or update or delete on public.reviews
  for each row execute function public.reviews_stats_trigger();

create or replace function public.review_incidents_stats_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalc_route_stats(old.route_id);
    return old;
  end if;

  if tg_op = 'UPDATE' and new.route_id is distinct from old.route_id then
    perform public.recalc_route_stats(old.route_id);
  end if;

  perform public.recalc_route_stats(new.route_id);
  return new;
end;
$$;

drop trigger if exists review_incidents_recalc_stats on public.review_incidents;
create trigger review_incidents_recalc_stats
  after insert or update or delete on public.review_incidents
  for each row execute function public.review_incidents_stats_trigger();

-- A hazard is only promoted onto the itinerary when two different people
-- report the same thing at the same place.
create or replace view public.route_point_warnings
with (security_invoker = true)
as
select ri.route_id,
       ri.point_id,
       rp.name        as point_name,
       rp.day_number,
       ri.category,
       c.label,
       c.severity,
       count(distinct r.user_id)                      as reporter_count,
       max(ri.created_at)                             as last_reported_at,
       (array_agg(ri.note order by ri.created_at desc))[1] as latest_note
  from public.review_incidents ri
  join public.reviews r             on r.id = ri.review_id
  join public.incident_categories c on c.category = ri.category
  left join public.route_points rp  on rp.id = ri.point_id
 where ri.point_id is not null
   and ri.created_at > now() - interval '24 months'
 group by ri.route_id, ri.point_id, rp.name, rp.day_number, ri.category, c.label, c.severity
having count(distinct r.user_id) >= 2;

grant select on public.route_point_warnings to anon, authenticated;
