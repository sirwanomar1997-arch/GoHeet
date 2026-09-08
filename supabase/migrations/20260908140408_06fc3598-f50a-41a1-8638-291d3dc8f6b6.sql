-- capture_sessions: owner-scoped insert/update
create policy "create own capture sessions"
on public.capture_sessions for insert to authenticated
with check (user_id = auth.uid());

create policy "update own capture sessions"
on public.capture_sessions for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

grant select, insert, update on public.capture_sessions to authenticated;

-- moment_views: viewers can log their own views on visible moments
create policy "viewers log own views"
on public.moment_views for insert to authenticated
with check (
  viewer_id = auth.uid()
  and exists (
    select 1 from public.moments m
    where m.id = moment_views.moment_id
      and m.deleted_at is null
      and m.status = 'published'
  )
);

grant insert on public.moment_views to authenticated;