ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS personal_photo_url text,
  ADD COLUMN IF NOT EXISTS profile_image_type text NOT NULL DEFAULT 'avatar';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_profile_image_type_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_profile_image_type_check
  CHECK (profile_image_type IN ('avatar', 'photo'));

CREATE OR REPLACE FUNCTION private.tg_protect_profile_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.id := OLD.id;
  NEW.follower_count := OLD.follower_count;
  NEW.following_count := OLD.following_count;
  NEW.moment_count := OLD.moment_count;
  NEW.total_views := OLD.total_views;
  NEW.total_likes := OLD.total_likes;
  NEW.suspended_until := OLD.suspended_until;
  NEW.banned_at := OLD.banned_at;
  NEW.deletion_requested_at := OLD.deletion_requested_at;
  NEW.deleted_at := OLD.deleted_at;
  RETURN NEW;
END;
$$;