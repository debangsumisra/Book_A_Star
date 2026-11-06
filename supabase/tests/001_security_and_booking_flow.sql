-- 001_security_and_booking_flow.sql
-- Database tests for RLS and the booking rules. Paste into the SQL editor and
-- run. Everything happens inside one transaction that ROLLS BACK at the end,
-- so it never leaves test users or rows behind.
--
-- How impersonation works: Supabase's auth.uid() reads the `sub` claim from
-- the `request.jwt.claims` setting, and the Data API runs queries as the
-- `authenticated` (or `anon`) role. Setting both reproduces exactly what a
-- browser request from that user looks like — including every RLS policy.
--
-- Any failed check raises an exception, which aborts the whole run. If the
-- final line prints 'ALL TESTS PASSED', every check held.

begin;

-- ---------------------------------------------------------------------------
-- Helpers (pg_temp = vanish with the session)
-- ---------------------------------------------------------------------------

create function pg_temp.login_as(p_user uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
end $$;

create function pg_temp.login_as_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  execute 'set local role anon';
end $$;

create function pg_temp.check(p_ok boolean, p_name text) returns void language plpgsql as $$
begin
  if p_ok is not true then raise exception 'FAILED: %', p_name; end if;
  raise notice 'ok - %', p_name;
end $$;

-- Runs a statement that MUST fail. Passing means the database refused it.
create function pg_temp.must_fail(p_sql text, p_name text) returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    raise notice 'ok - % (refused: %)', p_name, sqlerrm;
    return;
  end;
  raise exception 'FAILED: % — the statement succeeded but should have been refused', p_name;
end $$;

grant execute on all functions in schema pg_temp to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Test users. Inserting into auth.users fires handle_new_user, exactly like
-- a real signup.
-- ---------------------------------------------------------------------------

insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'artist_a@test.local',  '{"role":"artist","full_name":"Artist A"}'),
  ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'org_b@test.local',     '{"role":"organizer","full_name":"Org B"}'),
  ('00000000-0000-0000-0000-00000000000c', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'org_c@test.local',     '{"role":"organizer","full_name":"Org C"}'),
  ('00000000-0000-0000-0000-00000000000d', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sneaky@test.local',    '{"role":"admin","full_name":"Sneaky"}');

select pg_temp.check(
  (select role from public.profiles where id = '00000000-0000-0000-0000-00000000000a') = 'artist',
  'signup trigger creates an artist profile row');
select pg_temp.check(
  (select role from public.profiles where id = '00000000-0000-0000-0000-00000000000d') = 'organizer',
  'signing up with role=admin is downgraded to organizer');

-- ---------------------------------------------------------------------------
-- Identity and profiles
-- ---------------------------------------------------------------------------

select pg_temp.login_as('00000000-0000-0000-0000-00000000000a');
select pg_temp.must_fail(
  $q$update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-00000000000a'$q$,
  'user cannot promote themselves to admin');

update public.profiles_private set phone = '9999999999' where id = '00000000-0000-0000-0000-00000000000a';

insert into public.artist_profiles (id, stage_name, category, base_city, price_min, bio, languages)
values ('00000000-0000-0000-0000-00000000000a', 'DJ Test', 'dj', 'Pune', 10000,
        'A bio that is definitely long enough to publish.', '{Hindi,English}');

select pg_temp.must_fail(
  $q$update public.artist_profiles set is_verified = true where id = '00000000-0000-0000-0000-00000000000a'$q$,
  'artist cannot verify themselves');
select pg_temp.must_fail(
  $q$update public.artist_profiles set rating_avg = 5 where id = '00000000-0000-0000-0000-00000000000a'$q$,
  'artist cannot set their own rating');

select pg_temp.login_as('00000000-0000-0000-0000-00000000000b');
select pg_temp.must_fail(
  $q$insert into public.artist_profiles (id, stage_name) values ('00000000-0000-0000-0000-00000000000b', 'Fake')$q$,
  'organizer cannot create an artist profile');
insert into public.organizer_profiles (id, organizer_type, city) values ('00000000-0000-0000-0000-00000000000b', 'company', 'Pune');

select pg_temp.check(
  not exists (select 1 from public.artist_profiles where id = '00000000-0000-0000-0000-00000000000a'),
  'unpublished artist is invisible to organizers');
select pg_temp.check(
  not exists (select 1 from public.profiles_private where id = '00000000-0000-0000-0000-00000000000a'),
  'another user cannot read an artist phone number');

select pg_temp.login_as('00000000-0000-0000-0000-00000000000c');
insert into public.organizer_profiles (id, organizer_type, city) values ('00000000-0000-0000-0000-00000000000c', 'individual', 'Pune');
select pg_temp.check(
  not exists (select 1 from public.organizer_profiles where id = '00000000-0000-0000-0000-00000000000b'),
  'organizer profiles are private from other organizers');

select pg_temp.login_as('00000000-0000-0000-0000-00000000000a');
select pg_temp.check(
  not exists (select 1 from public.organizer_profiles where id = '00000000-0000-0000-0000-00000000000b'),
  'an artist cannot see an organizer they have no booking with');
update public.artist_profiles set is_published = true where id = '00000000-0000-0000-0000-00000000000a';

select pg_temp.login_as_anon();
select pg_temp.check(
  exists (select 1 from public.artist_profiles where id = '00000000-0000-0000-0000-00000000000a'),
  'published artist is visible while logged out');
select pg_temp.check(
  (select count(*) from public.search_artists(p_city => 'pune', p_category => 'dj')) >= 1,
  'search_artists finds the artist by city and category');
select pg_temp.must_fail('select * from public.profiles_private', 'anon cannot touch profiles_private');
select pg_temp.must_fail('select * from public.events', 'anon cannot read events at all');

-- ---------------------------------------------------------------------------
-- Events
-- ---------------------------------------------------------------------------

select pg_temp.login_as('00000000-0000-0000-0000-00000000000a');
select pg_temp.must_fail(
  $q$insert into public.events (organizer_id, title, event_date, city) values ('00000000-0000-0000-0000-00000000000a', 'x', current_date + 10, 'Pune')$q$,
  'artist cannot post an event');

select pg_temp.login_as('00000000-0000-0000-0000-00000000000b');
insert into public.events (id, organizer_id, title, event_type, event_date, city, budget_min, budget_max)
values ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-00000000000b',
        'College Fest', 'college_fest', current_date + 30, 'Pune', 5000, 20000);
