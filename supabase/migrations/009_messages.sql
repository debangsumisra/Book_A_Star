-- 009_messages.sql
-- In-app messaging, scoped to a booking. Negotiation happens here.

create table public.messages (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid not null references public.bookings(id) on delete cascade,
  sender_id     uuid not null references public.profiles(id) on delete cascade,

  body          text not null check (length(trim(body)) > 0),

  -- 'price_offer' carries a number the other side can accept; 'system' is for
  -- automatic entries like "booking confirmed".
  message_type  public.message_type not null default 'text',
  offer_amount  numeric(10,2) check (offer_amount >= 0),

  read_at       timestamptz,
  created_at    timestamptz not null default now(),

  constraint price_offer_needs_an_amount
    check (message_type <> 'price_offer' or offer_amount is not null)
);

create index messages_booking_idx on public.messages (booking_id, created_at);
create index messages_unread_idx  on public.messages (booking_id, sender_id) where read_at is null;
-- messages_unread_idx leads with booking_id, so it cannot serve a lookup
-- by sender_id alone. The FK needs its own index.
create index messages_sender_idx  on public.messages (sender_id);

alter table public.messages enable row level security;

-- Grants decide whether the table is reachable through the Data API at all;
-- RLS decides which rows come back once it is. Both are required. Without
-- these, every query from the browser fails with "permission denied" and
-- the RLS policies above never even get a chance to run.
-- No UPDATE or DELETE grant: there are no policies for them by design.
grant select, insert on public.messages to authenticated;

create policy "participants read the thread"
  on public.messages for select
  to authenticated
  using (private.is_booking_participant(booking_id) or private.is_admin());

-- Three conditions, all necessary:
--   sender_id = auth.uid()      you cannot post as someone else
--   is_booking_participant      you cannot post into a stranger's thread
--   booking_is_open             no messages after it is completed or cancelled
create policy "participants post to an open thread"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = (select auth.uid())
    and private.is_booking_participant(booking_id)
    and private.booking_is_open(booking_id)
  );

-- Deliberately NO update and NO delete policy.
--
-- An UPDATE policy broad enough to let you set read_at on a message you
-- received is also broad enough to let you rewrite its body. Read receipts
-- therefore go through the narrow function below, which can only ever touch
-- one column.

create or replace function public.mark_messages_read(p_booking_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if not private.is_booking_participant(p_booking_id) then
    raise exception 'You are not a participant of this booking';
  end if;

  update public.messages m
     set read_at = now()
   where m.booking_id = p_booking_id
     and m.sender_id <> (select auth.uid())
     and m.read_at is null;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke execute on function public.mark_messages_read(uuid) from public;
grant  execute on function public.mark_messages_read(uuid) to authenticated;
