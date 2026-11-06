-- 018_booking_rules_and_notifications.sql
-- Rules the UI work (steps 22–30) showed were missing, plus the Phase 2
-- notification triggers that 011 left a helper for.
--
-- Trigger order on bookings is alphabetical, which this file relies on:
--   bookings_enforce_transition -> bookings_guard_price -> bookings_set_updated_at
--   -> bookings_sync_from_event -> bookings_validate_new

-- ---------------------------------------------------------------------------
-- 1. A new request must point at something bookable
--
-- The INSERT policy checks WHO may open a request. It cannot cheaply check
-- WHAT they are requesting: an event that already happened, a closed event,
-- or an artist who has unpublished themselves.
-- ---------------------------------------------------------------------------

create or replace function private.validate_new_booking()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status    public.event_status;
  v_is_public boolean;
begin
  select e.status, e.is_public into v_status, v_is_public
  from public.events e where e.id = new.event_id;

  if v_status is distinct from 'open' then
    raise exception 'This event is not open for bookings';
  end if;

  -- event_date was already copied from the event by bookings_sync_from_event.
  if new.event_date < current_date then
    raise exception 'This event date has already passed';
  end if;

  if not private.artist_is_published(new.artist_id) then
    raise exception 'This artist is not accepting bookings';
  end if;

  -- An artist may only apply to events they could actually see.
  if new.initiated_by = 'artist' and not v_is_public then
    raise exception 'This event is not public';
  end if;

  -- The agreed price is set by acceptance, never at creation.
  new.agreed_price := null;
  new.cancelled_by := null;
  return new;
end;
$$;

create trigger bookings_validate_new
  before insert on public.bookings
  for each row execute function private.validate_new_booking();

-- ---------------------------------------------------------------------------
-- 2. Price and cancellation bookkeeping
--
-- 008 lets a participant edit price with no status change, which is how a
-- counter-offer works. But once accepted, the price is the deal: changing it
-- afterwards would let one side rewrite an agreement the other already made.
-- ---------------------------------------------------------------------------

create or replace function private.guard_booking_price()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if private.is_admin() then
    return new;
  end if;

  if old.status not in ('requested', 'negotiating')
     and new.proposed_price is distinct from old.proposed_price then
    raise exception 'The price is locked once a booking is accepted';
  end if;

  -- agreed_price has exactly one writer: the moment of acceptance, when it
  -- becomes whatever was on the table.
  if new.status = 'accepted' and old.status <> 'accepted' then
    new.agreed_price := new.proposed_price;
  elsif new.agreed_price is distinct from old.agreed_price then
    raise exception 'The agreed price is set automatically when the artist accepts';
  end if;

  -- Who cancelled is a fact, not input: never trust the client's value.
  if new.status = 'cancelled' and old.status <> 'cancelled' then
    new.cancelled_by := (select auth.uid());
  elsif new.cancelled_by is distinct from old.cancelled_by then
    raise exception 'cancelled_by cannot be edited';
  end if;

  return new;
end;
$$;

create trigger bookings_guard_price
  before update on public.bookings
  for each row execute function private.guard_booking_price();

-- ---------------------------------------------------------------------------
-- 3. Organizers keep seeing an artist they are dealing with
--
-- Without this, an artist who unpublishes mid-negotiation turns into a blank
-- name on the organizer's booking page.
-- ---------------------------------------------------------------------------

create policy "organizers see artists they have a booking with"
  on public.artist_profiles for select
  to authenticated
  using (private.shares_booking_with(id));

-- ---------------------------------------------------------------------------
-- 4. Booked dates for the public calendar
--
-- The brief wants the calendar to "show booked dates", but bookings are
-- private. This returns dates only — no event, no organizer, no price — and
-- only for published artists. A fourth deliberate public RPC.
-- ---------------------------------------------------------------------------

create or replace function public.artist_booked_dates(p_artist_id uuid, p_from date, p_to date)
returns setof date
language sql
stable
security definer
set search_path = ''
as $$
  select distinct b.event_date
  from public.bookings b
  where b.artist_id = p_artist_id
    and b.status in ('accepted', 'confirmed')
    and b.event_date between p_from and p_to
    and private.artist_is_published(p_artist_id)
  order by 1;
$$;

revoke execute on function public.artist_booked_dates(uuid, date, date) from public;
grant  execute on function public.artist_booked_dates(uuid, date, date) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Notifications (brief §6 "Shared") and system messages in the thread
-- ---------------------------------------------------------------------------

