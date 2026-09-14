ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS unsent_at timestamptz;

CREATE TABLE IF NOT EXISTS public.conversation_hides (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  hidden_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (conversation_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_hides TO authenticated;
GRANT ALL ON public.conversation_hides TO service_role;

ALTER TABLE public.conversation_hides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own hides readable" ON public.conversation_hides FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own hides insertable" ON public.conversation_hides FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own hides updatable" ON public.conversation_hides FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own hides deletable" ON public.conversation_hides FOR DELETE TO authenticated USING (user_id = auth.uid());