-- ============ roles ============
create type public.app_role as enum ('admin','moderator','support');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('admin','moderator'))
$$;

create policy "read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());
create policy "staff read roles" on public.user_roles for select to authenticated using (public.is_staff(auth.uid()));

-- ============ profiles ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  display_name text,
  bio text,
  avatar_url text,
  birth_date date,
  is_private boolean not null default false,
  discoverable boolean not null default true,
  allow_comments text not null default 'everyone',
  follower_count integer not null default 0,
  following_count integer not null default 0,
  moment_count integer not null default 0,
  total_views bigint not null default 0,
  suspended_until timestamptz,
  banned_at timestamptz,
  deletion_requested_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (username ~ '^[a-zA-Z0-9_.]{3,24}$'),
  constraint allow_comments_values check (allow_comments in ('everyone','followers','nobody'))
);
create unique index profiles_username_lower_idx on public.profiles (lower(username));
create index profiles_discover_idx on public.profiles (discoverable, deleted_at);
grant select, insert, update on public.profiles to authenticated;
grant select on public.profiles to anon;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create or replace function public.username_taken(_username text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where lower(username) = lower(_username))
     or lower(_username) in ('admin','reelzy','support','moderator','root','staff','help','about','settings','login','signup','auth','api','moment','moments','official','system','team','security','privacy','terms')
$$;
grant execute on function public.username_taken(text) to anon, authenticated;

-- ============ blocks ============
create table public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  constraint no_self_block check (blocker_id <> blocked_id)
);
create index blocks_blocked_idx on public.blocks (blocked_id);
grant select, insert, delete on public.blocks to authenticated;
grant all on public.blocks to service_role;
alter table public.blocks enable row level security;
create policy "manage own blocks" on public.blocks for all to authenticated using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

create or replace function public.is_blocked_between(_a uuid, _b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.blocks
    where (blocker_id = _a and blocked_id = _b) or (blocker_id = _b and blocked_id = _a))
$$;

create policy "profiles are readable" on public.profiles for select
  using (deleted_at is null and banned_at is null
    and (auth.uid() is null or auth.uid() = id or not public.is_blocked_between(auth.uid(), id)));
create policy "insert own profile" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "staff update profiles" on public.profiles for update to authenticated using (public.is_staff(auth.uid()));

-- ============ follows ============
create table public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, following_id),
  constraint no_self_follow check (follower_id <> following_id)
);
create index follows_following_idx on public.follows (following_id);
grant select, insert, delete on public.follows to authenticated;
grant select on public.follows to anon;
grant all on public.follows to service_role;
alter table public.follows enable row level security;
create policy "follows readable" on public.follows for select using (true);
create policy "create own follow" on public.follows for insert to authenticated
  with check (follower_id = auth.uid() and not public.is_blocked_between(follower_id, following_id));
create policy "remove own follow" on public.follows for delete to authenticated using (follower_id = auth.uid());

-- ============ capture sessions (camera-origin proof) ============
create table public.capture_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text,
  status text not null default 'open',
  device_kind text,
  started_at timestamptz not null default now(),
  consumed_at timestamptz,
  constraint capture_status check (status in ('open','uploaded','consumed','expired'))
);
create index capture_sessions_user_idx on public.capture_sessions (user_id, status);
grant select on public.capture_sessions to authenticated;
grant all on public.capture_sessions to service_role;
alter table public.capture_sessions enable row level security;
create policy "read own capture sessions" on public.capture_sessions for select to authenticated using (user_id = auth.uid());

-- ============ moments ============
create table public.moments (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  capture_session_id uuid references public.capture_sessions(id) on delete set null,
  kind text not null default 'video',
  media_path text not null,
  thumbnail_path text,
  duration_ms integer,
  caption text,
  location_label text,
  status text not null default 'published',
  moderation_state text not null default 'clean',
  like_count integer not null default 0,
  comment_count integer not null default 0,
  view_count bigint not null default 0,
  save_count integer not null default 0,
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint moment_kind check (kind in ('video','photo')),
  constraint moment_status check (status in ('published','hidden','removed')),
  constraint moderation_state_values check (moderation_state in ('clean','flagged','under_review','removed')),
  constraint caption_length check (caption is null or char_length(caption) <= 300)
);
create index moments_author_idx on public.moments (author_id, created_at desc);
create index moments_feed_idx on public.moments (status, created_at desc);
grant select, insert, update, delete on public.moments to authenticated;
grant select on public.moments to anon;
grant all on public.moments to service_role;
alter table public.moments enable row level security;

