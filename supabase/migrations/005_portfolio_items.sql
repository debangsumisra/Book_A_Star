-- 005_portfolio_items.sql
-- Artist showcase: uploaded media (Supabase Storage) and external links.

create table public.portfolio_items (
  id           uuid primary key default gen_random_uuid(),
  artist_id    uuid not null references public.artist_profiles(id) on delete cascade,
  media_type   public.media_type not null,

  -- Exactly one of these is the source. storage_path points into the
  -- `portfolio` bucket; external_url holds a YouTube / SoundCloud link.
  storage_path text,
  external_url text,

  title        text,
  description  text,

  -- "Past events" from the brief.
  event_name   text,
  event_date   date,

  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),

  constraint portfolio_needs_a_source
    check (storage_path is not null or external_url is not null)
);

create index portfolio_artist_idx on public.portfolio_items (artist_id, sort_order);

alter table public.portfolio_items enable row level security;

-- Grants decide whether the table is reachable through the Data API at all;
-- RLS decides which rows come back once it is. Both are required. Without
-- these, every query from the browser fails with "permission denied" and
-- the RLS policies above never even get a chance to run.
grant select                         on public.portfolio_items to anon;
grant select, insert, update, delete on public.portfolio_items to authenticated;

create policy "portfolio of published artists is public"
  on public.portfolio_items for select
  to anon, authenticated
  using (
    private.artist_is_published(artist_id)
    or artist_id = (select auth.uid())
    or private.is_admin()
  );

create policy "artists add their own portfolio items"
  on public.portfolio_items for insert
  to authenticated
  with check (artist_id = (select auth.uid()));

create policy "artists update their own portfolio items"
  on public.portfolio_items for update
  to authenticated
  using (artist_id = (select auth.uid()))
  with check (artist_id = (select auth.uid()));

create policy "artists delete their own portfolio items"
  on public.portfolio_items for delete
  to authenticated
  using (artist_id = (select auth.uid()) or private.is_admin());
