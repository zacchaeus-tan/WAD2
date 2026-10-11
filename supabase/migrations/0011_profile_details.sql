-- Profile creation fields: age, gender, country and an optional "about" blurb.
-- Name reuses the existing display_name column; email and password live in auth.users.

alter table public.profiles
  add column if not exists age      integer,
  add column if not exists gender   text,
  add column if not exists country  text,
  add column if not exists about    text;

alter table public.profiles drop constraint if exists profiles_age_check;
alter table public.profiles add constraint profiles_age_check
  check (age is null or (age >= 13 and age <= 120));

alter table public.profiles drop constraint if exists profiles_gender_check;
alter table public.profiles add constraint profiles_gender_check
  check (gender is null or gender in ('female','male','non_binary','prefer_not_to_say'));

alter table public.profiles drop constraint if exists profiles_about_check;
alter table public.profiles add constraint profiles_about_check
  check (about is null or char_length(about) <= 500);

-- Signup passes the new fields as user metadata, same as display_name.
-- Anything missing or malformed is stored as null rather than failing the signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, display_name, age, gender, country, about)
  values (
    new.id,
    coalesce(nullif(trim(meta->>'display_name'), ''), split_part(new.email, '@', 1)),
    case when meta->>'age' ~ '^\d{1,3}$' and (meta->>'age')::int between 13 and 120
         then (meta->>'age')::int end,
    case when meta->>'gender' in ('female','male','non_binary','prefer_not_to_say')
         then meta->>'gender' end,
    nullif(trim(meta->>'country'), ''),
    nullif(left(trim(meta->>'about'), 500), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
