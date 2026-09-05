DROP POLICY IF EXISTS "read avatars" ON storage.objects;

CREATE POLICY "read avatars of active profiles"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'avatars'
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (storage.foldername(name))[1]::uuid
      AND p.banned_at IS NULL
      AND p.deleted_at IS NULL
  )
);