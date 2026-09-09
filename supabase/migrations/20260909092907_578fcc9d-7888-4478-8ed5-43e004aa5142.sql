alter table public.moments
  add column if not exists ai_score integer,
  add column if not exists ai_reason text,
  add column if not exists ai_checked_at timestamptz;

alter table public.capture_sessions
  add column if not exists camera_label text,
  add column if not exists live_capture boolean not null default false;

alter table public.reports drop constraint if exists report_category;
alter table public.reports add constraint report_category check (
  category in ('harassment','bullying','hate','sexual','violence','dangerous','spam',
               'impersonation','illegal','self_harm','ai_generated','other')
);