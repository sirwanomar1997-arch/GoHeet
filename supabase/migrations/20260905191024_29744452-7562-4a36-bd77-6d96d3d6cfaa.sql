ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS allow_messages text NOT NULL DEFAULT 'everyone',
  ADD COLUMN IF NOT EXISTS show_following boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_likes boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_saves boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_allow_messages_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_allow_messages_check
  CHECK (allow_messages IN ('everyone','followers','nobody'));