ALTER TABLE public.music_tracks
  ADD COLUMN provider text NOT NULL DEFAULT 'manual',
  ADD COLUMN provider_track_id text,
  ADD COLUMN artwork_url text,
  ADD COLUMN genres text[] NOT NULL DEFAULT '{}',
  ADD COLUMN license_id text,
  ADD COLUMN license_scope text,
  ADD COLUMN territories text[] NOT NULL DEFAULT ARRAY['*']::text[],
  ADD COLUMN license_starts_at timestamptz,
  ADD COLUMN license_ends_at timestamptz,
  ADD COLUMN attribution_text text,
  ADD COLUMN status text NOT NULL DEFAULT 'pending_review',
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX music_tracks_provider_identity_idx
  ON public.music_tracks(provider, provider_track_id)
  WHERE provider_track_id IS NOT NULL;

ALTER TABLE public.music_tracks
  ADD CONSTRAINT music_tracks_status_check
    CHECK (status IN ('pending_review', 'licensed', 'suspended', 'expired')),
  ADD CONSTRAINT music_tracks_duration_check
    CHECK (duration_ms IS NULL OR duration_ms > 0),
  ADD CONSTRAINT music_tracks_license_window_check
    CHECK (license_ends_at IS NULL OR license_starts_at IS NULL OR license_ends_at > license_starts_at);

UPDATE public.music_tracks
SET active = false,
    status = 'pending_review'
WHERE status = 'pending_review';

DROP POLICY IF EXISTS "Signed-in users can browse active tracks" ON public.music_tracks;
CREATE POLICY "Signed-in users can browse currently licensed tracks"
ON public.music_tracks
FOR SELECT
TO authenticated
USING (
  active
  AND status = 'licensed'
  AND license_id IS NOT NULL
  AND license_scope IS NOT NULL
  AND (license_starts_at IS NULL OR license_starts_at <= now())
  AND (license_ends_at IS NULL OR license_ends_at > now())
);

ALTER TABLE public.moments
  ADD COLUMN music_offset_ms integer NOT NULL DEFAULT 0,
  ADD COLUMN music_volume numeric(4,3) NOT NULL DEFAULT 0.75,
  ADD COLUMN original_audio_volume numeric(4,3) NOT NULL DEFAULT 1.0;

ALTER TABLE public.moments
  ADD CONSTRAINT moments_music_offset_check CHECK (music_offset_ms >= 0),
  ADD CONSTRAINT moments_music_volume_check CHECK (music_volume >= 0 AND music_volume <= 1),
  ADD CONSTRAINT moments_original_audio_volume_check CHECK (original_audio_volume >= 0 AND original_audio_volume <= 1);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_music_tracks_updated_at ON public.music_tracks;
CREATE TRIGGER set_music_tracks_updated_at
BEFORE UPDATE ON public.music_tracks
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();