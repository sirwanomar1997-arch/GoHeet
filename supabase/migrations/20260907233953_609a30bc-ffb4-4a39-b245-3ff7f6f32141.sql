CREATE TABLE public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null default 'general',
  subject text not null,
  status text not null default 'open',
  app_version text,
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

CREATE TABLE public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  from_staff boolean not null default false,
  body text not null,
  created_at timestamptz not null default now()
);

CREATE INDEX support_tickets_user_idx ON public.support_tickets(user_id, last_activity_at desc);
CREATE INDEX support_tickets_status_idx ON public.support_tickets(status, last_activity_at desc);
CREATE INDEX support_ticket_messages_ticket_idx ON public.support_ticket_messages(ticket_id, created_at);

GRANT SELECT, INSERT, UPDATE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
GRANT SELECT, INSERT ON public.support_ticket_messages TO authenticated;
GRANT ALL ON public.support_ticket_messages TO service_role;

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own tickets readable" ON public.support_tickets
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.is_staff(auth.uid()));

CREATE POLICY "create own ticket" ON public.support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "staff update tickets" ON public.support_tickets
  FOR UPDATE TO authenticated
  USING (private.is_staff(auth.uid()))
  WITH CHECK (private.is_staff(auth.uid()));

CREATE POLICY "ticket messages readable" ON public.support_ticket_messages
  FOR SELECT TO authenticated
  USING (
    private.is_staff(auth.uid())
    OR exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = auth.uid())
  );

CREATE POLICY "reply to own ticket" ON public.support_ticket_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND (
      (from_staff = false AND exists (
        select 1 from public.support_tickets t
        where t.id = ticket_id and t.user_id = auth.uid() and t.status <> 'resolved'
      ))
      OR (from_staff = true AND private.is_staff(auth.uid()))
    )
  );