create or replace function private.on_booking_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor       uuid := (select auth.uid());
  v_other       uuid;
  v_event_title text;
  v_artist_name text;
  v_type        public.notification_type;
  v_link        text := '/bookings/' || new.id;
begin
  select e.title into v_event_title from public.events e where e.id = new.event_id;
  select a.stage_name into v_artist_name from public.artist_profiles a where a.id = new.artist_id;

  if tg_op = 'INSERT' then
    v_other := case when new.initiated_by = 'organizer' then new.artist_id else new.organizer_id end;
    perform private.notify(v_other, 'booking_request', 'New booking request',
      format('%s — %s', v_event_title, v_artist_name), v_link, new.id);
    return null;
  end if;

  v_other := case
    when v_actor = new.artist_id then new.organizer_id
    when v_actor = new.organizer_id then new.artist_id
    else null
  end;

  if new.status = old.status then
    if new.proposed_price is distinct from old.proposed_price and v_actor is not null then
      insert into public.messages (booking_id, sender_id, body, message_type, offer_amount)
      values (new.id, v_actor, format('New offer: %s %s', new.currency, new.proposed_price),
              'price_offer', new.proposed_price);
    end if;
    return null;
  end if;

  v_type := case new.status
    when 'accepted'  then 'booking_accepted'
    when 'rejected'  then 'booking_rejected'
    when 'confirmed' then 'booking_confirmed'
    when 'cancelled' then 'booking_cancelled'
    when 'completed' then 'booking_completed'
    else 'system'
  end;

  if v_other is not null then
    perform private.notify(v_other, v_type,
      format('Booking %s', new.status), format('%s — %s', v_event_title, v_artist_name), v_link, new.id);
  else
    -- An admin or system change: tell both sides.
    perform private.notify(new.artist_id, v_type, format('Booking %s', new.status), v_event_title, v_link, new.id);
    perform private.notify(new.organizer_id, v_type, format('Booking %s', new.status), v_event_title, v_link, new.id);
  end if;

  -- A permanent record in the thread of who moved the booking and when.
  -- Inserted as the definer, so it lands even when the booking is now terminal.
  if v_actor is not null then
    insert into public.messages (booking_id, sender_id, body, message_type)
    values (new.id, v_actor, format('Status changed: %s → %s', old.status, new.status), 'system');
  end if;

  return null;
end;
$$;

create trigger bookings_on_change
  after insert or update on public.bookings
  for each row execute function private.on_booking_change();

create or replace function private.on_new_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_artist    uuid;
  v_organizer uuid;
  v_other     uuid;
begin
  -- Status and offer messages already produced their own notification.
  if new.message_type <> 'text' then
    return null;
  end if;

  select b.artist_id, b.organizer_id into v_artist, v_organizer
  from public.bookings b where b.id = new.booking_id;

  v_other := case when new.sender_id = v_artist then v_organizer else v_artist end;

  -- One unread "new message" per thread is enough; do not flood the feed.
  if not exists (
    select 1 from public.notifications n
    where n.user_id = v_other and n.related_booking_id = new.booking_id
      and n.type = 'new_message' and not n.is_read
  ) then
    perform private.notify(v_other, 'new_message', 'New message',
      left(new.body, 120), '/bookings/' || new.booking_id, new.booking_id);
  end if;
  return null;
end;
$$;

create trigger messages_on_insert
  after insert on public.messages
  for each row execute function private.on_new_message();

create or replace function private.on_new_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.notify(new.artist_id, 'new_review',
    format('You received a %s-star review', new.rating), left(new.comment, 120),
    '/dashboard', new.booking_id);
  return null;
end;
$$;

create trigger reviews_on_insert
  after insert on public.reviews
  for each row execute function private.on_new_review();

create or replace function private.on_verification_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.verification_status is distinct from old.verification_status
     and new.verification_status in ('approved', 'rejected') then
    perform private.notify(new.id,
      case when new.verification_status = 'approved'
           then 'verification_approved'::public.notification_type
           else 'verification_rejected'::public.notification_type end,
      case when new.verification_status = 'approved'
           then 'You are now a Verified Star'
           else 'Verification was not approved' end,
      null, '/dashboard', null);
  end if;
  return null;
end;
$$;

create trigger artist_profiles_on_verification
  after update of verification_status on public.artist_profiles
  for each row execute function private.on_verification_change();

-- Live notification bell. RLS (user_id = auth.uid()) keeps each feed private.
alter publication supabase_realtime add table public.notifications;
