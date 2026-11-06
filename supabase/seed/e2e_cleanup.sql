-- e2e_cleanup.sql
-- Removes everything the Playwright runs created (events, bookings, messages,
-- notifications), keeping the three test accounts themselves. Run in the SQL
-- editor (as the table owner, which bypasses RLS) whenever you want a tidy DB.
--
-- Bookings are ON DELETE RESTRICT from events, so they go first; messages,
-- reviews and notifications cascade from bookings.

delete from public.bookings
 where organizer_id in ('e2e00000-0000-4000-8000-000000000001', 'e2e00000-0000-4000-8000-000000000003')
    or artist_id = 'e2e00000-0000-4000-8000-000000000002';

delete from public.events
 where organizer_id in ('e2e00000-0000-4000-8000-000000000001', 'e2e00000-0000-4000-8000-000000000003');

delete from public.availability where artist_id = 'e2e00000-0000-4000-8000-000000000002';
delete from public.notifications
 where user_id in ('e2e00000-0000-4000-8000-000000000001', 'e2e00000-0000-4000-8000-000000000002', 'e2e00000-0000-4000-8000-000000000003');
delete from public.reports
 where reporter_id in ('e2e00000-0000-4000-8000-000000000001', 'e2e00000-0000-4000-8000-000000000002', 'e2e00000-0000-4000-8000-000000000003');

-- To remove the accounts entirely as well (profiles cascade from auth.users):
-- delete from auth.users where email like 'e2e-%@bookastar.test';
