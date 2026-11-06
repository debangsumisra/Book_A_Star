-- e2e_users.sql
-- Creates the three confirmed accounts the Playwright suite (e2e/) logs in as.
-- Run once in the SQL editor. Replace E2E_PASSWORD_HERE with the value of
-- E2E_PASSWORD from your local .env.e2e (never commit the real one).
--
-- Why SQL instead of the signup page: signup sends a confirmation email,
-- and the built-in mailer allows only a few per hour. Inserting with
-- email_confirmed_at set skips that. handle_new_user still fires, so the
-- profiles rows are created exactly as for a real signup.

do $$
declare
  v_password text := 'E2E_PASSWORD_HERE';
  v_users jsonb := '[
    {"id":"e2e00000-0000-4000-8000-000000000001","email":"e2e-organizer@bookastar.test","role":"organizer","name":"E2E Organizer"},
    {"id":"e2e00000-0000-4000-8000-000000000002","email":"e2e-artist@bookastar.test","role":"artist","name":"E2E Artist"},
    {"id":"e2e00000-0000-4000-8000-000000000003","email":"e2e-stranger@bookastar.test","role":"organizer","name":"E2E Stranger"}
  ]';
  v jsonb;
begin
  for v in select * from jsonb_array_elements(v_users) loop
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token)
    values ('00000000-0000-0000-0000-000000000000', (v->>'id')::uuid, 'authenticated', 'authenticated', v->>'email',
      extensions.crypt(v_password, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('role', v->>'role', 'full_name', v->>'name'), now(), now(), '', '', '', '')
    on conflict (id) do nothing;

    insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), (v->>'id')::uuid, v->>'id', 'email',
      jsonb_build_object('sub', v->>'id', 'email', v->>'email', 'email_verified', true), now(), now(), now())
    on conflict do nothing;
  end loop;

  insert into public.organizer_profiles (id, organization_name, organizer_type, city)
  values ('e2e00000-0000-4000-8000-000000000001', 'E2E Events Co', 'company', 'Pune'),
         ('e2e00000-0000-4000-8000-000000000003', 'Stranger Things Ltd', 'company', 'Mumbai')
  on conflict (id) do nothing;

  -- 'E2E City' keeps the test artist out of real users' city searches.
  insert into public.artist_profiles (id, stage_name, category, bio, languages, base_city, price_min, price_per_event, is_published, experience_years)
  values ('e2e00000-0000-4000-8000-000000000002', 'E2E The Band', 'band',
          'Automated test artist. A five-piece band used by the end-to-end test suite.', '{Hindi,English}', 'E2E City', 20000, 25000, true, 5)
  on conflict (id) do nothing;
end $$;
