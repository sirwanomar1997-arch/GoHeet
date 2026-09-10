CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Home feed: published, not deleted, newest first
CREATE INDEX IF NOT EXISTS moments_public_new_idx
  ON public.moments (created_at DESC)
  WHERE status = 'published' AND deleted_at IS NULL;

-- Home feed sorted by views
CREATE INDEX IF NOT EXISTS moments_public_views_idx
  ON public.moments (view_count DESC)
  WHERE status = 'published' AND deleted_at IS NULL;

-- Profile grids
CREATE INDEX IF NOT EXISTS moments_author_live_idx
  ON public.moments (author_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS moments_author_views_idx
  ON public.moments (author_id, view_count DESC)
  WHERE deleted_at IS NULL;

-- Trash view
CREATE INDEX IF NOT EXISTS moments_trash_idx
  ON public.moments (author_id, deleted_at DESC)
  WHERE deleted_at IS NOT NULL;

-- Caption search
CREATE INDEX IF NOT EXISTS moments_caption_trgm_idx
  ON public.moments USING gin (caption gin_trgm_ops);

-- People search / recommendations
CREATE INDEX IF NOT EXISTS profiles_username_trgm_idx
  ON public.profiles USING gin (username gin_trgm_ops);

CREATE INDEX IF NOT EXISTS profiles_display_name_trgm_idx
  ON public.profiles USING gin (display_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS profiles_discover_rank_idx
  ON public.profiles (follower_count DESC)
  WHERE discoverable = true AND deleted_at IS NULL;

-- Saved / liked lists and per-viewer feed decoration
CREATE INDEX IF NOT EXISTS saves_user_created_idx
  ON public.saves (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS likes_user_created_idx
  ON public.likes (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS saves_user_moment_idx
  ON public.saves (user_id, moment_id);

CREATE INDEX IF NOT EXISTS likes_user_moment_idx
  ON public.likes (user_id, moment_id);

CREATE INDEX IF NOT EXISTS reposts_user_moment_idx
  ON public.reposts (user_id, moment_id);

-- Comments by author, unread notifications, view dedupe
CREATE INDEX IF NOT EXISTS comments_author_idx
  ON public.comments (author_id, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_unread_idx
  ON public.notifications (user_id, created_at DESC)
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS moment_views_viewer_idx
  ON public.moment_views (viewer_id, view_day);

CREATE INDEX IF NOT EXISTS analytics_events_created_idx
  ON public.analytics_events (created_at DESC);

CREATE INDEX IF NOT EXISTS follows_follower_idx
  ON public.follows (follower_id, created_at DESC);

-- Keep usage statistics from growing without bound
CREATE OR REPLACE FUNCTION public.prune_analytics_events(_keep_days integer DEFAULT 90)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE removed integer;
BEGIN
  DELETE FROM public.analytics_events
  WHERE created_at < now() - make_interval(days => greatest(_keep_days, 1));
  GET DIAGNOSTICS removed = ROW_COUNT;
  RETURN removed;
END;
$$;

REVOKE ALL ON FUNCTION public.prune_analytics_events(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prune_analytics_events(integer) TO service_role;