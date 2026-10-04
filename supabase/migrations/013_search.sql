-- 013_search.sql
-- Availability logic and the directory search RPC.

-- ---------------------------------------------------------------------------
-- Is this artist free on this date?
--
-- Two ways to be busy:
--   1. the artist manually blocked the date
--   2. an accepted or confirmed booking already occupies it
--
-- Keeping (2) as a query rather than a stored row is what stops the calendar
-- and the bookings table from ever disagreeing.
-- ---------------------------------------------------------------------------

create or replace function public.artist_is_available(p_artist_id uuid, p_date date)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.availability a
    where a.artist_id = p_artist_id and a.date = p_date
  ) then
    return false;
  end if;

  if exists (
    select 1 from public.bookings b
    where b.artist_id = p_artist_id
      and b.event_date = p_date
      and b.status in ('accepted', 'confirmed')
  ) then
    return false;
  end if;

  return true;
end;
$$;

grant execute on function public.artist_is_available(uuid, date) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Directory search
--
-- SECURITY INVOKER, deliberately. An earlier draft used SECURITY DEFINER and
-- leaned on the `a.is_published` filter below to compensate — but definer
-- switches RLS off entirely, so a later edit to that one line would have
-- silently exposed every unpublished artist.
--
-- Invoker keeps RLS in the loop: the artist_profiles SELECT policy already
-- grants anon and authenticated read access to published artists, which is
-- exactly this result set. The filter stays as a second layer, not the only one.
--
-- Call it from React:
--   supabase.rpc('search_artists', { p_city: 'Pune', p_date: '2026-11-14' })
-- ---------------------------------------------------------------------------

create or replace function public.search_artists(
  p_category   public.artist_category default null,
  p_city       text default null,
  p_price_min  numeric default null,
  p_price_max  numeric default null,
  p_min_rating numeric default null,
  p_date       date default null,
  p_limit      integer default 24,
  p_offset     integer default 0
)
returns setof public.artist_profiles
language sql
stable
security invoker
set search_path = ''
as $$
  select a.*
  from public.artist_profiles a
  where a.is_published
    and (p_category   is null or a.category = p_category)
    and (p_city       is null or lower(a.base_city) = lower(p_city))
    and (p_price_min  is null or coalesce(a.price_per_event, a.price_min) >= p_price_min)
    and (p_price_max  is null or coalesce(a.price_per_event, a.price_min) <= p_price_max)
    and (p_min_rating is null or a.rating_avg >= p_min_rating)
    and (p_date       is null or public.artist_is_available(a.id, p_date))
  order by a.rating_avg desc, a.rating_count desc, a.created_at desc
  limit  least(greatest(coalesce(p_limit, 24), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

grant execute on function public.search_artists(
  public.artist_category, text, numeric, numeric, numeric, date, integer, integer
) to anon, authenticated;
