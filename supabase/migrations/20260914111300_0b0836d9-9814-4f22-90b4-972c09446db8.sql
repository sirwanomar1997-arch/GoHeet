CREATE TABLE public.message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL CHECK (char_length(emoji) BETWEEN 1 AND 16),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_reactions TO authenticated;
GRANT ALL ON public.message_reactions TO service_role;

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view reactions in their chats"
ON public.message_reactions FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.messages m
  JOIN public.conversations c ON c.id = m.conversation_id
  WHERE m.id = message_reactions.message_id
    AND (c.user_a = auth.uid() OR c.user_b = auth.uid())
));

CREATE POLICY "Members can react in their chats"
ON public.message_reactions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND EXISTS (
  SELECT 1 FROM public.messages m
  JOIN public.conversations c ON c.id = m.conversation_id
  WHERE m.id = message_reactions.message_id
    AND (c.user_a = auth.uid() OR c.user_b = auth.uid())
));

CREATE POLICY "People can change their own reaction"
ON public.message_reactions FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "People can remove their own reaction"
ON public.message_reactions FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE INDEX message_reactions_message_idx ON public.message_reactions (message_id);