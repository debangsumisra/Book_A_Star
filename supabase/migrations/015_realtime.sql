-- 015_realtime.sql
-- Enable Realtime on the two tables that need live updates.
--
-- Realtime respects Row Level Security. A subscriber only receives changes to
-- rows their SELECT policy already allows them to read, so the policies in
-- 008 and 009 are what keep message threads private. Nothing extra to do.
--
-- Do NOT add more tables here than you need: every table in this publication
-- costs a WAL stream.

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.bookings;
