CREATE TABLE public.comment_likes (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (comment_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.comment_likes TO authenticated;
GRANT ALL ON public.comment_likes TO service_role;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comment likes readable" ON public.comment_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "like own" ON public.comment_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "unlike own" ON public.comment_likes FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE INDEX comment_likes_comment_idx ON public.comment_likes(comment_id);