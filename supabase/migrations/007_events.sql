-- 007_events.sql
-- Events posted by organizers.

create table public.events (
  id              uuid primary key default gen_random_uuid(),
  organizer_id    uuid not null references public.organizer_profiles(id) on delete cascade,

  title           text not null check (length(trim(title)) > 0),
  event_type      public.event_type not null default 'other',
  event_date      date not null,
  start_time      time,
  duration_hours  numeric(4,1) check (duration_hours > 0),

  city            text not null,
  venue           text,

  budget_min      numeric(10,2) check (budget_min >= 0),
  budget_max      numeric(10,2) check (budget_max >= 0),
  audience_size   integer check (audience_size > 0),
  requirements    text,

  status          public.event_status not null default 'open',
  is_public       boolean not null default true,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint budget_range_is_sane
    check (budget_min is null or budget_max is null or budget_max >= budget_min)
);

create index events_organizer_idx on public.events (organizer_id, status);
create index events_browse_idx    on public.events (event_date) where is_public and status = 'open';
create index events_city_idx      on public.events (lower(city));

create trigger events_set_updated_at
  before update on public.events
  for each row execute function private.set_updated_at();

alter table public.events enable row level security;

-- Grants decide whether the table is reachable through the Data API at all;
-- RLS decides which rows come back once it is. Both are required. Without
-- these, every query from the browser fails with "permission denied" and
-- the RLS policies above never even get a chance to run.
grant select, insert, update, delete on public.events to authenticated;

-- Owner sees everything of theirs. Everyone signed in sees open public events
-- (this is how artists discover work). A second policy in 008_bookings.sql
-- additionally lets a booked artist see the event even after it closes.
create policy "open events are visible to signed-in users"
  on public.events for select
  to authenticated
  using (
    organizer_id = (select auth.uid())
    or private.is_admin()
    or (is_public and status = 'open')
  );

create policy "organizers post their own events"
  on public.events for insert
  to authenticated
  with check (
    organizer_id = (select auth.uid())
    and private.current_user_role() = 'organizer'
  );

create policy "organizers update their own events"
  on public.events for update
  to authenticated
  using (organizer_id = (select auth.uid()) or private.is_admin())
  with check (organizer_id = (select auth.uid()) or private.is_admin());

-- Deleting is only offered while nothing is in motion. The "no bookings exist"
-- half of that rule is enforced by the database itself: bookings.event_id is
-- ON DELETE RESTRICT (see 008), so the delete fails if any booking references
-- this event. Writing it as an EXISTS check in the policy would be a second,
-- weaker copy of a rule the foreign key already guarantees.
create policy "organizers delete their own unstarted events"
  on public.events for delete
  to authenticated
  using (
    (organizer_id = (select auth.uid()) and status in ('draft', 'open'))
    or private.is_admin()
  );
