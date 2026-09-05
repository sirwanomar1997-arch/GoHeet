CREATE OR REPLACE FUNCTION private.tg_protect_profile_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, private
AS $$
BEGIN
  IF current_setting('request.jwt.claims', true) IS NULL
     OR private.is_staff(auth.uid()) THEN
    RETURN NEW;
  END IF;

  NEW.id := OLD.id;
  NEW.banned_at := OLD.banned_at;
  NEW.suspended_until := OLD.suspended_until;
  NEW.deletion_requested_at := OLD.deletion_requested_at;
  NEW.deleted_at := OLD.deleted_at;
  NEW.follower_count := OLD.follower_count;
  NEW.following_count := OLD.following_count;
  NEW.moment_count := OLD.moment_count;
  NEW.total_views := OLD.total_views;
  NEW.total_likes := OLD.total_likes;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_columns ON public.profiles;
CREATE TRIGGER protect_profile_columns
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION private.tg_protect_profile_columns();