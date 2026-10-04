-- 016_advisor_fixes.sql
-- Fixes flagged by the Supabase security advisor after 001–015 were applied.

-- 1. `revoke ... from public` in 009 was not enough: Supabase also grants
--    EXECUTE directly to `anon` through default privileges. A logged-out
--    caller has no auth.uid(), so the function would just raise, but there is
--    no reason to expose the endpoint at all.
revoke execute on function public.mark_messages_read(uuid) from anon;

-- 2. Pin search_path like every other function, so a same-named object in
--    another schema can never be picked up by this trigger.
alter function private.set_updated_at() set search_path = '';
