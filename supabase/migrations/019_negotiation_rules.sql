-- 019_negotiation_rules.sql
-- Replaces the state machine from 008 with real negotiation semantics.
--
-- The 008 rules assumed the organizer always starts a booking and the artist
-- always answers. Two problems showed up once the UI existed:
--   1. An artist can APPLY to an open event (initiated_by = 'artist'), but
--      then nobody on the organizer side was allowed to accept.
--   2. After the artist counter-offered, the organizer could not accept the
--      counter; the artist had to "accept" their own offer.
--
-- New rule: an offer is accepted by the side that did NOT make it.
-- `last_offer_by` records who put the current price on the table.
--
--   requested / negotiating
--     -> accepted     the participant who did not make the latest offer
--     -> rejected     the responder (the side that did NOT initiate)
--     -> cancelled    the initiator (withdrawing their own request)
--     price change    either participant; moves 'requested' to 'negotiating'
--   accepted   -> confirmed (organizer) | cancelled (either)
--   confirmed  -> completed (either, on/after event_date) | cancelled (either)
--   completed / rejected / cancelled: terminal

alter table public.bookings
  add column last_offer_by uuid references public.profiles(id) on delete set null;

create index bookings_last_offer_by_idx on public.bookings (last_offer_by);

-- Existing rows: the initiator made the opening offer.
update public.bookings
   set last_offer_by = case when initiated_by = 'organizer' then organizer_id else artist_id end
 where last_offer_by is null;

-- ---------------------------------------------------------------------------
-- New request: stamp who made the opening offer.
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
  if new.event_date < current_date then
    raise exception 'This event date has already passed';
  end if;
  if not private.artist_is_published(new.artist_id) then
    raise exception 'This artist is not accepting bookings';
  end if;
  if new.initiated_by = 'artist' and not v_is_public then
    raise exception 'This event is not public';
  end if;

  new.agreed_price  := null;
  new.cancelled_by  := null;
  new.last_offer_by := case when new.initiated_by = 'organizer' then new.organizer_id else new.artist_id end;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- The state machine
-- ---------------------------------------------------------------------------

create or replace function private.enforce_booking_transition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me           uuid := (select auth.uid());
  v_is_artist    boolean;
  v_is_organizer boolean;
  v_initiator    uuid;
  v_allowed      boolean := false;
begin
  if private.is_admin() then
    return new;
  end if;

  v_is_artist    := old.artist_id = v_me;
  v_is_organizer := old.organizer_id = v_me;
  v_initiator    := case when old.initiated_by = 'organizer' then old.organizer_id else old.artist_id end;

  if new.event_id is distinct from old.event_id
     or new.artist_id is distinct from old.artist_id
     or new.organizer_id is distinct from old.organizer_id
     or new.initiated_by is distinct from old.initiated_by then
    raise exception 'The event, artist, organizer and initiator of a booking cannot be changed';
  end if;

  if new.status = old.status then
    return new;
  end if;

  case old.status
    when 'requested', 'negotiating' then
      v_allowed :=
           (new.status = 'negotiating' and (v_is_artist or v_is_organizer))
        or (new.status = 'accepted'    and (v_is_artist or v_is_organizer)
                                       and v_me is distinct from old.last_offer_by)
        or (new.status = 'rejected'    and (v_is_artist or v_is_organizer) and v_me <> v_initiator)
        or (new.status = 'cancelled'   and v_me = v_initiator);

    when 'accepted' then
      v_allowed := (v_is_organizer and new.status = 'confirmed')
                or ((v_is_artist or v_is_organizer) and new.status = 'cancelled');

    when 'confirmed' then
      v_allowed := (v_is_artist or v_is_organizer)
                   and (
                     new.status = 'cancelled'
                     or (new.status = 'completed' and current_date >= old.event_date)
                   );

    else
      v_allowed := false;
  end case;

  if not v_allowed then
    raise exception 'Illegal booking transition: % -> % (not permitted for this user)',
      old.status, new.status;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Price bookkeeping: who made the latest offer, and the automatic move from
-- 'requested' to 'negotiating' on the first counter-offer.
-- ---------------------------------------------------------------------------

create or replace function private.guard_booking_price()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
begin
  if private.is_admin() then
    return new;
  end if;

  if new.proposed_price is distinct from old.proposed_price then
    if old.status not in ('requested', 'negotiating') then
      raise exception 'The price is locked once a booking is accepted';
    end if;
    if new.status = 'accepted' then
      raise exception 'Change the price or accept it — not both at once';
    end if;
    if new.proposed_price is null then
      raise exception 'An offer needs an amount';
    end if;
    new.last_offer_by := v_me;
    if new.status = 'requested' then
      new.status := 'negotiating';
    end if;
  elsif new.last_offer_by is distinct from old.last_offer_by then
    raise exception 'last_offer_by is maintained automatically';
  end if;

  if new.status = 'accepted' and old.status <> 'accepted' then
    new.agreed_price := new.proposed_price;
  elsif new.agreed_price is distinct from old.agreed_price then
    raise exception 'The agreed price is set automatically when an offer is accepted';
  end if;

  if new.status = 'cancelled' and old.status <> 'cancelled' then
    new.cancelled_by := v_me;
  elsif new.cancelled_by is distinct from old.cancelled_by then
    raise exception 'cancelled_by cannot be edited';
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Thread entries: a price change now posts an offer message whether or not
-- the status moved with it (the first counter moves it to 'negotiating').
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
    perform private.notify(v_other, 'booking_request',
      case when new.initiated_by = 'organizer' then 'New booking request' else 'New application for your event' end,
      format('%s — %s', v_event_title, v_artist_name), v_link, new.id);
    return null;
  end if;

  v_other := case
    when v_actor = new.artist_id then new.organizer_id
    when v_actor = new.organizer_id then new.artist_id
    else null
  end;

  if new.proposed_price is distinct from old.proposed_price and v_actor is not null then
    insert into public.messages (booking_id, sender_id, body, message_type, offer_amount)
    values (new.id, v_actor, format('New offer: %s %s', new.currency, new.proposed_price),
            'price_offer', new.proposed_price);
    if v_other is not null then
      perform private.notify(v_other, 'system', 'New price offer',
        format('%s — %s %s', v_event_title, new.currency, new.proposed_price), v_link, new.id);
    end if;
  end if;

  if new.status = old.status then
    return null;
  end if;

  -- requested -> negotiating is announced by the offer itself.
  if new.status = 'negotiating' then
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
    perform private.notify(new.artist_id, v_type, format('Booking %s', new.status), v_event_title, v_link, new.id);
    perform private.notify(new.organizer_id, v_type, format('Booking %s', new.status), v_event_title, v_link, new.id);
  end if;

  if v_actor is not null then
    insert into public.messages (booking_id, sender_id, body, message_type)
    values (new.id, v_actor, format('Status changed: %s → %s', old.status, new.status), 'system');
  end if;

  return null;
end;
$$;