insert into public.events (id, organizer_id, title, event_date, city, is_public)
values ('00000000-0000-0000-0000-0000000000e9', '00000000-0000-0000-0000-00000000000b',
        'Private party', current_date + 30, 'Pune', false);

select pg_temp.login_as('00000000-0000-0000-0000-00000000000a');
select pg_temp.check(
  not exists (select 1 from public.events where id = '00000000-0000-0000-0000-0000000000e9'),
  'a private event is hidden from artists');
select pg_temp.check(
  exists (select 1 from public.events where id = '00000000-0000-0000-0000-0000000000e1'),
  'an open public event is visible to artists');

select pg_temp.login_as('00000000-0000-0000-0000-00000000000c');
insert into public.events (id, organizer_id, title, event_date, city)
values ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-00000000000c',
        'Wedding', current_date + 30, 'Pune');
-- RLS does not error on someone else's row; it silently matches 0 rows.
insert into public.events (id, organizer_id, title, event_date, city)
values ('00000000-0000-0000-0000-0000000000e3', '00000000-0000-0000-0000-00000000000c',
        'Corporate night', current_date + 35, 'Pune');
with changed as (
  update public.events set title = 'hijacked'
  where id = '00000000-0000-0000-0000-0000000000e1' returning 1
)
select pg_temp.check((select count(*) from changed) = 0, 'organizer C cannot edit organizer B''s event');

-- ---------------------------------------------------------------------------
-- The booking loop
-- ---------------------------------------------------------------------------

select pg_temp.login_as('00000000-0000-0000-0000-00000000000b');
insert into public.bookings (id, event_id, artist_id, organizer_id, event_date, initiated_by, proposed_price)
values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000e1',
        '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b',
        current_date, 'organizer', 12000);

select pg_temp.check(
  (select event_date from public.bookings where id = '00000000-0000-0000-0000-0000000000b1') = current_date + 30,
  'event_date is copied from the event, not trusted from the client');
select pg_temp.must_fail(
  $q$insert into public.bookings (event_id, artist_id, organizer_id, event_date, initiated_by)
     values ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b', current_date, 'organizer')$q$,
  'the same artist cannot be requested twice for one event');
select pg_temp.must_fail(
  $q$insert into public.bookings (event_id, artist_id, organizer_id, event_date, initiated_by, status)
     values ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b', current_date, 'organizer', 'confirmed')$q$,
  'a booking cannot be created already confirmed');
select pg_temp.must_fail(
  $q$insert into public.bookings (event_id, artist_id, organizer_id, event_date, initiated_by)
     values ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b', current_date, 'organizer')$q$,
  'organizer B cannot book an artist for organizer C''s event');

select pg_temp.login_as('00000000-0000-0000-0000-00000000000a');
select pg_temp.check(
  exists (select 1 from public.organizer_profiles where id = '00000000-0000-0000-0000-00000000000b'),
  'once booked, the artist can see the organizer');
