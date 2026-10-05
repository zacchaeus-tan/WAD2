-- Feature 1 support + auth fixes.
-- Adds the onboarding quiz fields to profiles, lets a user create their own
-- profile row, and creates the profile automatically on signup.

alter table public.profiles
  add column if not exists experience_level      text,
  add column if not exists longest_distance_km   numeric,
  add column if not exists max_elevation_gain_m  numeric,
  add column if not exists highest_altitude_m    numeric,
  add column if not exists goals_text            text,
  add column if not exists fitness_score         numeric,
  add column if not exists quiz_completed_at     timestamptz;

alter table public.profiles drop constraint if exists profiles_experience_level_check;
alter table public.profiles add constraint profiles_experience_level_check
  check (experience_level is null or experience_level in ('beginner','occasional','regular','experienced'));

alter table public.profiles drop constraint if exists profiles_fitness_score_check;
alter table public.profiles add constraint profiles_fitness_score_check
  check (fitness_score is null or (fitness_score >= 0 and fitness_score <= 100));

-- Without this, registration fails: the client inserts a profiles row after signUp.
drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Belt and braces: create the row server-side so a profile always exists,
-- even for users created from the dashboard or a seed script.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