create policy "published moments readable" on public.moments for select using (
  deleted_at is null and status = 'published'
  and exists (select 1 from public.profiles p where p.id = author_id and p.deleted_at is null and p.banned_at is null
    and (p.is_private = false or p.id = auth.uid() or exists (select 1 from public.follows f where f.following_id = p.id and f.follower_id = auth.uid())))
  and (auth.uid() is null or not public.is_blocked_between(auth.uid(), author_id))
);
create policy "authors read own moments" on public.moments for select to authenticated using (author_id = auth.uid());
create policy "staff read moments" on public.moments for select to authenticated using (public.is_staff(auth.uid()));
create policy "authors update own moments" on public.moments for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "authors delete own moments" on public.moments for delete to authenticated using (author_id = auth.uid());
create policy "staff update moments" on public.moments for update to authenticated using (public.is_staff(auth.uid()));

-- ============ likes / saves ============
create table public.likes (
  id uuid primary key default gen_random_uuid(),
  moment_id uuid not null references public.moments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (moment_id, user_id)
);
create index likes_user_idx on public.likes (user_id);
grant select, insert, delete on public.likes to authenticated;
grant all on public.likes to service_role;
alter table public.likes enable row level security;
create policy "likes readable" on public.likes for select to authenticated using (true);
create policy "create own like" on public.likes for insert to authenticated with check (user_id = auth.uid());
create policy "remove own like" on public.likes for delete to authenticated using (user_id = auth.uid());

create table public.saves (
  id uuid primary key default gen_random_uuid(),
  moment_id uuid not null references public.moments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (moment_id, user_id)
);
grant select, insert, delete on public.saves to authenticated;
grant all on public.saves to service_role;
alter table public.saves enable row level security;
create policy "read own saves" on public.saves for select to authenticated using (user_id = auth.uid());
create policy "create own save" on public.saves for insert to authenticated with check (user_id = auth.uid());
create policy "remove own save" on public.saves for delete to authenticated using (user_id = auth.uid());

-- ============ comments ============
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  moment_id uuid not null references public.moments(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  body text not null,
  status text not null default 'visible',
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint comment_length check (char_length(body) between 1 and 500),
  constraint comment_status check (status in ('visible','hidden','removed'))
);
create index comments_moment_idx on public.comments (moment_id, created_at desc);
grant select, insert, update, delete on public.comments to authenticated;
grant select on public.comments to anon;
grant all on public.comments to service_role;
alter table public.comments enable row level security;
create policy "comments readable" on public.comments for select using (
  deleted_at is null and status = 'visible'
  and (auth.uid() is null or not public.is_blocked_between(auth.uid(), author_id))
);
create policy "staff read comments" on public.comments for select to authenticated using (public.is_staff(auth.uid()));
create policy "create own comment" on public.comments for insert to authenticated with check (author_id = auth.uid());
create policy "delete own comment" on public.comments for delete to authenticated using (
  author_id = auth.uid() or exists (select 1 from public.moments m where m.id = moment_id and m.author_id = auth.uid())
);
create policy "staff update comments" on public.comments for update to authenticated using (public.is_staff(auth.uid()));

-- ============ views ============
create table public.moment_views (
  id uuid primary key default gen_random_uuid(),
  moment_id uuid not null references public.moments(id) on delete cascade,
  viewer_id uuid references auth.users(id) on delete set null,
  view_day date not null default (now() at time zone 'utc')::date,
  watched_ms integer not null default 0,
  completed boolean not null default false,
  qualified boolean not null default false,
  created_at timestamptz not null default now(),
  unique (moment_id, viewer_id, view_day)
);
create index moment_views_moment_idx on public.moment_views (moment_id);
grant select on public.moment_views to authenticated;
grant all on public.moment_views to service_role;
alter table public.moment_views enable row level security;
create policy "authors read own moment views" on public.moment_views for select to authenticated using (
  exists (select 1 from public.moments m where m.id = moment_id and m.author_id = auth.uid())
);

-- ============ reports ============
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null,
  target_id uuid not null,
  category text not null,
  details text,
  status text not null default 'open',
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  constraint report_target check (target_type in ('user','moment','comment')),
  constraint report_status check (status in ('open','reviewing','actioned','dismissed')),
  constraint report_category check (category in ('harassment','bullying','hate','sexual','violence','dangerous','spam','impersonation','illegal','self_harm','other'))
);
create index reports_status_idx on public.reports (status, created_at desc);
grant select, insert on public.reports to authenticated;
grant update on public.reports to authenticated;
grant all on public.reports to service_role;
alter table public.reports enable row level security;
create policy "create own report" on public.reports for insert to authenticated with check (reporter_id = auth.uid());
create policy "read own report" on public.reports for select to authenticated using (reporter_id = auth.uid());
create policy "staff read reports" on public.reports for select to authenticated using (public.is_staff(auth.uid()));
create policy "staff update reports" on public.reports for update to authenticated using (public.is_staff(auth.uid()));

