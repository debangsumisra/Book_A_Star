-- 017_tighten_grants.sql
-- Found during step 9 (proving RLS bites).
--
-- Supabase's default privileges give anon AND authenticated ALL privileges
-- (including TRUNCATE, which skips RLS) on every new table in `public`. So the
-- narrow `grant` lines in 002–012 never narrowed anything: they were added on
-- top of grants that already existed. RLS still blocked every attack, but
-- it was the only layer, not one of two.
--
-- Fix: wipe table privileges, re-grant exactly what each migration intended,
-- and change the defaults so future tables start with nothing.

revoke all on all tables in schema public from anon, authenticated;

alter default privileges in schema public revoke all on tables from anon, authenticated;

grant select, insert, update          on public.profiles           to authenticated;
grant select, insert, update          on public.profiles_private   to authenticated;

grant select                          on public.artist_profiles    to anon;
grant select, insert, update, delete  on public.artist_profiles    to authenticated;

grant select, insert, update, delete  on public.organizer_profiles to authenticated;

grant select                          on public.portfolio_items    to anon;
grant select, insert, update, delete  on public.portfolio_items    to authenticated;

grant select                          on public.availability       to anon;
grant select, insert, update, delete  on public.availability       to authenticated;

grant select, insert, update, delete  on public.events             to authenticated;
grant select, insert, update, delete  on public.bookings           to authenticated;
grant select, insert                  on public.messages           to authenticated;

grant select                          on public.reviews            to anon;
grant select, insert, update, delete  on public.reviews            to authenticated;

grant select, update, delete          on public.notifications      to authenticated;
grant select, insert, update, delete  on public.reports            to authenticated;
