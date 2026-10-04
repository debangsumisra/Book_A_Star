-- 008_bookings.sql
-- The heart of the platform: one row per (event x artist) negotiation.

create table public.bookings (
  id               uuid primary key default gen_random_uuid(),

  -- RESTRICT, not CASCADE: booking history must survive. You cannot delete an
  -- event or an artist out from under a real booking.
  event_id         uuid not null references public.events(id) on delete restrict,
  artist_id        uuid not null references public.artist_profiles(id) on delete restrict,

  -- Denormalized copies of facts that live on `events`.
  --   organizer_id -> lets every RLS policy here be a plain column comparison
  --                   instead of a join into events (which would itself be
  --                   subject to the events policies).
  --   event_date   -> required by the double-booking unique index below;
  --                   a partial unique index cannot reach across a join.
  -- Both are kept honest by triggers, never written by the client.
  organizer_id     uuid not null references public.organizer_profiles(id) on delete restrict,
  event_date       date not null,

  initiated_by     public.user_role not null,
  status           public.booking_status not null default 'requested',

  proposed_price   numeric(10,2) check (proposed_price >= 0),
  agreed_price     numeric(10,2) check (agreed_price >= 0),
  currency         text not null default 'INR' check (char_length(currency) = 3),
  notes            text,

  cancelled_by        uuid references public.profiles(id) on delete set null,
  cancellation_reason text,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  -- One negotiation thread per artist per event.
  unique (event_id, artist_id)
);

-- ---------------------------------------------------------------------------
-- THE DOUBLE-BOOKING GUARD
--
-- The single most important line in this schema. Two organizers confirming the
-- same artist for the same date in the same second will both pass any check
-- written in JavaScript. Postgres rejects the second one.
--
-- It is a PARTIAL index: only live commitments occupy a date. Rejected and
-- cancelled bookings do not, so a date frees up automatically when a booking
-- falls through.
-- ---------------------------------------------------------------------------
create unique index bookings_no_double_booking
  on public.bookings (artist_id, event_date)
  where status in ('accepted', 'confirmed');

create index bookings_artist_idx    on public.bookings (artist_id, status);
create index bookings_organizer_idx on public.bookings (organizer_id, status);
create index bookings_event_idx     on public.bookings (event_id);
-- FK columns are not indexed automatically; an unindexed FK makes every
-- ON DELETE action scan the whole table.
create index bookings_cancelled_by_idx on public.bookings (cancelled_by);

create trigger bookings_set_updated_at
  before update on public.bookings
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Keep the denormalized columns truthful
-- ---------------------------------------------------------------------------

create or replace function private.sync_booking_from_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_date date;
  v_org  uuid;
begin
  select e.event_date, e.organizer_id
    into v_date, v_org
  from public.events e
  where e.id = new.event_id;

  if v_date is null then
    raise exception 'Event % does not exist', new.event_id;
  end if;

  -- Overwrite whatever the client sent. These are derived, not input.
  new.event_date   := v_date;
  new.organizer_id := v_org;
  return new;
end;
$$;

create trigger bookings_sync_from_event
  before insert or update of event_id on public.bookings
  for each row execute function private.sync_booking_from_event();

-- If the organizer moves the event date, every booking must follow — otherwise
-- the double-booking index is guarding the wrong day.
create or replace function private.propagate_event_date()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.event_date is distinct from old.event_date then
    update public.bookings b
       set event_date = new.event_date
     where b.event_id = new.id;
  end if;
  return new;
end;
$$;

create trigger events_propagate_date
  after update of event_date on public.events
  for each row execute function private.propagate_event_date();

-- ---------------------------------------------------------------------------
-- The booking state machine
--
-- RLS can check what a row looks like, but not how it got there. "An artist
-- may accept a request" is a statement about a transition, so it lives here.
-- ---------------------------------------------------------------------------

create or replace function private.enforce_booking_transition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_is_artist    boolean;
  v_is_organizer boolean;
  v_allowed      boolean := false;
