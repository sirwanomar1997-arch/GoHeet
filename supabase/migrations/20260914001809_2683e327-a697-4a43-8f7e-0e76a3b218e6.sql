-- 1. Restricted table for account moderation state
CREATE TABLE public.profile_moderation (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  banned_at timestamptz,
  suspended_until timestamptz,
  deletion_requested_at timestamptz,
  deleted_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.profile_moderation TO authenticated;
GRANT ALL ON public.profile_moderation TO service_role;

ALTER TABLE public.profile_moderation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_moderation self or staff read"
ON public.profile_moderation
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR private.is_staff(auth.uid()));

-- 2. Helper used by policies: is the profile free of bans/deletion?
CREATE OR REPLACE FUNCTION private.profile_active(_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profile_moderation m
    WHERE m.user_id = _id AND (m.banned_at IS NOT NULL OR m.deleted_at IS NOT NULL)
  )
$$;

-- 3. Copy existing moderation state
INSERT INTO public.profile_moderation (user_id, banned_at, suspended_until, deletion_requested_at, deleted_at)
SELECT id, banned_at, suspended_until, deletion_requested_at, deleted_at
FROM public.profiles
WHERE banned_at IS NOT NULL
   OR suspended_until IS NOT NULL
   OR deletion_requested_at IS NOT NULL
   OR deleted_at IS NOT NULL;

-- 4. Rewire trigger functions to the new table
CREATE OR REPLACE FUNCTION private.tg_protect_profile_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF pg_trigger_depth() > 1
     OR auth.uid() IS NULL
     OR private.is_staff(auth.uid()) THEN
    RETURN NEW;
  END IF;

  NEW.id := OLD.id;
  NEW.follower_count := OLD.follower_count;
  NEW.following_count := OLD.following_count;
  NEW.moment_count := OLD.moment_count;
  NEW.total_views := OLD.total_views;
  NEW.total_likes := OLD.total_likes;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.enforce_author_strikes(_author uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE strikes int;
BEGIN
  SELECT count(*) INTO strikes
  FROM public.moments
  WHERE author_id = _author
    AND moderation_state IN ('auto_removed', 'removed');

  IF strikes >= 3 THEN
    INSERT INTO public.profile_moderation (user_id, banned_at)
    VALUES (_author, now())
    ON CONFLICT (user_id) DO UPDATE
      SET banned_at = coalesce(public.profile_moderation.banned_at, now()),
          updated_at = now();
    UPDATE public.moments SET status = 'removed', moderation_state = 'removed'
      WHERE author_id = _author AND status = 'published';
    INSERT INTO public.moderation_actions (actor_id, action, target_type, target_id, reason)
    VALUES (NULL, 'ban_user', 'user', _author, 'Automatic: 3 removed posts');
  ELSIF strikes >= 2 THEN
    INSERT INTO public.profile_moderation (user_id, suspended_until)
    VALUES (_author, now() + interval '7 days')
    ON CONFLICT (user_id) DO UPDATE
      SET suspended_until = greatest(coalesce(public.profile_moderation.suspended_until, now()), now() + interval '7 days'),
          updated_at = now()
      WHERE public.profile_moderation.banned_at IS NULL;
    INSERT INTO public.moderation_actions (actor_id, action, target_type, target_id, reason)
    VALUES (NULL, 'suspend_user', 'user', _author, 'Automatic: 2 removed posts');
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION private.tg_reports_autoaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE reporters int; author uuid; state text;
BEGIN
  SELECT count(DISTINCT reporter_id) INTO reporters
  FROM public.reports
  WHERE target_type = NEW.target_type AND target_id = NEW.target_id;

  IF NEW.target_type = 'moment' AND reporters >= 10 THEN
    SELECT author_id, moderation_state INTO author, state
    FROM public.moments WHERE id = NEW.target_id;
    IF author IS NOT NULL AND state NOT IN ('auto_removed', 'removed') THEN
      UPDATE public.moments
        SET status = 'removed', moderation_state = 'auto_removed', deleted_at = coalesce(deleted_at, now())
        WHERE id = NEW.target_id;
      INSERT INTO public.moderation_actions (actor_id, action, target_type, target_id, reason)
      VALUES (NULL, 'remove_content', 'moment', NEW.target_id, 'Automatic: 10 reports');
      UPDATE public.reports SET status = 'actioned', resolved_at = now()
        WHERE target_type = 'moment' AND target_id = NEW.target_id AND status = 'open';
      PERFORM private.enforce_author_strikes(author);
    END IF;
  ELSIF NEW.target_type = 'user' AND reporters >= 10 THEN
    INSERT INTO public.profile_moderation (user_id, suspended_until)
    VALUES (NEW.target_id, now() + interval '7 days')
    ON CONFLICT (user_id) DO UPDATE
      SET suspended_until = greatest(coalesce(public.profile_moderation.suspended_until, now()), now() + interval '7 days'),
          updated_at = now()
      WHERE public.profile_moderation.banned_at IS NULL;
    INSERT INTO public.moderation_actions (actor_id, action, target_type, target_id, reason)
    VALUES (NULL, 'suspend_user', 'user', NEW.target_id, 'Automatic: 10 reports');
  ELSIF NEW.target_type = 'comment' AND reporters >= 10 THEN
    UPDATE public.comments SET status = 'removed' WHERE id = NEW.target_id;
    INSERT INTO public.moderation_actions (actor_id, action, target_type, target_id, reason)
    VALUES (NULL, 'remove_content', 'comment', NEW.target_id, 'Automatic: 10 reports');
  END IF;

  RETURN NULL;
END;
$$;

-- 5. Rewrite dependent policies to use private.profile_active()
DROP POLICY IF EXISTS "profiles are readable" ON public.profiles;
CREATE POLICY "profiles are readable" ON public.profiles FOR SELECT TO public
USING (
  private.profile_active(id)
  AND (auth.uid() IS NULL OR auth.uid() = id OR NOT private.is_blocked_between(auth.uid(), id))
  AND (is_private = false OR auth.uid() = id OR private.is_following(auth.uid(), id))
);

DROP POLICY IF EXISTS "published moments readable" ON public.moments;
CREATE POLICY "published moments readable" ON public.moments FOR SELECT
USING (
  deleted_at IS NULL
  AND status = 'published'
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = moments.author_id
      AND private.profile_active(p.id)
      AND (p.is_private = false OR p.id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.follows f WHERE f.following_id = p.id AND f.follower_id = auth.uid()))
  )
  AND (auth.uid() IS NULL OR NOT private.is_blocked_between(auth.uid(), author_id))
);

