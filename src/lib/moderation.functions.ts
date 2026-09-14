import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Staff-only moderation API. Every handler re-verifies the caller's role. */

async function requireStaff(context: { supabase: { rpc: (fn: never, args: never) => unknown }; userId: string }) {
  const { data } = (await (context.supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: boolean | null }>)("is_staff", { _user_id: context.userId })) ?? { data: false };
  if (!data) throw new Error("Forbidden");
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const adminOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireStaff(context as never);
    const sb = await admin();
    const [people, moments, openReports, comments] = await Promise.all([
      sb.from("profiles").select("id", { count: "exact", head: true }),
      sb.from("moments").select("id", { count: "exact", head: true }),
      sb.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
      sb.from("comments").select("id", { count: "exact", head: true }),
    ]);
    return {
      people: people.count ?? 0,
      moments: moments.count ?? 0,
      openReports: openReports.count ?? 0,
      comments: comments.count ?? 0,
    };
  });

export const adminReportQueue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { status?: string }) => ({
    status: z.enum(["open", "reviewing", "actioned", "dismissed"]).optional().parse(d.status),
  }))
  .handler(async ({ data, context }) => {
    await requireStaff(context as never);
    const sb = await admin();
    let q = sb
      .from("reports")
      .select("id, target_type, target_id, category, details, status, created_at, reporter_id")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data.status) q = q.eq("status", data.status);
    const { data: reports } = await q;

    const enriched = await Promise.all(
      (reports ?? []).map(async (r) => {
        let label = r.target_id as string;
        if (r.target_type === "moment") {
          const { data: m } = await sb
            .from("moments")
            .select("caption, status, author_id")
            .eq("id", r.target_id)
            .maybeSingle();
          label = m?.caption ? `"${m.caption.slice(0, 60)}"` : "Moment";
        } else if (r.target_type === "comment") {
          const { data: c } = await sb.from("comments").select("body").eq("id", r.target_id).maybeSingle();
          label = c?.body ? `"${c.body.slice(0, 60)}"` : "Comment";
        } else {
          const { data: p } = await sb.from("profiles").select("username").eq("id", r.target_id).maybeSingle();
          label = p?.username ? `@${p.username}` : "Person";
        }
        return { ...r, label };
      }),
    );
    return { reports: enriched };
  });

export const adminAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    action: string;
    targetType: string;
    targetId: string;
    reportId?: string;
    reason?: string;
  }) => ({
    action: z
      .enum(["remove_content", "restore_content", "suspend_user", "ban_user", "reinstate_user", "dismiss_report"])
      .parse(d.action),
    targetType: z.enum(["user", "moment", "comment", "report"]).parse(d.targetType),
    targetId: z.string().uuid().parse(d.targetId),
    reportId: z.string().uuid().optional().parse(d.reportId),
    reason: z.string().trim().max(300).optional().parse(d.reason),
  }))
  .handler(async ({ data, context }) => {
    await requireStaff(context as never);
    const sb = await admin();

    switch (data.action) {
      case "remove_content":
        if (data.targetType === "moment") {
          await sb
            .from("moments")
            .update({ status: "removed", moderation_state: "removed" })
            .eq("id", data.targetId);
        } else if (data.targetType === "comment") {
          await sb.from("comments").update({ status: "removed" }).eq("id", data.targetId);
        }
        break;
      case "restore_content":
        if (data.targetType === "moment") {
          await sb
            .from("moments")
            .update({ status: "published", moderation_state: "clean" })
            .eq("id", data.targetId);
        } else if (data.targetType === "comment") {
          await sb.from("comments").update({ status: "visible" }).eq("id", data.targetId);
        }
        break;
      case "suspend_user":
        await sb
          .from("profile_moderation")
          .upsert({ user_id: data.targetId, suspended_until: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(), updated_at: new Date().toISOString() });
        break;
      case "ban_user":
        await sb.from("profile_moderation").upsert({ user_id: data.targetId, banned_at: new Date().toISOString(), updated_at: new Date().toISOString() });
        break;
      case "reinstate_user":
        await sb.from("profile_moderation").upsert({ user_id: data.targetId, banned_at: null, suspended_until: null, updated_at: new Date().toISOString() });
        break;
      case "dismiss_report":
        break;
    }

    if (data.reportId) {
      await sb
        .from("reports")
        .update({
          status: data.action === "dismiss_report" ? "dismissed" : "actioned",
          resolved_by: context.userId,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", data.reportId);
    }

    await sb.from("moderation_actions").insert({
      actor_id: context.userId,
      action: data.action,
      target_type: data.targetType,
      target_id: data.targetId,
      reason: data.reason ?? null,
      report_id: data.reportId ?? null,
    });

    return { ok: true };
  });

export const adminSearchPeople = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { q: string }) => ({ q: z.string().trim().max(60).parse(d.q) }))
  .handler(async ({ data, context }) => {
    await requireStaff(context as never);
    const sb = await admin();
    const term = data.q.replace(/[%_]/g, "");
    let q = sb
      .from("profiles")
      .select("id, username, display_name, moment_count, follower_count, created_at")
      .order("created_at", { ascending: false })
      .limit(30);
    if (term) q = q.or(`username.ilike.%${term}%,display_name.ilike.%${term}%`);
    const { data: people } = await q;
    const ids = (people ?? []).map((p) => p.id);
    const { data: mods } = ids.length
      ? await sb.from("profile_moderation").select("user_id, banned_at, suspended_until").in("user_id", ids)
      : { data: [] as { user_id: string; banned_at: string | null; suspended_until: string | null }[] };
    const modById = new Map((mods ?? []).map((m) => [m.user_id, m]));
    return {
      people: (people ?? []).map((p) => ({
        ...p,
        banned_at: modById.get(p.id)?.banned_at ?? null,
        suspended_until: modById.get(p.id)?.suspended_until ?? null,
      })),
    };
  });

export const adminModerationLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireStaff(context as never);
    const sb = await admin();
    const { data } = await sb
      .from("moderation_actions")
      .select("id, action, target_type, target_id, reason, created_at, actor_id")
      .order("created_at", { ascending: false })
      .limit(50);
    return { actions: data ?? [] };
  });

/** Posts the automatic safety review could not clear on its own. */
export const adminReviewQueue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireStaff(context as never);
    const sb = await admin();
    const { data: moments } = await sb
      .from("moments")
      .select("id, caption, kind, thumbnail_path, media_path, created_at, author_id, ai_score, ai_reason")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(50);

    const items = await Promise.all(
      (moments ?? []).map(async (m) => {
        const path = m.kind === "photo" ? m.media_path : (m.thumbnail_path ?? m.media_path);
        const { data: signed } = await sb.storage.from("moments").createSignedUrl(path, 600);
        const { data: p } = await sb.from("profiles").select("username").eq("id", m.author_id).maybeSingle();
        return {
          id: m.id as string,
          caption: m.caption,
          createdAt: m.created_at as string,
          username: p?.username ?? "unknown",
          aiScore: (m as { ai_score: number | null }).ai_score ?? null,
          aiReason: (m as { ai_reason: string | null }).ai_reason ?? null,
          previewUrl: signed?.signedUrl ?? null,
        };
      }),
    );
    return { items };
  });
