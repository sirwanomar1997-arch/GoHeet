-- Reorder: drop the policy first, then the function, then recreate both.

drop policy "profiles are readable" on public.profiles;

drop function if exists public.is_following(uuid, uuid);

create or replace function private.is_following(_follower uuid, _following uuid)
returns boolean
language sql
stable
security definer
set search_path to public
as $$
  select exists (
    select 1
    from public.follows
    where follower_id = _follower
      and following_id = _following
  );
$$;

grant execute on function private.is_following(uuid, uuid) to authenticated;
grant execute on function private.is_following(uuid, uuid) to anon;

create policy "profiles are readable"
  on public.profiles
  for select
  to public
  using (
    deleted_at is null
    and banned_at is null
    and (
      auth.uid() is null
      or auth.uid() = id
      or not private.is_blocked_between(auth.uid(), id)
    )
    and (
      is_private = false
      or auth.uid() = id
      or private.is_following(auth.uid(), id)
    )
  );
