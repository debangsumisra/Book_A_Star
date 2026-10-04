-- 010_reviews.sql
-- Organizer reviews the artist after a completed booking. One review per
-- booking, so a review can never exist without a real engagement behind it.
--
-- One-directional for v1, per the brief. If artists should also rate
-- organizers later, that is a new `reviewee_type` column plus a widened
-- unique constraint — plan for it, do not build it now.

create table public.reviews (
  id          uuid primary key default gen_random_uuid(),

  -- UNIQUE: one review per booking, enforced by the database rather than by
  -- hoping the UI hides the button.
  booking_id  uuid not null unique references public.bookings(id) on delete cascade,

  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  artist_id   uuid not null references public.artist_profiles(id) on delete cascade,

  rating      integer not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now()
);

create index reviews_artist_idx   on public.reviews (artist_id, created_at desc);
create index reviews_reviewer_idx on public.reviews (reviewer_id);

-- The client sends booking_id; artist_id is derived here so a reviewer cannot
-- aim a 1-star review at an artist they never booked.
create or replace function private.sync_review_artist()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_artist uuid;
begin
  select b.artist_id into v_artist
  from public.bookings b
  where b.id = new.booking_id;

  if v_artist is null then
    raise exception 'Booking % does not exist', new.booking_id;
  end if;

  new.artist_id := v_artist;
  return new;
end;
$$;

create trigger reviews_sync_artist
  before insert on public.reviews
  for each row execute function private.sync_review_artist();

-- ---------------------------------------------------------------------------
-- Denormalized rating on artist_profiles
--
-- Recomputed from scratch rather than incremented, so it cannot drift.
-- Cheap at this scale; revisit only if an artist ever has tens of thousands
-- of reviews.
--
-- This UPDATE fires lock_artist_verification at pg_trigger_depth() = 2, which
-- is exactly the case that trigger waves through.
-- ---------------------------------------------------------------------------

create or replace function private.recalc_artist_rating()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_artist uuid;
begin
  v_artist := coalesce(new.artist_id, old.artist_id);

  update public.artist_profiles a
     set rating_avg = coalesce(
           (select round(avg(r.rating)::numeric, 2)
              from public.reviews r where r.artist_id = v_artist), 0),
         rating_count = (
           select count(*) from public.reviews r where r.artist_id = v_artist)
   where a.id = v_artist;

  return null;
end;
$$;

create trigger reviews_recalc_rating
  after insert or update or delete on public.reviews
  for each row execute function private.recalc_artist_rating();

-- The gate: you may only review a booking you organized, and only once it is
-- actually completed.
create or replace function private.can_review_booking(p_booking_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return exists (
    select 1 from public.bookings b
    where b.id = p_booking_id
      and b.organizer_id = (select auth.uid())
      and b.status = 'completed'
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.reviews enable row level security;

-- Grants decide whether the table is reachable through the Data API at all;
-- RLS decides which rows come back once it is. Both are required. Without
-- these, every query from the browser fails with "permission denied" and
-- the RLS policies above never even get a chance to run.
grant select                         on public.reviews to anon;
grant select, insert, update, delete on public.reviews to authenticated;

-- Reviews are public: they are the trust signal on an artist profile, and
-- logged-out visitors must be able to read them.
create policy "reviews are public"
  on public.reviews for select
  to anon, authenticated
  using (true);

create policy "organizers review their completed bookings"
  on public.reviews for insert
  to authenticated
  with check (
    reviewer_id = (select auth.uid())
    and private.can_review_booking(booking_id)
  );

create policy "reviewers edit their own review"
  on public.reviews for update
  to authenticated
  using (reviewer_id = (select auth.uid()))
  with check (reviewer_id = (select auth.uid()));

create policy "reviewers or admins remove a review"
  on public.reviews for delete
  to authenticated
  using (reviewer_id = (select auth.uid()) or private.is_admin());
