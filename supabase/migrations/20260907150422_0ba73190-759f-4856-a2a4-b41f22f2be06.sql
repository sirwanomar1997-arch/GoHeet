-- 1. comment_likes: only expose likes on visible comments
DROP POLICY IF EXISTS "comment likes readable" ON public.comment_likes;
CREATE POLICY "comment likes readable" ON public.comment_likes
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.comments c
    WHERE c.id = comment_likes.comment_id
      AND c.status = 'visible'
      AND c.deleted_at IS NULL
  )
);

-- 2. messages: restrict update to read_at only (policy + existing trigger)
DROP POLICY IF EXISTS "Recipient marks messages read" ON public.messages;
CREATE POLICY "Recipient marks messages read" ON public.messages
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (auth.uid() = c.user_a OR auth.uid() = c.user_b)
      AND auth.uid() <> messages.sender_id
  )
)
WITH CHECK (
  auth.uid() <> messages.sender_id
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (auth.uid() = c.user_a OR auth.uid() = c.user_b)
  )
);

-- 3. conversations: only the status column may change
CREATE OR REPLACE FUNCTION private.tg_conversations_only_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
begin
  if new.id is distinct from old.id
     or new.user_a is distinct from old.user_a
     or new.user_b is distinct from old.user_b
     or new.requester_id is distinct from old.requester_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Only status may be updated on conversations';
  end if;
  return new;
end;
$$;

DROP TRIGGER IF EXISTS conversations_only_status ON public.conversations;
CREATE TRIGGER conversations_only_status
BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION private.tg_conversations_only_status();
