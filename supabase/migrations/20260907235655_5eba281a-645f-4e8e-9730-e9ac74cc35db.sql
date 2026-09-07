create or replace function private.moment_visible(_moment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (
    select 1
    from public.moments m
    where m.id = _moment_id
      and m.deleted_at is null
      and m.status = 'published'
      and (auth.uid() is null or not private.is_blocked_between(auth.uid(), m.author_id))
      and exists (
        select 1 from public.profiles p
        where p.id = m.author_id
          and p.deleted_at is null
          and p.banned_at is null
          and (
            p.is_private = false
            or p.id = auth.uid()
            or exists (
              select 1 from public.follows f
              where f.following_id = p.id and f.follower_id = auth.uid()
            )
          )
      )
  )
$$;

revoke all on function private.moment_visible(uuid) from public;
grant execute on function private.moment_visible(uuid) to authenticated, anon, service_role;

drop policy if exists "comments readable" on public.comments;
create policy "comments readable"
on public.comments
for select
using (
  deleted_at is null
  and status = 'visible'
  and (auth.uid() is null or not private.is_blocked_between(auth.uid(), author_id))
  and private.moment_visible(moment_id)
);

drop policy if exists "comment likes readable" on public.comment_likes;
create policy "comment likes readable"
on public.comment_likes
for select
using (
  exists (
    select 1
    from public.comments c
    where c.id = comment_likes.comment_id
      and c.status = 'visible'
      and c.deleted_at is null
      and private.moment_visible(c.moment_id)
  )
);