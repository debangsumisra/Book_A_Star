-- 004_organizer_profiles.sql
-- The event organizer side.

create table public.organizer_profiles (
  id                 uuid primary key references public.profiles(id) on delete cascade,
  organization_name  text,
  organizer_type     public.organizer_type not null default 'individual',
  city               text,
  website            text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create trigger organizer_profiles_set_updated_at
  before update on public.organizer_profiles
  for each row execute function private.set_updated_at();

-- Used by the events INSERT policy. Security definer so the policy does not
-- re-enter the events table's own RLS while being evaluated.
create or replace function private.owns_event(p_event_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return exists (
    select 1 from public.events e
    where e.id = p_event_id and e.organizer_id = (select auth.uid())
  );
end;
$$;
-- Note: `public.events` does not exist yet. plpgsql function bodies are not
-- resolved until the function is first called, so this is legal here and
-- works once 007_events.sql has run.

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- Organizer profiles are NOT public. An artist gains read access only once a
-- booking links them — that extra policy is added in 008_bookings.sql, since
-- it references a table that does not exist yet. Policies on a table are
-- additive (OR), so adding it later simply widens this base rule.
-- ---------------------------------------------------------------------------

alter table public.organizer_profiles enable row level security;

-- Grants decide whether the table is reachable through the Data API at all;
-- RLS decides which rows come back once it is. Both are required. Without
-- these, every query from the browser fails with "permission denied" and
-- the RLS policies above never even get a chance to run.
grant select, insert, update, delete on public.organizer_profiles to authenticated;

create policy "organizers read their own profile"
  on public.organizer_profiles for select
  to authenticated
  using (id = (select auth.uid()) or private.is_admin());

create policy "organizers create their own profile"
  on public.organizer_profiles for insert
  to authenticated
  with check (id = (select auth.uid()) and private.current_user_role() = 'organizer');

create policy "organizers update their own profile"
  on public.organizer_profiles for update
  to authenticated
  using (id = (select auth.uid()) or private.is_admin())
  with check (id = (select auth.uid()) or private.is_admin());

create policy "organizers delete their own profile"
  on public.organizer_profiles for delete
  to authenticated
  using (id = (select auth.uid()) or private.is_admin());
