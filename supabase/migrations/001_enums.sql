-- 001_enums.sql
-- The `private` schema and all enum types. Run this first: every later
-- migration depends on it.
--
-- Why a `private` schema: Postgres grants EXECUTE to PUBLIC on every new
-- function, so any SECURITY DEFINER function sitting in `public` is a callable
-- API endpoint for `anon` and `authenticated`. Supabase only exposes `public`
-- through the Data API, so helpers that live in `private` can still be used by
-- RLS policies and triggers but cannot be invoked from the browser.
--
-- USAGE on the schema is required: an RLS policy expression is evaluated as the
-- querying user, so that user must be able to reach the function it calls.
-- Exposure is controlled by which schemas the Data API serves, not by this grant.

create schema if not exists private;
grant usage on schema private to anon, authenticated;

-- Why enums instead of plain text columns: the database rejects a typo like
-- 'confirmd' at write time. A text column would happily store it and you would
-- find out weeks later when a dashboard count is silently wrong.

create type public.user_role as enum ('organizer', 'artist', 'admin');

create type public.artist_category as enum (
  'singer', 'band', 'musician', 'dancer', 'dj',
  'comedian', 'anchor', 'magician', 'other'
);

create type public.organizer_type as enum (
  'individual', 'college', 'company', 'event_agency', 'other'
);

create type public.media_type as enum ('image', 'video', 'audio');

create type public.event_type as enum (
  'wedding', 'college_fest', 'corporate', 'concert', 'private_party', 'other'
);

create type public.event_status as enum (
  'draft', 'open', 'closed', 'completed', 'cancelled'
);

create type public.booking_status as enum (
  'requested', 'negotiating', 'accepted', 'confirmed',
  'completed', 'rejected', 'cancelled'
);

create type public.verification_status as enum ('pending', 'approved', 'rejected');

create type public.message_type as enum ('text', 'price_offer', 'system');

create type public.report_reason as enum (
  'spam', 'harassment', 'fake_profile', 'no_show', 'payment_issue', 'other'
);

create type public.report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');

create type public.notification_type as enum (
  'booking_request', 'booking_accepted', 'booking_rejected',
  'booking_confirmed', 'booking_cancelled', 'booking_completed',
  'new_message', 'new_review',
  'verification_approved', 'verification_rejected', 'system'
);
