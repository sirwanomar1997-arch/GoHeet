-- Support form contact details
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS contact_email text;

-- System (automatic) moderation actions have no human actor
ALTER TABLE public.moderation_actions ALTER COLUMN actor_id DROP NOT NULL;

-- Posts wait for the safety check before going public
ALTER TABLE public.moments ALTER COLUMN status SET DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_reports_target ON public.reports (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_moments_author_state ON public.moments (author_id, moderation_state);

CREATE OR REPLACE FUNCTION private.enforce_author_strikes(_author uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE strikes int;
BEGIN
  SELECT count(*) INTO strikes
  FROM public.moments
  WHERE author_id = _author
    AND moderation_state IN ('auto_removed', 'removed');

  IF strikes >= 3 THEN
    UPDATE public.profiles SET banned_at = coalesce(banned_at, now()) WHERE id = _author;
    UPDATE public.moments SET status = 'removed', moderation_state = 'removed'
      WHERE author_id = _author AND status = 'published';
    INSERT INTO public.moderation_actions (actor_id, action, target_type, target_id, reason)
    VALUES (NULL, 'ban_user', 'user', _author, 'Automatic: 3 removed posts');
  ELSIF strikes >= 2 THEN
    UPDATE public.profiles
      SET suspended_until = greatest(coalesce(suspended_until, now()), now() + interval '7 days')
      WHERE id = _author AND banned_at IS NULL;
    INSERT INTO public.moderation_actions (actor_id, action, target_type, target_id, reason)
    VALUES (NULL, 'suspend_user', 'user', _author, 'Automatic: 2 removed posts');
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION private.tg_reports_autoaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    UPDATE public.profiles
      SET suspended_until = greatest(coalesce(suspended_until, now()), now() + interval '7 days')
      WHERE id = NEW.target_id AND banned_at IS NULL;
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

DROP TRIGGER IF EXISTS reports_autoaction ON public.reports;
CREATE TRIGGER reports_autoaction
AFTER INSERT ON public.reports
FOR EACH ROW EXECUTE FUNCTION private.tg_reports_autoaction();