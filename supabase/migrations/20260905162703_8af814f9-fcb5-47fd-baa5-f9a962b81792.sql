-- ============================================================
-- Security hardening: definer functions, follows/likes policies
-- ============================================================

-- 1. Private (non-API-exposed) schema for security definer helpers
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO anon, authenticated;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

CREATE OR REPLACE FUNCTION private.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('admin','moderator'))
$$;

CREATE OR REPLACE FUNCTION private.is_blocked_between(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select exists (select 1 from public.blocks
    where (blocker_id = _a and blocked_id = _b) or (blocker_id = _b and blocked_id = _a))
$$;

-- Policy evaluation needs EXECUTE as the querying role, but these live outside the exposed API schema
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_blocked_between(uuid, uuid) TO anon, authenticated;

-- 2. Recreate policies that referenced the public helpers, now schema-qualified
DROP POLICY "staff read analytics" ON public.analytics_events;
CREATE POLICY "staff read analytics" ON public.analytics_events FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));

DROP POLICY "comments readable" ON public.comments;
CREATE POLICY "comments readable" ON public.comments FOR SELECT TO public
USING ((deleted_at IS NULL) AND (status = 'visible') AND ((auth.uid() IS NULL) OR (NOT private.is_blocked_between(auth.uid(), author_id))));
DROP POLICY "staff read comments" ON public.comments;
CREATE POLICY "staff read comments" ON public.comments FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
DROP POLICY "staff update comments" ON public.comments;
CREATE POLICY "staff update comments" ON public.comments FOR UPDATE TO authenticated USING (private.is_staff(auth.uid()));

DROP POLICY "create own follow" ON public.follows;
CREATE POLICY "create own follow" ON public.follows FOR INSERT TO authenticated
WITH CHECK ((follower_id = auth.uid()) AND (NOT private.is_blocked_between(follower_id, following_id)));

DROP POLICY "published moments readable" ON public.moments;
CREATE POLICY "published moments readable" ON public.moments FOR SELECT TO public
USING ((deleted_at IS NULL) AND (status = 'published') AND (EXISTS (SELECT 1 FROM public.profiles p
  WHERE p.id = moments.author_id AND p.deleted_at IS NULL AND p.banned_at IS NULL
    AND (p.is_private = false OR p.id = auth.uid() OR EXISTS (SELECT 1 FROM public.follows f WHERE f.following_id = p.id AND f.follower_id = auth.uid()))))
  AND ((auth.uid() IS NULL) OR (NOT private.is_blocked_between(auth.uid(), author_id))));
DROP POLICY "staff read moments" ON public.moments;
CREATE POLICY "staff read moments" ON public.moments FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
DROP POLICY "staff update moments" ON public.moments;
CREATE POLICY "staff update moments" ON public.moments FOR UPDATE TO authenticated USING (private.is_staff(auth.uid()));

DROP POLICY "staff read moderation log" ON public.moderation_actions;
CREATE POLICY "staff read moderation log" ON public.moderation_actions FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));

DROP POLICY "profiles are readable" ON public.profiles;
CREATE POLICY "profiles are readable" ON public.profiles FOR SELECT TO public
USING ((deleted_at IS NULL) AND (banned_at IS NULL) AND ((auth.uid() IS NULL) OR (auth.uid() = id) OR (NOT private.is_blocked_between(auth.uid(), id))));
DROP POLICY "staff update profiles" ON public.profiles;
CREATE POLICY "staff update profiles" ON public.profiles FOR UPDATE TO authenticated USING (private.is_staff(auth.uid()));

DROP POLICY "staff read reports" ON public.reports;
CREATE POLICY "staff read reports" ON public.reports FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
DROP POLICY "staff update reports" ON public.reports;
CREATE POLICY "staff update reports" ON public.reports FOR UPDATE TO authenticated USING (private.is_staff(auth.uid()));

DROP POLICY "staff read roles" ON public.user_roles;
CREATE POLICY "staff read roles" ON public.user_roles FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));

-- 3. Drop the API-exposed definer helpers
DROP FUNCTION public.has_role(uuid, public.app_role);
DROP FUNCTION public.is_staff(uuid);
DROP FUNCTION public.is_blocked_between(uuid, uuid);

-- 4. username_taken only reads publicly-readable profiles -> SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.username_taken(_username text)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  select exists (select 1 from public.profiles where lower(username) = lower(_username))
     or lower(_username) in ('admin','reelzy','support','moderator','root','staff','help','about','settings','login','signup','auth','api','moment','moments','official','system','team','security','privacy','terms')
$$;

-- 5. Trigger functions are never called through the API: revoke direct execute
REVOKE EXECUTE ON FUNCTION public.tg_comment_counts() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_follow_counts() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_like_counts() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_moment_counts() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_save_counts() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_view_counts() FROM public, anon, authenticated;

-- 6. Tighten follows visibility: authenticated only, scoped to own relationships or public profiles
DROP POLICY "follows readable" ON public.follows;
CREATE POLICY "follows readable" ON public.follows FOR SELECT TO authenticated
USING (
  follower_id = auth.uid() OR following_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = follows.following_id AND p.is_private = false AND p.deleted_at IS NULL AND p.banned_at IS NULL)
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = follows.follower_id AND p.is_private = false AND p.deleted_at IS NULL AND p.banned_at IS NULL)
);

-- 7. Tighten likes visibility: own likes or likes on moments visible to the requester
DROP POLICY "likes readable" ON public.likes;
CREATE POLICY "likes readable" ON public.likes FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.moments m WHERE m.id = likes.moment_id AND m.deleted_at IS NULL AND m.status = 'published'
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = m.author_id AND p.deleted_at IS NULL AND p.banned_at IS NULL
      AND (p.is_private = false OR p.id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.follows f WHERE f.following_id = p.id AND f.follower_id = auth.uid()))))
);

-- 8. Per-user avatar generation rate limiting
CREATE TABLE public.avatar_generation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.avatar_generation_logs TO authenticated;
GRANT ALL ON public.avatar_generation_logs TO service_role;
ALTER TABLE public.avatar_generation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own avatar generation logs" ON public.avatar_generation_logs FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "log own avatar generation" ON public.avatar_generation_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE INDEX avatar_generation_logs_user_created ON public.avatar_generation_logs (user_id, created_at);