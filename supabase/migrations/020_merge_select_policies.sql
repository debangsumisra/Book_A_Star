-- 020_merge_select_policies.sql
-- Performance advisor: "multiple permissive policies". Postgres evaluates
-- EVERY permissive policy for a role+action and ORs the results, so two
-- policies cost two checks per row. Merging each pair into one policy with
-- the same OR gives identical access with one evaluation.
--
-- Behaviour is unchanged; supabase/tests/001 passes before and after.

-- artist_profiles (003 + 018)
drop policy "published artists are publicly visible" on public.artist_profiles;
drop policy "organizers see artists they have a booking with" on public.artist_profiles;

create policy "artists visible when published, to self, counterparties and admins"
  on public.artist_profiles for select
  to anon, authenticated
  using (
    is_published
    or id = (select auth.uid())
    or private.shares_booking_with(id)
    or private.is_admin()
  );

-- events (007 + 008)
drop policy "open events are visible to signed-in users" on public.events;
drop policy "artists see events they are booked for" on public.events;

create policy "events visible to owner, admins, booked artists, or when open"
  on public.events for select
  to authenticated
  using (
    organizer_id = (select auth.uid())
    or private.is_admin()
    or (is_public and status = 'open')
    or exists (
      select 1 from public.bookings b
      where b.event_id = events.id and b.artist_id = (select auth.uid())
    )
  );

-- organizer_profiles (004 + 008)
drop policy "organizers read their own profile" on public.organizer_profiles;
drop policy "artists see organizers they have a booking with" on public.organizer_profiles;

create policy "organizers visible to self, admins and booked artists"
  on public.organizer_profiles for select
  to authenticated
  using (
    id = (select auth.uid())
    or private.is_admin()
    or exists (
      select 1 from public.bookings b
      where b.organizer_id = organizer_profiles.id and b.artist_id = (select auth.uid())
    )
  );
