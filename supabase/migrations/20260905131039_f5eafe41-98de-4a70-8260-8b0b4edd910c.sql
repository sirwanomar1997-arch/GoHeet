alter table public.moments
  add constraint moments_author_profile_fkey foreign key (author_id) references public.profiles(id) on delete cascade;
alter table public.comments
  add constraint comments_author_profile_fkey foreign key (author_id) references public.profiles(id) on delete cascade;
alter table public.notifications
  add constraint notifications_actor_profile_fkey foreign key (actor_id) references public.profiles(id) on delete cascade;