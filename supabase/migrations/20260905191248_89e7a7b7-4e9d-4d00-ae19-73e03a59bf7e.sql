CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conversations_pair_order CHECK (user_a < user_b),
  CONSTRAINT conversations_pair_unique UNIQUE (user_a, user_b)
);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 2000),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX messages_conversation_idx ON public.messages (conversation_id, created_at DESC);
CREATE INDEX conversations_user_a_idx ON public.conversations (user_a, last_message_at DESC);
CREATE INDEX conversations_user_b_idx ON public.conversations (user_b, last_message_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants read their conversations"
ON public.conversations FOR SELECT TO authenticated
USING (auth.uid() = user_a OR auth.uid() = user_b);

CREATE POLICY "Recipient updates request status"
ON public.conversations FOR UPDATE TO authenticated
USING ((auth.uid() = user_a OR auth.uid() = user_b) AND auth.uid() <> requester_id)
WITH CHECK ((auth.uid() = user_a OR auth.uid() = user_b) AND auth.uid() <> requester_id);

CREATE POLICY "Participants read messages"
ON public.messages FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.conversations c
  WHERE c.id = messages.conversation_id
    AND (auth.uid() = c.user_a OR auth.uid() = c.user_b)
));

CREATE POLICY "Recipient marks messages read"
ON public.messages FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.conversations c
  WHERE c.id = messages.conversation_id
    AND (auth.uid() = c.user_a OR auth.uid() = c.user_b)
    AND auth.uid() <> messages.sender_id
))
WITH CHECK (true);

CREATE TRIGGER conversations_touch
BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

CREATE OR REPLACE FUNCTION public.tg_message_bump()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  return null;
end;
$$;

CREATE TRIGGER messages_bump
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.tg_message_bump();