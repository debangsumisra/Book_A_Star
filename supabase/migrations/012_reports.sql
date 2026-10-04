-- 012_reports.sql
-- Abuse and dispute reports, handled by admins.

create table public.reports (
  id                 uuid primary key default gen_random_uuid(),
  reporter_id        uuid not null references public.profiles(id) on delete cascade,

  -- At least one target. All nullable because a report may be about a user,
  -- a booking, or a review.
  reported_user_id   uuid references public.profiles(id) on delete cascade,
  reported_booking_id uuid references public.bookings(id) on delete cascade,
  reported_review_id uuid references public.reviews(id) on delete cascade,

  reason             public.report_reason not null,
  details            text,

  status             public.report_status not null default 'open',
  admin_notes        text,
  resolved_by        uuid references public.profiles(id) on delete set null,
  resolved_at        timestamptz,

  created_at         timestamptz not null default now(),

  constraint report_needs_a_target check (
    reported_user_id is not null
    or reported_booking_id is not null
    or reported_review_id is not null
  ),

  constraint cannot_report_yourself check (
    reported_user_id is null or reported_user_id <> reporter_id
  )
);

create index reports_queue_idx         on public.reports (status, created_at);
create index reports_reporter_idx      on public.reports (reporter_id);
create index reports_reported_user_idx on public.reports (reported_user_id);
create index reports_booking_idx       on public.reports (reported_booking_id);
create index reports_review_idx        on public.reports (reported_review_id);
create index reports_resolved_by_idx   on public.reports (resolved_by);

alter table public.reports enable row level security;

-- Grants decide whether the table is reachable through the Data API at all;
-- RLS decides which rows come back once it is. Both are required. Without
-- these, every query from the browser fails with "permission denied" and
-- the RLS policies above never even get a chance to run.
grant select, insert, update, delete on public.reports to authenticated;

create policy "reporters and admins read reports"
  on public.reports for select
  to authenticated
  using (reporter_id = (select auth.uid()) or private.is_admin());

-- Reports always open as 'open'. A user cannot file one pre-resolved.
create policy "users file their own reports"
  on public.reports for insert
  to authenticated
  with check (reporter_id = (select auth.uid()) and status = 'open');

-- Only admins triage. The reporter cannot edit a report after filing it —
-- otherwise the evidence changes after an admin has read it.
create policy "admins triage reports"
  on public.reports for update
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy "admins delete reports"
  on public.reports for delete
  to authenticated
  using (private.is_admin());
