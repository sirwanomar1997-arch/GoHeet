-- Ensure message updates (read receipts) can only change read_at.
-- RLS WITH CHECK cannot restrict columns, so enforce immutability via trigger.

create or replace function private.messages_only_read_at_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.id is distinct from old.id
     or new.conversation_id is distinct from old.conversation_id
     or new.sender_id is distinct from old.sender_id
     or new.body is distinct from old.body
     or new.created_at is distinct from old.created_at then
    raise exception 'Only read_at may be updated on messages';
  end if;
  return new;
end;
$$;

revoke all on function private.messages_only_read_at_update() from public, anon, authenticated;

drop trigger if exists messages_only_read_at on public.messages;
create trigger messages_only_read_at
before update on public.messages
for each row execute function private.messages_only_read_at_update();