select pg_temp.check(
  (select count(*) from public.notifications where type = 'booking_request') = 1,
  'artist was notified of the new request');
select pg_temp.must_fail(
  $q$update public.bookings set status = 'confirmed' where id = '00000000-0000-0000-0000-0000000000b1'$q$,
  'artist cannot jump straight to confirmed');

-- Counter-offer: a price change alone moves the booking to 'negotiating' (019).
update public.bookings set proposed_price = 15000
where id = '00000000-0000-0000-0000-0000000000b1';
select pg_temp.check(
  (select status from public.bookings where id = '00000000-0000-0000-0000-0000000000b1') = 'negotiating',
  'a counter-offer moves the booking to negotiating');
select pg_temp.must_fail(
  $q$update public.bookings set status = 'accepted' where id = '00000000-0000-0000-0000-0000000000b1'$q$,
  'artist cannot accept their own counter-offer');

insert into public.messages (booking_id, sender_id, body)
values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000000a', 'Can do 15k with sound included.');

select pg_temp.login_as('00000000-0000-0000-0000-00000000000b');
select pg_temp.must_fail(
  $q$update public.bookings set status = 'rejected' where id = '00000000-0000-0000-0000-0000000000b1'$q$,
  'the initiator cannot reject (they withdraw instead)');
select pg_temp.check(
  (select count(*) from public.messages where booking_id = '00000000-0000-0000-0000-0000000000b1') >= 2,
  'organizer reads the thread (text + system message)');

select pg_temp.login_as('00000000-0000-0000-0000-00000000000c');
select pg_temp.check(
  not exists (select 1 from public.bookings where id = '00000000-0000-0000-0000-0000000000b1'),
  'an unrelated organizer cannot see the booking');
select pg_temp.check(
  not exists (select 1 from public.messages where booking_id = '00000000-0000-0000-0000-0000000000b1'),
  'an unrelated organizer cannot read the thread');
select pg_temp.must_fail(
  $q$insert into public.messages (booking_id, sender_id, body) values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000000c', 'hi')$q$,
  'an unrelated organizer cannot post into the thread');
select pg_temp.must_fail(
  $q$insert into public.notifications (user_id, type, title) values ('00000000-0000-0000-0000-00000000000a', 'system', 'spam')$q$,
  'users cannot create notifications for others');

select pg_temp.login_as('00000000-0000-0000-0000-00000000000b');
update public.bookings set status = 'accepted' where id = '00000000-0000-0000-0000-0000000000b1';
select pg_temp.check(
  (select agreed_price from public.bookings where id = '00000000-0000-0000-0000-0000000000b1') = 15000,
  'organizer accepts the artist''s counter; agreed_price = the offer on the table');
select pg_temp.must_fail(
  $q$update public.bookings set proposed_price = 1 where id = '00000000-0000-0000-0000-0000000000b1'$q$,
  'price is locked after acceptance');

-- Artist applies to organizer C's open public event (initiated_by = 'artist').
select pg_temp.login_as('00000000-0000-0000-0000-00000000000a');
insert into public.bookings (id, event_id, artist_id, organizer_id, event_date, initiated_by, proposed_price)
values ('00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-0000000000e3',
        '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000c',
        current_date, 'artist', 20000);
select pg_temp.must_fail(
  $q$insert into public.bookings (event_id, artist_id, organizer_id, event_date, initiated_by)
     values ('00000000-0000-0000-0000-0000000000e9', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b', current_date, 'artist')$q$,
  'an artist cannot apply to a private event');
select pg_temp.login_as('00000000-0000-0000-0000-00000000000c');
update public.bookings set status = 'rejected' where id = '00000000-0000-0000-0000-0000000000b3';
select pg_temp.check(
  (select status from public.bookings where id = '00000000-0000-0000-0000-0000000000b3') = 'rejected',
  'organizer can decline an artist''s application');

-- Organizer C requests the same artist on the same date.
select pg_temp.login_as('00000000-0000-0000-0000-00000000000c');
insert into public.bookings (id, event_id, artist_id, organizer_id, event_date, initiated_by, proposed_price)
values ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000e2',
        '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000c',
        current_date, 'organizer', 30000);

select pg_temp.login_as('00000000-0000-0000-0000-00000000000b');
update public.bookings set status = 'confirmed' where id = '00000000-0000-0000-0000-0000000000b1';
select pg_temp.check(
  (select status from public.bookings where id = '00000000-0000-0000-0000-0000000000b1') = 'confirmed',
  'organizer confirms the accepted booking');
