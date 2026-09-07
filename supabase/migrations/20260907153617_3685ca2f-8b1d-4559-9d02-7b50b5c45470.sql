ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS show_reposts boolean NOT NULL DEFAULT true;

CREATE TABLE public.reposts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  moment_id uuid NOT NULL REFERENCES public.moments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, moment_id)
);

GRANT SELECT, INSERT, DELETE ON public.reposts TO authenticated;
GRANT ALL ON public.reposts TO service_role;

ALTER TABLE public.reposts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "People can view allowed reposts"
ON public.reposts
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = reposts.user_id
        AND p.show_reposts = true
        AND p.deleted_at IS NULL
    )
    AND EXISTS (
      SELECT 1
      FROM public.moments m
      WHERE m.id = reposts.moment_id
        AND m.status = 'published'
        AND m.deleted_at IS NULL
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.blocks b
      WHERE (b.blocker_id = auth.uid() AND b.blocked_id = reposts.user_id)
         OR (b.blocker_id = reposts.user_id AND b.blocked_id = auth.uid())
    )
  )
);

CREATE POLICY "People can repost as themselves"
ON public.reposts
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.moments m
    WHERE m.id = reposts.moment_id
      AND m.status = 'published'
      AND m.deleted_at IS NULL
  )
);

CREATE POLICY "People can remove their own reposts"
ON public.reposts
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

CREATE INDEX reposts_user_created_idx
  ON public.reposts (user_id, created_at DESC);

CREATE INDEX reposts_moment_idx
  ON public.reposts (moment_id);