-- 006_availability.sql
-- Dates the artist has manually blocked off.
--
-- Design note: this table holds ONLY manual blocks. Dates that are busy
-- because of a confirmed booking are derived from `bookings` at query time
-- (see public.artist_is_available in 013_search.sql).
--
-- The alternative — writing a 'booked' row in here whenever a booking is
-- confirmed — makes queries slightly simpler but stores the same fact twice.
-- The moment a booking is cancelled and the cleanup fails, the calendar lies.
-- One source of truth per fact.

create table public.availability (
  id         uuid primary key default gen_random_uuid(),
  artist_id  uuid not null references public.artist_profiles(id) on delete cascade,
  date       date not null,
  note       text,
  created_at timestamptz not null default now(),

  -- An artist cannot block the same day twice.
  unique (artist_id, date)
);

create index availability_artist_date_idx on public.availability (artist_id, date);

alter table public.availability enable row level security;

-- Grants decide whether the table is reachable through the Data API at all;
-- RLS decides which rows come back once it is. Both are required. Without
-- these, every query from the browser fails with "permission denied" and
-- the RLS policies above never even get a chance to run.
grant select                         on public.availability to anon;
grant select, insert, update, delete on public.availability to authenticated;

-- Readable by anyone so the public artist profile can render a calendar.
-- Only the date is exposed, never why it is blocked for logged-out visitors —
-- `note` is free text, so keep it out of the public card in the UI.
create policy "availability of published artists is public"
  on public.availability for select
  to anon, authenticated
  using (
    private.artist_is_published(artist_id)
    or artist_id = (select auth.uid())
    or private.is_admin()
  );

create policy "artists block their own dates"
  on public.availability for insert
  to authenticated
  with check (artist_id = (select auth.uid()));

create policy "artists update their own blocked dates"
  on public.availability for update
  to authenticated
  using (artist_id = (select auth.uid()))
  with check (artist_id = (select auth.uid()));

create policy "artists unblock their own dates"
  on public.availability for delete
  to authenticated
  using (artist_id = (select auth.uid()) or private.is_admin());