select pg_temp.must_fail(
  $q$update public.bookings set status = 'completed' where id = '00000000-0000-0000-0000-0000000000b1'$q$,
  'cannot complete before the event date');

select pg_temp.login_as('00000000-0000-0000-0000-00000000000a');
select pg_temp.must_fail(
  $q$update public.bookings set status = 'accepted' where id = '00000000-0000-0000-0000-0000000000b2'$q$,
  'double-booking guard: second acceptance on the same date fails');

-- Unpublishing mid-booking must not blank out the artist for the organizer (018/020).
select pg_temp.login_as('00000000-0000-0000-0000-00000000000a');
update public.artist_profiles set is_published = false where id = '00000000-0000-0000-0000-00000000000a';
select pg_temp.login_as('00000000-0000-0000-0000-00000000000b');
select pg_temp.check(
  exists (select 1 from public.artist_profiles where id = '00000000-0000-0000-0000-00000000000a'),
  'an organizer still sees an unpublished artist they have a booking with');
select pg_temp.login_as('00000000-0000-0000-0000-00000000000a');
update public.artist_profiles set is_published = true where id = '00000000-0000-0000-0000-00000000000a';

select pg_temp.login_as_anon();
select pg_temp.check(
  not public.artist_is_available('00000000-0000-0000-0000-00000000000a', current_date + 30),
  'artist is unavailable on the booked date');
select pg_temp.check(
  (select count(*) from public.artist_booked_dates('00000000-0000-0000-0000-00000000000a', current_date, current_date + 60)) = 1,
  'artist_booked_dates exposes the booked date');
select pg_temp.check(
  not exists (select 1 from public.search_artists(p_date => current_date + 30) s where s.id = '00000000-0000-0000-0000-00000000000a'),
  'search_artists hides the artist on the booked date');

-- Manual block.
select pg_temp.login_as('00000000-0000-0000-0000-00000000000a');
insert into public.availability (artist_id, date) values ('00000000-0000-0000-0000-00000000000a', current_date + 40);
select pg_temp.login_as_anon();
select pg_temp.check(
  not exists (select 1 from public.search_artists(p_date => current_date + 40) s where s.id = '00000000-0000-0000-0000-00000000000a'),
  'blocked date hides the artist from search');
select pg_temp.check(
  exists (select 1 from public.search_artists(p_date => current_date + 41) s where s.id = '00000000-0000-0000-0000-00000000000a'),
  'the next day the artist is available again');
select pg_temp.login_as('00000000-0000-0000-0000-00000000000c');
select pg_temp.must_fail(
  $q$insert into public.availability (artist_id, date) values ('00000000-0000-0000-0000-00000000000a', current_date + 50)$q$,
  'nobody else can block the artist''s calendar');

-- ---------------------------------------------------------------------------
-- After the event: complete and review
-- ---------------------------------------------------------------------------

select pg_temp.login_as('00000000-0000-0000-0000-00000000000b');
select pg_temp.must_fail(
  $q$insert into public.reviews (booking_id, reviewer_id, artist_id, rating) values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a', 5)$q$,
  'cannot review before the booking is completed');

-- Time travel: move the event into the past (as the table owner).
reset role;
select set_config('request.jwt.claims', '', true);
update public.events set event_date = current_date - 1 where id = '00000000-0000-0000-0000-0000000000e1';

select pg_temp.login_as('00000000-0000-0000-0000-00000000000a');
update public.bookings set status = 'completed' where id = '00000000-0000-0000-0000-0000000000b1';

select pg_temp.login_as('00000000-0000-0000-0000-00000000000b');
insert into public.reviews (booking_id, reviewer_id, artist_id, rating, comment)
values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000000b',
        '00000000-0000-0000-0000-00000000000a', 4, 'Great energy.');
select pg_temp.must_fail(
  $q$insert into public.reviews (booking_id, reviewer_id, artist_id, rating) values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a', 1)$q$,
  'only one review per booking');
select pg_temp.must_fail(
  $q$insert into public.messages (booking_id, sender_id, body) values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000000b', 'late')$q$,
  'no messages on a completed booking');

select pg_temp.login_as('00000000-0000-0000-0000-00000000000a');
select pg_temp.check(
  (select count(*) from public.notifications where type = 'new_review') = 1,
  'the artist is notified of the review');

select pg_temp.login_as_anon();
select pg_temp.check(
  (select rating_avg from public.artist_profiles where id = '00000000-0000-0000-0000-00000000000a') = 4.00
  and (select rating_count from public.artist_profiles where id = '00000000-0000-0000-0000-00000000000a') = 1,
  'the review recalculates the artist rating');

-- ---------------------------------------------------------------------------
reset role;
select 'ALL TESTS PASSED' as result;
rollback;
