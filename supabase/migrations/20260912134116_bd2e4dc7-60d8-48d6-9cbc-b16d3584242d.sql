-- Profiles: keep moderation + aggregate columns out of user hands, but allow
-- system counter triggers (nested) and staff/service-role updates through.
CREATE OR REPLACE FUNCTION private.tg_protect_profile_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  NEW.suspended_until := OLD.suspended_until;
  NEW.banned_at := OLD.banned_at;
  NEW.deleted_at := OLD.deleted_at;
  RETURN NEW;
END;
$function$;

-- Moments: authors may edit caption/media metadata only; moderation state,
-- AI review fields and engagement counters stay system-owned.
CREATE OR REPLACE FUNCTION private.tg_protect_moment_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF pg_trigger_depth() > 1
     OR auth.uid() IS NULL
     OR private.is_staff(auth.uid()) THEN
    RETURN NEW;
  END IF;

  NEW.id := OLD.id;
  NEW.author_id := OLD.author_id;
  NEW.capture_session_id := OLD.capture_session_id;
  NEW.media_path := OLD.media_path;
  NEW.captured_at := OLD.captured_at;
  NEW.created_at := OLD.created_at;
  NEW.moderation_state := OLD.moderation_state;
  NEW.ai_score := OLD.ai_score;
  NEW.ai_reason := OLD.ai_reason;
  NEW.ai_checked_at := OLD.ai_checked_at;
  NEW.like_count := OLD.like_count;
  NEW.comment_count := OLD.comment_count;
  NEW.view_count := OLD.view_count;
  NEW.save_count := OLD.save_count;

  -- Authors may archive/restore their own post or soft-delete it, but they
  -- must never bring back something moderation removed.
  IF OLD.status = 'removed' AND NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status := OLD.status;
  END IF;
  IF NEW.status NOT IN ('published', 'archived', 'removed') THEN
    NEW.status := OLD.status;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS protect_moment_columns ON public.moments;
CREATE TRIGGER protect_moment_columns
BEFORE UPDATE ON public.moments
FOR EACH ROW EXECUTE FUNCTION private.tg_protect_moment_columns();

-- Messages: recipients may only stamp read_at; everything else is frozen.
CREATE OR REPLACE FUNCTION private.messages_only_read_at_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF pg_trigger_depth() > 1 OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  NEW.id := OLD.id;
  NEW.conversation_id := OLD.conversation_id;
  NEW.sender_id := OLD.sender_id;
  NEW.body := OLD.body;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END;
$function$;