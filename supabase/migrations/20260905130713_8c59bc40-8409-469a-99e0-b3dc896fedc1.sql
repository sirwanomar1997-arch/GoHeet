create policy "upload own capture media" on storage.objects for insert to authenticated
with check (
  bucket_id = 'moments'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (select 1 from public.capture_sessions cs where cs.user_id = auth.uid() and cs.status = 'open' and cs.started_at > now() - interval '2 hours')
);
create policy "delete own capture media" on storage.objects for delete to authenticated
using (bucket_id = 'moments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "upload own avatar" on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "update own avatar" on storage.objects for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "delete own avatar" on storage.objects for delete to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "read avatars" on storage.objects for select to authenticated
using (bucket_id = 'avatars');