-- 011_notifications.sql
-- In-app notification feed.

create table public.notifications (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles(id) on delete cascade,

  type               public.notification_type not null,
  title              text not null,
  body               text,
  link_url           text,
  related_booking_id uuid references public.bookings(id) on delete cascade,

  is_read            boolean not null default false,
  created_at         timestamptz not null default now()
);

create index notifications_feed_idx
  on public.notifications (user_id, is_read, created_at desc);
create index notifications_booking_idx
  on public.notifications (related_booking_id);

alter table public.notifications enable row level security;

-- Grants decide whether the table is reachable through the Data API at all;
-- RLS decides which rows come back once it is. Both are required. Without
-- these, every query from the browser fails with "permission denied" and
-- the RLS policies above never even get a chance to run.
-- No INSERT grant: notifications are written only by private.notify().
grant select, update, delete on public.notifications to authenticated;

create policy "users read their own notifications"
  on public.notifications for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Deliberately NO insert policy.
--
-- If clients could insert, any user could spam any other user's feed with
-- arbitrary text and links. Notifications are created only by database
-- triggers (security definer, which bypasses RLS) or by trusted server-side
-- code holding the service_role key. Never from the browser.

create policy "users mark their own notifications read"
  on public.notifications for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "users clear their own notifications"
  on public.notifications for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- Helper for the triggers you will add in Phase 2. Security definer, so it
-- writes past the "no insert" rule above.
create or replace function private.notify(
  p_user_id    uuid,
  p_type       public.notification_type,
  p_title      text,
  p_body       text default null,
  p_link_url   text default null,
  p_booking_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  insert into public.notifications (user_id, type, title, body, link_url, related_booking_id)
  values (p_user_id, p_type, p_title, p_body, p_link_url, p_booking_id)
  returning id into v_id;
  return v_id;
end;
$$;

-- Not callable from the browser: it exists for other database functions.
revoke execute on function private.notify(uuid, public.notification_type, text, text, text, uuid) from public;
revoke execute on function private.notify(uuid, public.notification_type, text, text, text, uuid) from anon;
revoke execute on function private.notify(uuid, public.notification_type, text, text, text, uuid) from authenticated;
