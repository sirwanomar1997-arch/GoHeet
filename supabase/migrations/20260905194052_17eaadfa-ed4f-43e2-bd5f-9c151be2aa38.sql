-- The profiles SELECT policy and the follows SELECT policy referenced each
-- other (profiles -> EXISTS follows, follows -> EXISTS profiles), causing
-- "infinite recursion detected in policy for relation profiles". This made
-- every profile read (including getMe for the owner) silently return null.
--
-- Break the cycle by replacing the inline follows lookup in the profiles
-- policy with a SECURITY DEFINER function that bypasses RLS on follows.

create or replace function public.is_following(_follower uuid, _following uuid)
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

grant execute on function public.is_following(uuid, uuid) to authenticated;
grant execute on function public.is_following(uuid, uuid) to anon;

drop policy "profiles are readable" on public.profiles;

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
      or public.is_following(auth.uid(), id)
    )
  );
