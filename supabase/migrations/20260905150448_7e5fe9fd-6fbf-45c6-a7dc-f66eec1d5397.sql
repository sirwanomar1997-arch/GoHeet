-- Add a denormalized total_likes counter on profiles, maintained by the
-- likes trigger (mirrors the existing total_views pattern).

alter table public.profiles
  add column if not exists total_likes bigint not null default 0;

-- Backfill from current moment like counts.
update public.profiles p set total_likes = coalesce((
  select sum(m.like_count)
  from public.moments m
  where m.author_id = p.id
    and m.deleted_at is null
), 0);

-- Replace the like-counts trigger so it also keeps profiles.total_likes in sync.
create or replace function public.tg_like_counts() returns trigger language plpgsql security definer set search_path = public as $$
declare author uuid;
begin
  if tg_op = 'INSERT' then
    update public.moments set like_count = like_count + 1 where id = new.moment_id returning author_id into author;
    if author is not null then
      update public.profiles set total_likes = total_likes + 1 where id = author;
      if author <> new.user_id then
        insert into public.notifications (user_id, actor_id, type, moment_id) values (author, new.user_id, 'like', new.moment_id);
      end if;
    end if;
  else
    update public.moments set like_count = greatest(like_count - 1, 0) where id = old.moment_id returning author_id into author;
    if author is not null then
      update public.profiles set total_likes = greatest(total_likes - 1, 0) where id = author;
    end if;
  end if;
  return null;
end; $$;