begin
  if private.is_admin() then
    return new;
  end if;

  -- Because artist_profiles.id and organizer_profiles.id are both the user's
  -- own id, "who am I in this booking" is a direct comparison.
  v_is_artist    := old.artist_id = auth.uid();
  v_is_organizer := old.organizer_id = auth.uid();

  if new.event_id is distinct from old.event_id
     or new.artist_id is distinct from old.artist_id
     or new.organizer_id is distinct from old.organizer_id then
    raise exception 'The event, artist and organizer of a booking cannot be changed';
  end if;

  -- Price and note edits with no status change are always fine for a participant.
  if new.status = old.status then
    return new;
  end if;

  case old.status
    when 'requested' then
      v_allowed := (v_is_artist    and new.status in ('negotiating', 'accepted', 'rejected'))
                or (v_is_organizer and new.status in ('negotiating', 'cancelled'));

    when 'negotiating' then
      v_allowed := (v_is_artist    and new.status in ('accepted', 'rejected'))
                or (v_is_organizer and new.status = 'cancelled');

    when 'accepted' then
      -- Only the organizer commits.
      v_allowed := (v_is_organizer and new.status = 'confirmed')
                or ((v_is_artist or v_is_organizer) and new.status = 'cancelled');

    when 'confirmed' then
      v_allowed := (v_is_artist or v_is_organizer)
                   and (
                     new.status = 'cancelled'
                     or (new.status = 'completed' and current_date >= old.event_date)
                   );

    else
      -- completed, rejected, cancelled are terminal.
      v_allowed := false;
  end case;

  if not v_allowed then
    raise exception 'Illegal booking transition: % -> % (not permitted for this user)',
      old.status, new.status;
  end if;

  if new.status = 'cancelled' and new.cancelled_by is null then
    new.cancelled_by := auth.uid();
  end if;

  return new;
end;
$$;

create trigger bookings_enforce_transition
  before update on public.bookings
  for each row execute function private.enforce_booking_transition();

-- Used by the messages policies in 009.
create or replace function private.is_booking_participant(p_booking_id uuid)
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
      and (b.artist_id = (select auth.uid()) or b.organizer_id = (select auth.uid()))
  );
end;
$$;

create or replace function private.booking_is_open(p_booking_id uuid)
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
      and b.status not in ('completed', 'rejected', 'cancelled')
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.bookings enable row level security;

-- Grants decide whether the table is reachable through the Data API at all;
-- RLS decides which rows come back once it is. Both are required. Without
-- these, every query from the browser fails with "permission denied" and
-- the RLS policies above never even get a chance to run.
-- DELETE is granted because admins authenticate as the `authenticated` role
-- too; the policy below is what restricts it to them.
grant select, insert, update, delete on public.bookings to authenticated;

create policy "participants read their bookings"
  on public.bookings for select
  to authenticated
  using (
    artist_id = (select auth.uid())
    or organizer_id = (select auth.uid())
    or private.is_admin()
  );

-- Every booking starts life as 'requested'. Nobody inserts a row that is
-- already confirmed.
create policy "a request may be opened by either side"
  on public.bookings for insert
  to authenticated
  with check (
    status = 'requested'
    and (
      (initiated_by = 'organizer' and organizer_id = (select auth.uid()) and private.owns_event(event_id))
      or
      (initiated_by = 'artist' and artist_id = (select auth.uid()) and private.current_user_role() = 'artist')
    )
  );

create policy "participants update their booking"
  on public.bookings for update
  to authenticated
  using (
    artist_id = (select auth.uid())
    or organizer_id = (select auth.uid())
    or private.is_admin()
  )
  with check (
    artist_id = (select auth.uid())
    or organizer_id = (select auth.uid())
    or private.is_admin()
  );

-- No delete for users: a booking is cancelled, never erased. The history is
-- the record of what happened.
create policy "admins delete bookings"
  on public.bookings for delete
  to authenticated
  using (private.is_admin());

-- ---------------------------------------------------------------------------
-- Deferred policies from earlier migrations
-- Policies on a table are additive (OR), so these widen the base rules.
-- ---------------------------------------------------------------------------

-- An artist may see the organizer behind a booking they are part of.
create policy "artists see organizers they have a booking with"
  on public.organizer_profiles for select
  to authenticated
  using (
    exists (
      select 1 from public.bookings b
      where b.organizer_id = organizer_profiles.id
        and b.artist_id = (select auth.uid())
    )
  );

-- An artist may see a booked event even after it is closed to new requests.
create policy "artists see events they are booked for"
  on public.events for select
  to authenticated
  using (
    exists (
      select 1 from public.bookings b
      where b.event_id = events.id
        and b.artist_id = (select auth.uid())
    )
  );