DROP POLICY IF EXISTS "follows readable" ON public.follows;
CREATE POLICY "follows readable" ON public.follows FOR SELECT
USING (
  follower_id = auth.uid()
  OR following_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = follows.following_id AND p.is_private = false AND private.profile_active(p.id))
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = follows.follower_id AND p.is_private = false AND private.profile_active(p.id))
);

DROP POLICY IF EXISTS "likes readable" ON public.likes;
CREATE POLICY "likes readable" ON public.likes FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.moments m
    WHERE m.id = likes.moment_id AND m.deleted_at IS NULL AND m.status = 'published'
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = m.author_id
          AND private.profile_active(p.id)
          AND (p.is_private = false OR p.id = auth.uid() OR EXISTS (
            SELECT 1 FROM public.follows f WHERE f.following_id = p.id AND f.follower_id = auth.uid()))))
);

DROP POLICY IF EXISTS "People can view allowed reposts" ON public.reposts;
CREATE POLICY "People can view allowed reposts" ON public.reposts FOR SELECT
USING (
  user_id = auth.uid()
  OR (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = reposts.user_id AND p.show_reposts = true AND private.profile_active(p.id))
    AND EXISTS (
      SELECT 1 FROM public.moments m
      WHERE m.id = reposts.moment_id AND m.status = 'published' AND m.deleted_at IS NULL)
    AND NOT EXISTS (
      SELECT 1 FROM public.blocks b
      WHERE (b.blocker_id = auth.uid() AND b.blocked_id = reposts.user_id)
         OR (b.blocker_id = reposts.user_id AND b.blocked_id = auth.uid()))
  )
);

DROP POLICY IF EXISTS "read avatars of visible profiles" ON storage.objects;
CREATE POLICY "read avatars of visible profiles" ON storage.objects FOR SELECT
USING (
  bucket_id = 'avatars'
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = ((storage.foldername(objects.name))[1])::uuid
      AND private.profile_active(p.id)
      AND (p.is_private = false OR p.id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.follows f WHERE f.following_id = p.id AND f.follower_id = auth.uid())
        OR private.is_staff(auth.uid())))
);

-- 6. Drop the moderation columns from the publicly readable profiles table
ALTER TABLE public.profiles
  DROP COLUMN banned_at,
  DROP COLUMN suspended_until,
  DROP COLUMN deletion_requested_at,
  DROP COLUMN deleted_at;

-- 7. Signed-in users can read audio for active licensed tracks from the music bucket
CREATE POLICY "Signed-in users can read licensed music audio"
ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'music'
  AND EXISTS (
    SELECT 1 FROM public.music_tracks t
    WHERE t.active AND t.audio_path = storage.objects.name
  )
);