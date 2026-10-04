-- 002_profiles.sql
-- The identity layer: profiles, private contact data, role helpers, and the
-- signup trigger. Everything else in the schema hangs off this file.

-- ---------------------------------------------------------------------------
-- Shared utility trigger
-- ---------------------------------------------------------------------------

create or replace function private.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- Public-ish identity. Anything in here may be seen by any signed-in user,
-- so contact details deliberately do NOT live here.
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        public.user_role not null default 'organizer',
  full_name   text not null default '',
  avatar_url  text,
  city        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Contact details, split out so a public artist card can never leak them.
-- One `select *` on a joined public table is all it takes to dump every
-- phone number on the platform; this split makes that structurally impossible.
create table public.profiles_private (
  id          uuid primary key references public.profiles(id) on delete cascade,
  email       text,
  phone       text,
  updated_at  timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

create trigger profiles_private_set_updated_at
  before update on public.profiles_private
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Role helpers
--
-- These MUST be `security definer`. A policy on `profiles` that reads
-- `profiles` re-triggers the same policy and Postgres aborts with
-- "infinite recursion detected in policy". A security-definer function runs
-- with the owner's rights, outside RLS, which breaks the cycle.
--
-- `set search_path = ''` is a hardening step: it forces every name to be
-- fully qualified, so nobody can shadow `profiles` with a temp table.
-- ---------------------------------------------------------------------------

create or replace function private.current_user_role()
returns public.user_role
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_role public.user_role;
begin
  select p.role into v_role from public.profiles p where p.id = (select auth.uid());
  return v_role;
end;
$$;

-- "Do I share a booking with this person?" Used to scope profile visibility
-- to people you are actually dealing with.
--
-- public.bookings does not exist yet; a plpgsql body is not resolved until the
-- function is first called, so this is legal here and works once 008 has run.
create or replace function private.shares_booking_with(p_profile_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return exists (
    select 1 from public.bookings b
    where (b.artist_id    = (select auth.uid()) and b.organizer_id = p_profile_id)
       or (b.organizer_id = (select auth.uid()) and b.artist_id    = p_profile_id)
  );
end;
$$;

create or replace function private.is_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return coalesce(
    (select p.role = 'admin' from public.profiles p where p.id = (select auth.uid())),
    false
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Signup: create the profile rows automatically
-- ---------------------------------------------------------------------------

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_requested text;
  v_role      public.user_role;
begin
  v_requested := coalesce(new.raw_user_meta_data ->> 'role', 'organizer');

  -- Whitelist, not blacklist. Signup metadata is attacker-controlled: anyone
  -- can pass {"role":"admin"} to supabase.auth.signUp. Only these two values
  -- are ever accepted, so 'admin' is unreachable through signup by design.
  if v_requested not in ('organizer', 'artist') then
    v_requested := 'organizer';
  end if;

  v_role := v_requested::public.user_role;

  insert into public.profiles (id, role, full_name)
  values (new.id, v_role, coalesce(new.raw_user_meta_data ->> 'full_name', ''));

  insert into public.profiles_private (id, email)
  values (new.id, new.email);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------------
-- Privilege-escalation guard
--
-- RLS lets a user update "their own row", and their role column is on their
-- own row. Without this trigger, `update profiles set role='admin'` from the
-- browser console succeeds. RLS cannot express "every column except this one",
-- so the rule belongs in a trigger.
-- ---------------------------------------------------------------------------

create or replace function private.lock_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role and not private.is_admin() then
    raise exception 'Only an admin can change a user role';
  end if;
  return new;
end;
$$;

create trigger profiles_lock_role
  before update on public.profiles
  for each row execute function private.lock_profile_role();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.profiles_private enable row level security;

-- Grants decide whether the table is reachable through the Data API at all;
-- RLS decides which rows come back once it is. Both are required. Without
-- these, every query from the browser fails with "permission denied" and
-- the RLS policies above never even get a chance to run.
grant select, insert, update on public.profiles         to authenticated;
grant select, insert, update on public.profiles_private to authenticated;

-- `to authenticated using (true)` would be authentication without
-- authorization: every signed-in user could read every profile row on the
-- platform. Nothing actually needs that. Public artist cards read
-- `artist_profiles`, which carries its own stage_name and avatar_url, so a
-- profile row is only ever needed for someone you are dealing with directly.
create policy "profiles are visible to self, counterparties and admins"
  on public.profiles for select
  to authenticated
  using (
    id = (select auth.uid())
    or private.shares_booking_with(id)
    or private.is_admin()
  );

create policy "users insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (id = (select auth.uid()));

create policy "users update their own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()) or private.is_admin())
  with check (id = (select auth.uid()) or private.is_admin());

-- No delete policy: profiles die with the auth user, via the cascade.

create policy "private contact data is self or admin"
  on public.profiles_private for select
  to authenticated
  using (id = (select auth.uid()) or private.is_admin());

create policy "users insert their own private row"
  on public.profiles_private for insert
  to authenticated
  with check (id = (select auth.uid()));

create policy "users update their own private row"
  on public.profiles_private for update
  to authenticated
  using (id = (select auth.uid()) or private.is_admin())
  with check (id = (select auth.uid()) or private.is_admin());
