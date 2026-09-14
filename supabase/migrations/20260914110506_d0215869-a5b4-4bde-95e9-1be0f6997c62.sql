ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS audio_path text,
  ADD COLUMN IF NOT EXISTS audio_duration_ms integer;

ALTER TABLE public.messages ALTER COLUMN body SET DEFAULT '';