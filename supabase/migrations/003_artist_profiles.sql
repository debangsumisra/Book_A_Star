-- 003_artist_profiles.sql
-- The artist (Star) side of the platform.

create table public.artist_profiles (
  -- The primary key IS the foreign key. This enforces one artist profile per
  -- user with no extra constraint, and makes `artist_id = auth.uid()` work
  -- directly inside RLS policies with no join.
  id                    uuid primary key references public.profiles(id) on delete cascade,

  stage_name            text not null,
  category              public.artist_category not null default 'other',
  bio                   text,
  languages             text[] not null default '{}',
  base_city             text not null default '',
  travels_outside_city  boolean not null default false,

  price_min             numeric(10,2) not null default 0 check (price_min >= 0),
  price_per_event       numeric(10,2) check (price_per_event >= 0),
  price_per_hour        numeric(10,2) check (price_per_hour >= 0),
  currency              text not null default 'INR' check (char_length(currency) = 3),

  experience_years      integer check (experience_years >= 0),
  avatar_url            text,
  cover_image_url       text,

  -- Artist-controlled: is this profile listed in the directory at all.
  is_published          boolean not null default false,

  -- Admin-controlled (Phase 2). Guarded by the trigger below.
  verification_status   public.verification_status not null default 'pending',
  is_verified           boolean not null default false,

  -- System-maintained. Recomputed by a trigger in 010_reviews.sql.
  rating_avg            numeric(3,2) not null default 0,
  rating_count          integer not null default 0,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index artist_published_idx on public.artist_profiles (is_published) where is_published;
create index artist_category_idx  on public.artist_profiles (category);
create index artist_city_idx      on public.artist_profiles (lower(base_city));
create index artist_rating_idx    on public.artist_profiles (rating_avg desc);

create trigger artist_profiles_set_updated_at
  before update on public.artist_profiles
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Guard: artists must not verify themselves or invent their own rating
--
-- Same shape of hole as the role column: these live on the row the artist is
-- allowed to update, so RLS alone cannot protect them.
--
-- `pg_trigger_depth() > 1` means this UPDATE was issued by another trigger —
-- specifically the rating recalculation in 010_reviews.sql — rather than
-- typed by a user. That is the one case where rating_* may legitimately move.
-- ---------------------------------------------------------------------------

create or replace function private.lock_artist_verification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if pg_trigger_depth() > 1 or private.is_admin() then
    return new;
  end if;

  if new.is_verified is distinct from old.is_verified
     or new.verification_status is distinct from old.verification_status then
    raise exception 'Only an admin can change verification status';
  end if;

  if new.rating_avg is distinct from old.rating_avg
     or new.rating_count is distinct from old.rating_count then
    raise exception 'Ratings are maintained by the system, not set by hand';
  end if;

  return new;
end;
$$;

create trigger artist_profiles_lock_verification
  before update on public.artist_profiles
  for each row execute function private.lock_artist_verification();

-- Used by portfolio_items and availability policies. Security definer so that
-- those policies do not re-enter this table's own RLS.
create or replace function private.artist_is_published(p_artist_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return coalesce(
    (select a.is_published from public.artist_profiles a where a.id = p_artist_id),
    false
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.artist_profiles enable row level security;

-- Grants decide whether the table is reachable through the Data API at all;
-- RLS decides which rows come back once it is. Both are required. Without
-- these, every query from the browser fails with "permission denied" and
-- the RLS policies above never even get a chance to run.
grant select                          on public.artist_profiles to anon;
grant select, insert, update, delete  on public.artist_profiles to authenticated;

-- `to anon` matters: the landing page and directory must work logged out.
-- For an anonymous caller auth.uid() is null, so `id = auth.uid()` is null,
-- which is not true — unpublished profiles stay hidden.
create policy "published artists are publicly visible"
  on public.artist_profiles for select
  to anon, authenticated
  using (is_published or id = (select auth.uid()) or private.is_admin());

create policy "artists create their own profile"
  on public.artist_profiles for insert
  to authenticated
  with check (id = (select auth.uid()) and private.current_user_role() = 'artist');

create policy "artists update their own profile"
  on public.artist_profiles for update
  to authenticated
  using (id = (select auth.uid()) or private.is_admin())
  with check (id = (select auth.uid()) or private.is_admin());

create policy "artists delete their own profile"
  on public.artist_profiles for delete
  to authenticated
  using (id = (select auth.uid()) or private.is_admin());
