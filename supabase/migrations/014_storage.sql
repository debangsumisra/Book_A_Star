-- 014_storage.sql
-- Storage buckets for avatars and portfolio media.
--
-- The path convention is load-bearing: every object must be stored as
--   {auth.uid()}/filename.jpg
-- because the policies below authorise writes by comparing the first folder
-- segment against the caller's id. Upload from React like this:
--   supabase.storage.from('portfolio').upload(`${user.id}/${file.name}`, file)

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do nothing;

-- Both buckets are public to READ: artist cards and portfolios have to render
-- for logged-out visitors. Writing is strictly owner-only.

create policy "avatars are publicly readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'avatars');

create policy "users upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "users replace their own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "users delete their own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "portfolio media is publicly readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'portfolio');

create policy "artists upload to their own portfolio folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'portfolio'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "artists replace their own portfolio media"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'portfolio'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "artists delete their own portfolio media"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'portfolio'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
