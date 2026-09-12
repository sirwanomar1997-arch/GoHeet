DROP POLICY IF EXISTS "read avatars of active profiles" ON storage.objects;
CREATE POLICY "read avatars of visible profiles"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'avatars'
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (storage.foldername(name))[1]::uuid
      AND p.banned_at IS NULL
      AND p.deleted_at IS NULL
      AND (
        p.is_private = false
        OR p.id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.follows f
          WHERE f.following_id = p.id AND f.follower_id = auth.uid()
        )
        OR private.is_staff(auth.uid())
      )
  )
);