drop policy if exists "profiles are readable" on public.profiles;

create policy "profiles are readable"
on public.profiles
for select
to public
using (
  deleted_at is null
  and banned_at is null
  and (auth.uid() is null or auth.uid() = id or not private.is_blocked_between(auth.uid(), id))
  and (
    is_private = false
    or auth.uid() = id
    or exists (
      select 1 from public.follows f
      where f.follower_id = auth.uid()
        and f.following_id = profiles.id
    )
  )
);