import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CATEGORIES = ["general", "account", "safety", "bug", "payment", "other"] as const;

const createSchema = z.object({
  category: z.enum(CATEGORIES),
  subject: z.string().trim().min(3).max(120),
  body: z.string().trim().min(10).max(4000),
  contactName: z.string().trim().min(2).max(80),
  contactEmail: z.string().trim().email().max(120),
});


const replySchema = z.object({
  ticketId: z.string().uuid(),
  body: z.string().trim().min(1).max(4000),
});

async function isStaff(context: { supabase: { from: (t: "user_roles") => never }; userId: string }) {
  const { data } = await (context.supabase as never as {
    from: (t: string) => {
      select: (c: string) => { eq: (c: string, v: string) => Promise<{ data: { role: string }[] | null }> };
    };
  })
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId);
  return (data ?? []).some((r) => r.role === "admin" || r.role === "moderator" || r.role === "support");
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const createSupportTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createSchema.parse(input))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { count } = await sb
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .eq("user_id", context.userId)
      .neq("status", "resolved");
    if ((count ?? 0) >= 5) throw new Error("You already have 5 open requests. Please wait for a reply.");

    const { data: ticket, error } = await sb
      .from("support_tickets")
      .insert({
        user_id: context.userId,
        category: data.category,
        subject: data.subject,
        status: "open",
        contact_name: data.contactName,
        contact_email: data.contactEmail,
      })

      .select("id")
      .single();
    if (error || !ticket) throw new Error(error?.message ?? "Could not open the request");

    const { error: msgError } = await sb.from("support_ticket_messages").insert({
      ticket_id: ticket.id,
      author_id: context.userId,
      from_staff: false,
      body: data.body,
    });
    if (msgError) throw new Error(msgError.message);
    return { id: ticket.id as string };
  });

export const listSupportTickets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("support_tickets")
      .select("id, subject, category, status, created_at, last_activity_at")
      .eq("user_id", context.userId)
      .order("last_activity_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getSupportTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ ticketId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: ticket, error } = await context.supabase
      .from("support_tickets")
      .select("id, subject, category, status, created_at, last_activity_at, user_id")
      .eq("id", data.ticketId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!ticket) throw new Error("Request not found");

    const { data: messages, error: msgError } = await context.supabase
      .from("support_ticket_messages")
      .select("id, body, from_staff, created_at")
      .eq("ticket_id", data.ticketId)
      .order("created_at", { ascending: true });
    if (msgError) throw new Error(msgError.message);
    return { ticket, messages: messages ?? [] };
  });

export const replySupportTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => replySchema.parse(input))
  .handler(async ({ data, context }) => {
    const staff = await isStaff(context as never);
    const { error } = await context.supabase.from("support_ticket_messages").insert({
      ticket_id: data.ticketId,
      author_id: context.userId,
      from_staff: staff,
      body: data.body,
    });
    if (error) throw new Error(error.message);

    const sb = await admin();
    await sb
      .from("support_tickets")
      .update({
        last_activity_at: new Date().toISOString(),
        status: staff ? "awaiting_reply" : "open",
      })
      .eq("id", data.ticketId);
    return { ok: true };
  });

export const staffListSupportTickets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ status: z.enum(["open", "awaiting_reply", "resolved", "all"]).default("open") }).parse(input),
  )
  .handler(async ({ data, context }) => {
    if (!(await isStaff(context as never))) throw new Error("Forbidden");
    const sb = await admin();
    let query = sb
      .from("support_tickets")
      .select("id, subject, category, status, created_at, last_activity_at, user_id")
      .order("last_activity_at", { ascending: false })
      .limit(100);
    if (data.status !== "all") query = query.eq("status", data.status);
    const { data: tickets, error } = await query;
    if (error) throw new Error(error.message);

    const ids = [...new Set((tickets ?? []).map((t) => t.user_id))];
    const { data: profiles } = ids.length
      ? await sb.from("profiles").select("id, username").in("id", ids)
      : { data: [] as { id: string; username: string }[] };
    const byId = new Map((profiles ?? []).map((p) => [p.id, p.username]));
    return (tickets ?? []).map((t) => ({ ...t, username: byId.get(t.user_id) ?? "unknown" }));
  });

export const staffSetSupportTicketStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ ticketId: z.string().uuid(), status: z.enum(["open", "awaiting_reply", "resolved"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    if (!(await isStaff(context as never))) throw new Error("Forbidden");
    const sb = await admin();
    const { error } = await sb
      .from("support_tickets")
      .update({ status: data.status, last_activity_at: new Date().toISOString() })
      .eq("id", data.ticketId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