-- ============ moderation actions (audit log) ============
create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid not null,
  reason text,
  report_id uuid references public.reports(id) on delete set null,
  created_at timestamptz not null default now()
);
grant select on public.moderation_actions to authenticated;
grant all on public.moderation_actions to service_role;
alter table public.moderation_actions enable row level security;
create policy "staff read moderation log" on public.moderation_actions for select to authenticated using (public.is_staff(auth.uid()));

-- ============ notifications ============
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete cascade,
  type text not null,
  moment_id uuid references public.moments(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notification_type check (type in ('follow','like','comment','reply','mention','system'))
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
grant select, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "read own notifications" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "update own notifications" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete own notifications" on public.notifications for delete to authenticated using (user_id = auth.uid());

-- ============ policy acceptances ============
create table public.policy_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  policy_key text not null,
  version text not null,
  accepted_at timestamptz not null default now()
);
grant select on public.policy_acceptances to authenticated;
grant all on public.policy_acceptances to service_role;
alter table public.policy_acceptances enable row level security;
create policy "read own acceptances" on public.policy_acceptances for select to authenticated using (user_id = auth.uid());

-- ============ analytics events ============
create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  props jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index analytics_events_name_idx on public.analytics_events (name, created_at desc);
grant all on public.analytics_events to service_role;
alter table public.analytics_events enable row level security;
create policy "staff read analytics" on public.analytics_events for select to authenticated using (public.is_staff(auth.uid()));

-- ============ counter triggers ============
create or replace function public.tg_follow_counts() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles set follower_count = follower_count + 1 where id = new.following_id;
    update public.profiles set following_count = following_count + 1 where id = new.follower_id;
    insert into public.notifications (user_id, actor_id, type) values (new.following_id, new.follower_id, 'follow');
  elsif tg_op = 'DELETE' then
    update public.profiles set follower_count = greatest(follower_count - 1, 0) where id = old.following_id;
    update public.profiles set following_count = greatest(following_count - 1, 0) where id = old.follower_id;
  end if;
  return null;
end; $$;
create trigger follows_counts after insert or delete on public.follows for each row execute function public.tg_follow_counts();

create or replace function public.tg_like_counts() returns trigger language plpgsql security definer set search_path = public as $$
declare author uuid;
begin
  if tg_op = 'INSERT' then
    update public.moments set like_count = like_count + 1 where id = new.moment_id returning author_id into author;
    if author is not null and author <> new.user_id then
      insert into public.notifications (user_id, actor_id, type, moment_id) values (author, new.user_id, 'like', new.moment_id);
    end if;
  else
    update public.moments set like_count = greatest(like_count - 1, 0) where id = old.moment_id;
  end if;
  return null;
end; $$;
create trigger likes_counts after insert or delete on public.likes for each row execute function public.tg_like_counts();

create or replace function public.tg_save_counts() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.moments set save_count = save_count + 1 where id = new.moment_id;
  else
    update public.moments set save_count = greatest(save_count - 1, 0) where id = old.moment_id;
  end if;
  return null;
end; $$;
create trigger saves_counts after insert or delete on public.saves for each row execute function public.tg_save_counts();

create or replace function public.tg_comment_counts() returns trigger language plpgsql security definer set search_path = public as $$
declare author uuid;
begin
  if tg_op = 'INSERT' then
    update public.moments set comment_count = comment_count + 1 where id = new.moment_id returning author_id into author;
    if author is not null and author <> new.author_id then
      insert into public.notifications (user_id, actor_id, type, moment_id, comment_id)
      values (author, new.author_id, case when new.parent_id is null then 'comment' else 'reply' end, new.moment_id, new.id);
    end if;
  elsif tg_op = 'DELETE' then
    update public.moments set comment_count = greatest(comment_count - 1, 0) where id = old.moment_id;
  end if;
  return null;
end; $$;
create trigger comments_counts after insert or delete on public.comments for each row execute function public.tg_comment_counts();

create or replace function public.tg_moment_counts() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles set moment_count = moment_count + 1 where id = new.author_id;
  elsif tg_op = 'DELETE' then
    update public.profiles set moment_count = greatest(moment_count - 1, 0) where id = old.author_id;
  end if;
  return null;
end; $$;
create trigger moments_counts after insert or delete on public.moments for each row execute function public.tg_moment_counts();

create or replace function public.tg_view_counts() returns trigger language plpgsql security definer set search_path = public as $$
declare author uuid;
begin
  update public.moments set view_count = view_count + 1 where id = new.moment_id returning author_id into author;
  if author is not null then
    update public.profiles set total_views = total_views + 1 where id = author;
  end if;
  return null;
end; $$;
create trigger moment_views_counts after insert on public.moment_views for each row execute function public.tg_view_counts();

create or replace function public.tg_touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;
create trigger profiles_touch before update on public.profiles for each row execute function public.tg_touch_updated_at();