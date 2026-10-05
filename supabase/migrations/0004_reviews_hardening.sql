-- Feature 4: one review per user per route, completion flag, 1-4 difficulty
-- scale, and the delete/moderation policies that were missing.

alter table public.reviews
  add column if not exists completed  boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

alter table public.reviews drop constraint if exists reviews_perceived_difficulty_check;
alter table public.reviews add constraint reviews_perceived_difficulty_check
  check (perceived_difficulty between 1 and 4);

alter table public.reviews alter column route_id             set not null;
alter table public.reviews alter column user_id              set not null;
alter table public.reviews alter column rating               set not null;
alter table public.reviews alter column perceived_difficulty set not null;

create unique index if not exists reviews_route_user_uniq
  on public.reviews (route_id, user_id);

create index if not exists reviews_route_id_idx on public.reviews (route_id);

-- Deleting a route or user should not leave orphan reviews.
alter table public.reviews drop constraint if exists reviews_route_id_fkey;
alter table public.reviews add constraint reviews_route_id_fkey
  foreign key (route_id) references public.routes(id) on delete cascade;

alter table public.reviews drop constraint if exists reviews_user_id_fkey;
alter table public.reviews add constraint reviews_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists reviews_touch_updated_at on public.reviews;
create trigger reviews_touch_updated_at
  before update on public.reviews
  for each row execute function public.touch_updated_at();

-- A user must not be able to reassign their review to someone else on update.
drop policy if exists "Users can update their own reviews" on public.reviews;
create policy "Users can update their own reviews"
  on public.reviews for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own reviews" on public.reviews;
create policy "Users can delete their own reviews"
  on public.reviews for delete
  using (auth.uid() = user_id);

drop policy if exists "Admins can moderate reviews" on public.reviews;
create policy "Admins can moderate reviews"
  on public.reviews for delete
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));
