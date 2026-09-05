CREATE TABLE public.music_tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null,
  audio_path text not null,
  duration_ms integer,
  mood text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
GRANT SELECT ON public.music_tracks TO authenticated;
GRANT ALL ON public.music_tracks TO service_role;
ALTER TABLE public.music_tracks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users can browse active tracks" ON public.music_tracks FOR SELECT TO authenticated USING (active);

ALTER TABLE public.moments
  ADD COLUMN style_filter text,
  ADD COLUMN overlay jsonb,
  ADD COLUMN music_track_id uuid REFERENCES public.music_tracks(id) ON DELETE SET NULL;