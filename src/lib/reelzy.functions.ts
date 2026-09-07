import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

/**
 * Reelzy core server API.
 *
 * Every rule that matters (age, camera-origin, ownership, blocking, rate
 * limits) is enforced here and/or by database policies. The client is never
 * trusted with authorization.
 */

const SIGNED_URL_TTL = 60 * 60; // 1 hour

const usernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(24)
  .regex(/^[a-zA-Z0-9_.]+$/, "Letters, numbers, dots and underscores only");

function serverPublicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/* ------------------------------------------------------------------ */
/* Identifier sign-in — email or username (server-resolved, no leak)  */
/* ------------------------------------------------------------------ */

const identifierSchema = z.string().trim().min(3).max(254);
const passwordSchema = z.string().min(8).max(128);

export const signInWithIdentifier = createServerFn({ method: "POST" })
  .inputValidator((d: { identifier: string; password: string }) => ({
    identifier: identifierSchema.parse(d.identifier),
    password: passwordSchema.parse(d.password),
  }))
  .handler(async ({ data }) => {
    const id = data.identifier.trim();
    const looksEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id);
    let email = id;
    if (!looksEmail) {
      // Username: resolve to the account's email server-side. The email is
      // never returned to the client, so it can't be enumerated.
      const lookup = serverPublicClient();
      const { data: profile } = await lookup
        .from("profiles")
        .select("id")
        .ilike("username", id)
        .maybeSingle();
      if (!profile) throw new Error("Invalid login.");
      const adm = await admin();
      const { data: userData } = await adm.auth.admin.getUserById(profile.id);
      if (!userData?.user?.email) throw new Error("Invalid login.");
      email = userData.user.email;
    }
    const sb = serverPublicClient();
    const { data: res, error } = await sb.auth.signInWithPassword({
      email,
      password: data.password,
    });
    if (error || !res.session) throw new Error("Invalid login.");
    return {
      accessToken: res.session.access_token,
      refreshToken: res.session.refresh_token,
    };
  });

async function signMedia(paths: (string | null)[]) {
  const clean = [...new Set(paths.filter((p): p is string => !!p))];
  if (clean.length === 0) return {} as Record<string, string>;
  const sb = await admin();
  const { data } = await sb.storage.from("moments").createSignedUrls(clean, SIGNED_URL_TTL);
  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    if (row.path && row.signedUrl) map[row.path] = row.signedUrl;
  }
  return map;
}

async function signAvatars(paths: (string | null)[]) {
  const clean = [...new Set(paths.filter((p): p is string => !!p && !p.startsWith("http")))];
  if (clean.length === 0) return {} as Record<string, string>;
  const sb = await admin();
  const { data } = await sb.storage.from("avatars").createSignedUrls(clean, SIGNED_URL_TTL);
  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    if (row.path && row.signedUrl) map[row.path] = row.signedUrl;
  }
  return map;
}

async function track(userId: string | null, name: string, props: Record<string, unknown> = {}) {
  try {
    const sb = await admin();
    await sb.from("analytics_events").insert({ user_id: userId, name, props: props as never });
  } catch {
    /* analytics must never break a user action */
  }
}

function ageFrom(birthDate: string) {
  const dob = new Date(birthDate);
  const now = new Date();
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const m = now.getUTCMonth() - dob.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < dob.getUTCDate())) age--;
  return age;
}

export type MomentCard = {
  id: string;
  caption: string | null;
  kind: string;
  mediaUrl: string | null;
  posterUrl: string | null;
  durationMs: number | null;
  locationLabel: string | null;
  createdAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  liked: boolean;
  saved: boolean;
  reposted: boolean;
  styleFilter: string | null;
  overlay: { text: string; font: string; style: string; place: string; color?: string; x?: number; y?: number; size?: number; rotate?: number } | null;
  music: {
    id: string;
    title: string;
    artist: string;
    url: string | null;
    artworkUrl: string | null;
    attributionText: string | null;
    offsetMs: number;
    volume: number;
  } | null;
  originalAudioVolume: number;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  isOwn: boolean;
};

/* ------------------------------------------------------------------ */
/* Account setup                                                       */
/* ------------------------------------------------------------------ */

export const checkUsername = createServerFn({ method: "POST" })
  .inputValidator((d: { username: string }) => ({ username: usernameSchema.parse(d.username) }))
  .handler(async ({ data }) => {
    const sb = serverPublicClient();
    const { data: taken } = await sb.rpc("username_taken", { _username: data.username });
    return { available: taken === false };
  });

export const completeSignup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { username: string; displayName?: string; birthDate: string }) => ({
    username: usernameSchema.parse(d.username),
    displayName: z.string().trim().max(40).optional().parse(d.displayName),
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(d.birthDate),
  }))
  .handler(async ({ data, context }) => {
    if (ageFrom(data.birthDate) < 13) {
      throw new Error("Reelzy is for people aged 13 and over.");
    }
    const sb = await admin();
    const { data: taken } = await sb.rpc("username_taken", { _username: data.username });
    if (taken) throw new Error("That username is taken.");

    const { error } = await sb.from("profiles").upsert(
      {
        id: context.userId,
        username: data.username,
        display_name: data.displayName || data.username,
      },
      { onConflict: "id" },
    );
    if (error) throw new Error(error.message);

    const { error: privErr } = await sb
      .from("profile_private")
      .upsert({ user_id: context.userId, birth_date: data.birthDate }, { onConflict: "user_id" });
    if (privErr) throw new Error(privErr.message);

    await sb.from("policy_acceptances").insert([
      { user_id: context.userId, policy_key: "terms", version: "2026-01" },
      { user_id: context.userId, policy_key: "privacy", version: "2026-01" },
      { user_id: context.userId, policy_key: "guidelines", version: "2026-01" },
    ]);
    await track(context.userId, "registration_completed");
    return { ok: true };
  });

export const getMe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (!data) return { profile: null, isStaff: false };
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const { data: priv } = await context.supabase
      .from("profile_private")
      .select("birth_date")
      .eq("user_id", context.userId)
      .maybeSingle();
    const avatars = await signAvatars([data.avatar_url, data.personal_photo_url]);
    return {
      profile: {
        ...data,
        birth_date: priv?.birth_date ?? null,
        avatar_url: data.avatar_url ? (avatars[data.avatar_url] ?? null) : null,
        personal_photo_url: data.personal_photo_url
          ? (avatars[data.personal_photo_url] ?? null)
          : null,
      },
      roles: (roles ?? []).map((r) => r.role),
      isStaff: (roles ?? []).some((r) => r.role === "admin" || r.role === "moderator"),
    };
  });

const SOCIAL_KEYS = ["instagram", "tiktok", "youtube", "twitter", "facebook", "snapchat", "whatsapp"] as const;
const SOCIAL_DOMAINS: Record<(typeof SOCIAL_KEYS)[number], string[]> = {
  instagram: ["instagram.com"],
  tiktok: ["tiktok.com"],
  youtube: ["youtube.com", "youtu.be"],
  twitter: ["x.com", "twitter.com"],
  facebook: ["facebook.com", "fb.com"],
  snapchat: ["snapchat.com"],
  whatsapp: ["wa.me", "whatsapp.com", "api.whatsapp.com"],
};
const socialSchema = z
  .record(z.enum(SOCIAL_KEYS), z.string().trim().max(300))
  .transform((v) => {
    const out: Record<string, string> = {};
    for (const [k, val] of Object.entries(v)) {
      const raw = (val ?? "").trim();
      if (!raw) continue;
      let url: URL;
      try {
        url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
      } catch {
        throw new Error(`The ${k} link isn't a valid URL.`);
      }
      const host = url.hostname.toLowerCase().replace(/^www\./, "");
      const allowed = SOCIAL_DOMAINS[k as (typeof SOCIAL_KEYS)[number]];
      if (!allowed.some((d) => host === d || host.endsWith(`.${d}`))) {
        throw new Error(`The ${k} link must be a ${allowed[0]} URL.`);
      }
      url.protocol = "https:";
      out[k] = url.toString();
    }
    return out;
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    displayName?: string;
    bio?: string;
    username?: string;
    isPrivate?: boolean;
    discoverable?: boolean;
    allowComments?: string;
    allowMessages?: string;
    showFollowing?: boolean;
    showLikes?: boolean;
    showSaves?: boolean;
    showReposts?: boolean;
    profileImageType?: "avatar" | "photo";
    socialLinks?: Record<string, string>;
  }) => ({
    displayName: z.string().trim().max(40).optional().parse(d.displayName),
    bio: z.string().trim().max(160).optional().parse(d.bio),
    username: d.username ? usernameSchema.parse(d.username) : undefined,
    isPrivate: d.isPrivate,
    discoverable: d.discoverable,
    allowComments: d.allowComments
      ? z.enum(["everyone", "followers", "nobody"]).parse(d.allowComments)
      : undefined,
    allowMessages: d.allowMessages
      ? z.enum(["everyone", "followers", "nobody"]).parse(d.allowMessages)
      : undefined,
    showFollowing: d.showFollowing,
    showLikes: d.showLikes,
    showSaves: d.showSaves,
    showReposts: d.showReposts,
    profileImageType: d.profileImageType
      ? z.enum(["avatar", "photo"]).parse(d.profileImageType)
      : undefined,
    socialLinks: d.socialLinks ? socialSchema.parse(d.socialLinks) : undefined,
  }))
  .handler(async ({ data, context }) => {
    const sb = await admin();
    const patch: Record<string, unknown> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (data.displayName !== undefined) patch["display_name"] = data.displayName;
    if (data.bio !== undefined) patch["bio"] = data.bio;
    if (data.isPrivate !== undefined) patch["is_private"] = data.isPrivate;
    if (data.discoverable !== undefined) patch["discoverable"] = data.discoverable;
    if (data.allowComments !== undefined) patch["allow_comments"] = data.allowComments;
    if (data.allowMessages !== undefined) patch["allow_messages"] = data.allowMessages;
    if (data.showFollowing !== undefined) patch["show_following"] = data.showFollowing;
    if (data.showLikes !== undefined) patch["show_likes"] = data.showLikes;
    if (data.showSaves !== undefined) patch["show_saves"] = data.showSaves;
    if (data.showReposts !== undefined) patch["show_reposts"] = data.showReposts;
    if (data.profileImageType !== undefined) patch["profile_image_type"] = data.profileImageType;
    if (data.socialLinks !== undefined) patch["social_links"] = data.socialLinks;

    if (data.username) {
      const { data: current } = await sb
        .from("profiles")
        .select("username")
        .eq("id", context.userId)
        .maybeSingle();
      if (current?.username?.toLowerCase() !== data.username.toLowerCase()) {
        const { data: taken } = await sb.rpc("username_taken", { _username: data.username });
        if (taken) throw new Error("That username is taken.");
        patch["username"] = data.username;
      }
    }
    if (Object.keys(patch).length === 0) return { ok: true };
    const { error } = await sb.from("profiles").update(patch as never).eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateBirthDate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { birthDate: string }) => ({
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date.").parse(d.birthDate),
  }))
  .handler(async ({ data, context }) => {
    const age = ageFrom(data.birthDate);
    if (Number.isNaN(age) || age < 13) {
      throw new Error("Reelzy is for people aged 13 and over.");
    }
    if (age > 120) throw new Error("Pick a valid date of birth.");
    const sb = await admin();
    const { error } = await sb
      .from("profile_private")
      .upsert({ user_id: context.userId, birth_date: data.birthDate }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true, birthDate: data.birthDate };
  });

/* ------------------------------------------------------------------ */
/* Camera capture pipeline                                             */
/* ------------------------------------------------------------------ */

export const startCapture = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { deviceKind?: string }) => ({
    deviceKind: z.string().max(40).optional().parse(d.deviceKind),
  }))
  .handler(async ({ data, context }) => {
    const sb = await admin();
    // Expire stale open sessions for this user before opening a new one.
    await sb
      .from("capture_sessions")
      .update({ status: "expired" })
      .eq("user_id", context.userId)
      .eq("status", "open")
      .lt("started_at", new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString());

    const { data: session, error } = await sb
      .from("capture_sessions")
      .insert({ user_id: context.userId, device_kind: data.deviceKind ?? "web" })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await track(context.userId, "camera_opened");
    return {
      sessionId: session.id,
      storagePrefix: `${context.userId}/${session.id}`,
    };
  });

export const publishMoment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    sessionId: string;
    mediaPath: string;
    thumbnailPath?: string;
    kind: string;
    durationMs?: number;
    caption?: string;
    locationLabel?: string;
    styleFilter?: string;
    overlay?: { text: string; font: string; style: string; place: string; color?: string; x?: number; y?: number; size?: number; rotate?: number };
    musicTrackId?: string;
    musicOffsetMs?: number;
    musicVolume?: number;
    originalAudioVolume?: number;
  }) => ({
    sessionId: z.string().uuid().parse(d.sessionId),
    mediaPath: z.string().max(300).parse(d.mediaPath),
    thumbnailPath: z.string().max(300).optional().parse(d.thumbnailPath),
    kind: z.enum(["video", "photo"]).parse(d.kind),
    durationMs: z.number().int().min(0).max(300_000).optional().parse(d.durationMs),
    caption: z.string().trim().max(300).optional().parse(d.caption),
    locationLabel: z.string().trim().max(60).optional().parse(d.locationLabel),
    styleFilter: z.string().max(24).optional().parse(d.styleFilter),
    overlay: z
      .object({
        text: z.string().trim().min(1).max(120),
        font: z.string().max(16),
        style: z.string().max(16),
        place: z.string().max(16),
        color: z.string().max(12).optional(),
        x: z.number().min(0).max(100).optional(),
        y: z.number().min(0).max(100).optional(),
        size: z.number().min(10).max(80).optional(),
        rotate: z.number().min(-45).max(45).optional(),
      })
      .optional()
      .parse(d.overlay),
    musicTrackId: z.string().uuid().optional().parse(d.musicTrackId),
    musicOffsetMs: z.number().int().min(0).max(3_600_000).optional().parse(d.musicOffsetMs),
    musicVolume: z.number().min(0).max(1).optional().parse(d.musicVolume),
    originalAudioVolume: z.number().min(0).max(1).optional().parse(d.originalAudioVolume),
  }))
  .handler(async ({ data, context }) => {
    const sb = await admin();

    // 1. The capture session must exist, belong to the caller and be unused.
    const { data: session } = await sb
      .from("capture_sessions")
      .select("id, user_id, status, started_at")
      .eq("id", data.sessionId)
      .maybeSingle();
    if (!session || session.user_id !== context.userId) {
      throw new Error("This moment was not captured with the Reelzy camera.");
    }
    if (session.status !== "open") throw new Error("This capture session has already been used.");
    if (Date.now() - new Date(session.started_at).getTime() > 2 * 60 * 60 * 1000) {
      await sb.from("capture_sessions").update({ status: "expired" }).eq("id", session.id);
      throw new Error("This capture session expired. Please record again.");
    }

    // 2. The media path must live inside this session's server-issued folder.
    const expectedPrefix = `${context.userId}/${session.id}/`;
    if (!data.mediaPath.startsWith(expectedPrefix)) {
      throw new Error("Media does not belong to this capture session.");
    }
    if (data.thumbnailPath && !data.thumbnailPath.startsWith(expectedPrefix)) {
      throw new Error("Thumbnail does not belong to this capture session.");
    }

    // 3. The object must actually exist in Reelzy storage.
    const folder = data.mediaPath.slice(0, data.mediaPath.lastIndexOf("/"));
    const fileName = data.mediaPath.slice(data.mediaPath.lastIndexOf("/") + 1);
    const { data: listed } = await sb.storage.from("moments").list(folder, { limit: 100 });
    const found = (listed ?? []).find((o) => o.name === fileName);
    if (!found) throw new Error("Captured media was not found in Reelzy storage.");

    // 4. Basic abuse control: max 20 published moments per hour.
    const { count } = await sb
      .from("moments")
      .select("id", { count: "exact", head: true })
      .eq("author_id", context.userId)
      .gt("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());
    if ((count ?? 0) >= 20) throw new Error("You are posting too fast. Try again later.");

    if (data.musicTrackId) {
      const now = new Date().toISOString();
      const { data: licensedTrack } = await sb
        .from("music_tracks")
        .select("id, duration_ms")
        .eq("id", data.musicTrackId)
        .eq("active", true)
        .eq("status", "licensed")
        .not("license_id", "is", null)
        .not("license_scope", "is", null)
        .or(`license_starts_at.is.null,license_starts_at.lte.${now}`)
        .or(`license_ends_at.is.null,license_ends_at.gt.${now}`)
        .maybeSingle();
      if (!licensedTrack) throw new Error("That track is no longer available for Reelz.");
      if (licensedTrack.duration_ms && (data.musicOffsetMs ?? 0) >= licensedTrack.duration_ms) {
        throw new Error("Choose an earlier part of this track.");
      }
    }

    const { data: moment, error } = await sb
      .from("moments")
      .insert({
        author_id: context.userId,
        capture_session_id: session.id,
        kind: data.kind,
        media_path: data.mediaPath,
        thumbnail_path: data.thumbnailPath ?? null,
        duration_ms: data.durationMs ?? null,
        caption: data.caption ?? null,
        location_label: data.locationLabel ?? null,
        style_filter: data.styleFilter ?? null,
        overlay: data.overlay ?? null,
        music_track_id: data.musicTrackId ?? null,
        music_offset_ms: data.musicTrackId ? (data.musicOffsetMs ?? 0) : 0,
        music_volume: data.musicTrackId ? (data.musicVolume ?? 0.75) : 0,
        original_audio_volume: data.originalAudioVolume ?? 1,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await sb
      .from("capture_sessions")
      .update({ status: "consumed", consumed_at: new Date().toISOString(), storage_path: data.mediaPath })
      .eq("id", session.id);

    await track(context.userId, "moment_published", { kind: data.kind });
    return { id: moment.id };
  });

const TRASH_DAYS = 30;

/** Permanently removes the caller's trashed moments older than 30 days. */
async function purgeExpiredTrash(userId: string) {
  const sb = await admin();
  const cutoff = new Date(Date.now() - TRASH_DAYS * 24 * 3600 * 1000).toISOString();
  const { data: rows } = await sb
    .from("moments")
    .select("id, media_path, thumbnail_path")
    .eq("author_id", userId)
    .not("deleted_at", "is", null)
    .lt("deleted_at", cutoff);
  if (!rows?.length) return;
  const paths = rows.flatMap((r) => [r.media_path, r.thumbnail_path]).filter(Boolean) as string[];
  if (paths.length) await sb.storage.from("moments").remove(paths);
  await sb
    .from("moments")
    .delete()
    .in(
      "id",
      rows.map((r) => r.id),
    );
}

export const deleteMoment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { momentId: string }) => ({ momentId: z.string().uuid().parse(d.momentId) }))
  .handler(async ({ data, context }) => {
    const sb = await admin();
    const { data: moment } = await sb
      .from("moments")
      .select("id, author_id")
      .eq("id", data.momentId)
      .maybeSingle();
    if (!moment || moment.author_id !== context.userId) throw new Error("Not allowed.");
    // Soft delete: the moment sits in Trash for 30 days before it is erased.
    await sb
      .from("moments")
      .update({ status: "removed", deleted_at: new Date().toISOString() })
      .eq("id", moment.id);
    await track(context.userId, "moment_trashed");
    return { ok: true };
  });

export const listTrash = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await purgeExpiredTrash(context.userId);
    const sb = await admin();
    const { data: rows } = await sb
      .from("moments")
      .select("id, caption, kind, media_path, thumbnail_path, created_at, deleted_at")
      .eq("author_id", context.userId)
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false })
      .limit(100);
    const list = rows ?? [];
    const media = await signMedia(list.flatMap((r) => [r.media_path, r.thumbnail_path]));
    return {
      items: list.map((r) => {
        const deletedAt = r.deleted_at as string;
        const expiresAt = new Date(
          new Date(deletedAt).getTime() + TRASH_DAYS * 24 * 3600 * 1000,
        ).toISOString();
        const daysLeft = Math.max(
          0,
          Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (24 * 3600 * 1000)),
        );
        return {
          id: r.id,
          caption: r.caption,
          kind: r.kind,
          createdAt: r.created_at,
          deletedAt,
          expiresAt,
          daysLeft,
          mediaUrl: media[r.media_path] ?? null,
          thumbnailUrl: r.thumbnail_path ? (media[r.thumbnail_path] ?? null) : null,
        };
      }),
    };
  });

export const restoreMoment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { momentId: string }) => ({ momentId: z.string().uuid().parse(d.momentId) }))
  .handler(async ({ data, context }) => {
    const sb = await admin();
    const { data: moment } = await sb
      .from("moments")
      .select("id, author_id, deleted_at")
      .eq("id", data.momentId)
      .maybeSingle();
    if (!moment || moment.author_id !== context.userId || !moment.deleted_at)
      throw new Error("Not allowed.");
    await sb
      .from("moments")
      .update({ status: "published", deleted_at: null })
      .eq("id", moment.id);
    await track(context.userId, "moment_restored");
    return { ok: true };
  });

export const deleteMomentForever = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { momentId: string }) => ({ momentId: z.string().uuid().parse(d.momentId) }))
  .handler(async ({ data, context }) => {
    const sb = await admin();
    const { data: moment } = await sb
      .from("moments")
      .select("id, author_id, media_path, thumbnail_path")
      .eq("id", data.momentId)
      .maybeSingle();
    if (!moment || moment.author_id !== context.userId) throw new Error("Not allowed.");
    const paths = [moment.media_path, moment.thumbnail_path].filter(Boolean) as string[];
    if (paths.length) await sb.storage.from("moments").remove(paths);
    await sb.from("moments").delete().eq("id", moment.id);
    await track(context.userId, "moment_deleted_forever");
    return { ok: true };
  });

export const emptyTrash = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = await admin();
    const { data: rows } = await sb
      .from("moments")
      .select("id, media_path, thumbnail_path")
      .eq("author_id", context.userId)
      .not("deleted_at", "is", null);
    const list = rows ?? [];
    if (list.length) {
      const paths = list.flatMap((r) => [r.media_path, r.thumbnail_path]).filter(Boolean) as string[];
      if (paths.length) await sb.storage.from("moments").remove(paths);
      await sb
        .from("moments")
        .delete()
        .in(
          "id",
          list.map((r) => r.id),
        );
    }
    await track(context.userId, "trash_emptied", { count: list.length });
    return { ok: true, count: list.length };
  });

export const setMomentVisibility = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { momentId: string; status: string }) => ({
    momentId: z.string().uuid().parse(d.momentId),
    status: z.enum(["published", "hidden"]).parse(d.status),
  }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("moments")
      .update({ status: data.status })
      .eq("id", data.momentId)
      .eq("author_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Feed                                                                */
/* ------------------------------------------------------------------ */

type FeedRow = {
  id: string;
  caption: string | null;
  kind: string;
  media_path: string;
  thumbnail_path: string | null;
  duration_ms: number | null;
  location_label: string | null;
  created_at: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  author_id: string;
  style_filter?: string | null;
  overlay?: { text: string; font: string; style: string; place: string; color?: string; x?: number; y?: number; size?: number; rotate?: number } | null;
  music_offset_ms?: number;
  music_volume?: number;
  original_audio_volume?: number;
  music_tracks?: {
    id: string;
    title: string;
    artist: string;
    audio_path: string;
    artwork_url: string | null;
    attribution_text: string | null;
  } | null;
  profiles?: { id: string; username: string; display_name: string | null; avatar_url: string | null; personal_photo_url: string | null; profile_image_type: string } | null;
};

async function decorate(rows: FeedRow[], viewerId: string | null): Promise<MomentCard[]> {
  const media = await signMedia(rows.flatMap((r) => [r.media_path, r.thumbnail_path]));
  const avatars = await signAvatars(
    rows.map((r) =>
      r.profiles?.profile_image_type === "photo" && r.profiles.personal_photo_url
        ? r.profiles.personal_photo_url
        : (r.profiles?.avatar_url ?? null),
    ),
  );

  const musicUrls = await signMusic(rows.map((r) => r.music_tracks?.audio_path ?? null));

  let liked = new Set<string>();
  let saved = new Set<string>();
  let reposted = new Set<string>();
  if (viewerId && rows.length) {
    const sb = await admin();
    const ids = rows.map((r) => r.id);
    const [{ data: l }, { data: s }, { data: r }] = await Promise.all([
      sb.from("likes").select("moment_id").eq("user_id", viewerId).in("moment_id", ids),
      sb.from("saves").select("moment_id").eq("user_id", viewerId).in("moment_id", ids),
      sb.from("reposts").select("moment_id").eq("user_id", viewerId).in("moment_id", ids),
    ]);
    liked = new Set((l ?? []).map((x) => x.moment_id));
    saved = new Set((s ?? []).map((x) => x.moment_id));
    reposted = new Set((r ?? []).map((x) => x.moment_id));
  }

  return rows.map((r) => ({
    id: r.id,
    caption: r.caption,
    kind: r.kind,
    mediaUrl: media[r.media_path] ?? null,
    posterUrl: r.thumbnail_path ? (media[r.thumbnail_path] ?? null) : null,
    durationMs: r.duration_ms,
    locationLabel: r.location_label,
    createdAt: r.created_at,
    viewCount: Number(r.view_count ?? 0),
    likeCount: r.like_count ?? 0,
    commentCount: r.comment_count ?? 0,
    liked: liked.has(r.id),
    saved: saved.has(r.id),
    reposted: reposted.has(r.id),
    styleFilter: r.style_filter ?? null,
    overlay: (r.overlay as MomentCard["overlay"]) ?? null,
    originalAudioVolume: Number(r.original_audio_volume ?? 1),
    music: r.music_tracks
      ? {
          id: r.music_tracks.id,
          title: r.music_tracks.title,
          artist: r.music_tracks.artist,
          url: musicUrls[r.music_tracks.audio_path] ?? null,
          artworkUrl: r.music_tracks.artwork_url,
          attributionText: r.music_tracks.attribution_text,
          offsetMs: r.music_offset_ms ?? 0,
          volume: Number(r.music_volume ?? 0.75),
        }
      : null,
    isOwn: viewerId === r.author_id,
    author: {
      id: r.profiles?.id ?? r.author_id,
      username: r.profiles?.username ?? "someone",
      displayName: r.profiles?.display_name ?? null,
      avatarUrl: (() => {
        const path = r.profiles?.profile_image_type === "photo" && r.profiles.personal_photo_url
          ? r.profiles.personal_photo_url
          : r.profiles?.avatar_url;
        return path ? (avatars[path] ?? null) : null;
      })(),
    },
  }));
}

const MOMENT_SELECT =
  "id, caption, kind, media_path, thumbnail_path, duration_ms, location_label, created_at, view_count, like_count, comment_count, author_id, style_filter, overlay, music_offset_ms, music_volume, original_audio_volume, music_tracks(id, title, artist, audio_path, artwork_url, attribution_text), profiles!moments_author_profile_fkey(id, username, display_name, avatar_url, personal_photo_url, profile_image_type)";

/** Music lives in a private bucket; playback uses short-lived signed URLs. */
async function signMusic(paths: Array<string | null>): Promise<Record<string, string>> {
  const unique = [...new Set(paths.filter(Boolean) as string[])];
  if (!unique.length) return {};
  const sb = await admin();
  const { data } = await sb.storage.from("music").createSignedUrls(unique, 60 * 60);
  const out: Record<string, string> = {};
  for (const row of data ?? []) if (row.path && row.signedUrl) out[row.path] = row.signedUrl;
  return out;
}

/** The Reelzy music library. Only licensed tracks loaded by staff appear here. */
export const listMusicTracks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const sb = await admin();
    const { data } = await sb
      .from("music_tracks")
      .select("id, title, artist, audio_path, artwork_url, duration_ms, mood, genres, attribution_text, provider")
      .eq("active", true)
      .eq("status", "licensed")
      .order("title");
    const rows = data ?? [];
    const urls = await signMusic(rows.map((r) => r.audio_path));
    return {
      tracks: rows.map((r) => ({
        id: r.id,
        title: r.title,
        artist: r.artist,
        artworkUrl: r.artwork_url,
        mood: r.mood,
        genres: r.genres,
        durationMs: r.duration_ms,
        attributionText: r.attribution_text,
        provider: r.provider,
        url: urls[r.audio_path] ?? null,
      })),
    };
  });

export const getFeed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { scope: string; cursor?: string; sort?: string }) => ({
    scope: z.enum(["following", "discover", "saved", "liked"]).parse(d.scope),
    cursor: z.string().optional().parse(d.cursor),
    sort: z.enum(["new", "views", "old"]).catch("new").parse(d.sort ?? "new"),
  }))
  .handler(async ({ data, context }) => {
    const limit = 8;

    if (data.scope === "saved" || data.scope === "liked") {
      const table = data.scope === "saved" ? "saves" : "likes";
      const { data: rels } = await context.supabase
        .from(table)
        .select("moment_id, created_at")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(limit);
      const ids = (rels ?? []).map((s) => s.moment_id);
      if (!ids.length) return { moments: [], nextCursor: null };
      const { data: rows } = await context.supabase
        .from("moments")
        .select(MOMENT_SELECT)
        .in("id", ids)
        .is("deleted_at", null);
      return { moments: await decorate((rows ?? []) as unknown as FeedRow[], context.userId), nextCursor: null };
    }

    let query = context.supabase
      .from("moments")
      .select(MOMENT_SELECT)
      .eq("status", "published")
      .is("deleted_at", null)
      .limit(data.sort === "new" ? limit : 24);

    if (data.sort === "views") query = query.order("view_count", { ascending: false });
    else if (data.sort === "old") query = query.order("created_at", { ascending: true });
    else query = query.order("created_at", { ascending: false });

    if (data.cursor && data.sort === "new") query = query.lt("created_at", data.cursor);

    if (data.scope === "following") {
      const { data: follows } = await context.supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", context.userId);
      const ids = (follows ?? []).map((f) => f.following_id);
      if (!ids.length) return { moments: [], nextCursor: null };
      query = query.in("author_id", ids);
    } else {
      query = query.neq("author_id", context.userId);
    }

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    const list = (rows ?? []) as unknown as FeedRow[];
    return {
      moments: await decorate(list, context.userId),
      nextCursor:
        data.sort === "new" && list.length === limit ? list[list.length - 1]!.created_at : null,
    };
  });

/* ------------------------------------------------------------------ */
/* Views                                                               */
/* ------------------------------------------------------------------ */

export const recordView = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { momentId: string; watchedMs: number; completed?: boolean }) => ({
    momentId: z.string().uuid().parse(d.momentId),
    watchedMs: z.number().int().min(0).max(600_000).parse(d.watchedMs),
    completed: z.boolean().optional().parse(d.completed),
  }))
  .handler(async ({ data, context }) => {
    // A view only counts once per person per moment per day, and only after
    // a meaningful amount of watch time.
    if (data.watchedMs < 1500) return { counted: false };
    const sb = await admin();
    const { data: moment } = await sb
      .from("moments")
      .select("author_id")
      .eq("id", data.momentId)
      .maybeSingle();
    if (!moment) return { counted: false };
    if (moment.author_id === context.userId) return { counted: false };

    const { error } = await sb.from("moment_views").insert({
      moment_id: data.momentId,
      viewer_id: context.userId,
      watched_ms: data.watchedMs,
      completed: data.completed ?? false,
      qualified: data.watchedMs >= 3000,
    });
    if (error) return { counted: false }; // duplicate for today
    await track(context.userId, "moment_viewed");
    return { counted: true };
  });

/* ------------------------------------------------------------------ */
/* Interactions                                                        */
/* ------------------------------------------------------------------ */

export const toggleLike = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { momentId: string }) => ({ momentId: z.string().uuid().parse(d.momentId) }))
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("likes")
      .select("id")
      .eq("moment_id", data.momentId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (existing) {
      await context.supabase.from("likes").delete().eq("id", existing.id);
      return { liked: false };
    }
    const { error } = await context.supabase
      .from("likes")
      .insert({ moment_id: data.momentId, user_id: context.userId });
    if (error) throw new Error(error.message);
    await track(context.userId, "moment_liked");
    return { liked: true };
  });

export const toggleSave = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { momentId: string }) => ({ momentId: z.string().uuid().parse(d.momentId) }))
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("saves")
      .select("id")
      .eq("moment_id", data.momentId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (existing) {
      await context.supabase.from("saves").delete().eq("id", existing.id);
      return { saved: false };
    }
    const { error } = await context.supabase
      .from("saves")
      .insert({ moment_id: data.momentId, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { saved: true };
  });

export const toggleRepost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { momentId: string }) => ({ momentId: z.string().uuid().parse(d.momentId) }))
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("reposts")
      .select("id")
      .eq("moment_id", data.momentId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (existing) {
      const { error } = await context.supabase.from("reposts").delete().eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { reposted: false };
    }
    const { error } = await context.supabase
      .from("reposts")
      .insert({ moment_id: data.momentId, user_id: context.userId });
    if (error) throw new Error(error.message);
    await track(context.userId, "moment_reposted");
    return { reposted: true };
  });

export const toggleFollow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => ({ userId: z.string().uuid().parse(d.userId) }))
  .handler(async ({ data, context }) => {
    if (data.userId === context.userId) throw new Error("You cannot follow yourself.");
    const { data: existing } = await context.supabase
      .from("follows")
      .select("id")
      .eq("follower_id", context.userId)
      .eq("following_id", data.userId)
      .maybeSingle();
    if (existing) {
      await context.supabase.from("follows").delete().eq("id", existing.id);
      await track(context.userId, "unfollow");
      return { following: false };
    }
    const { error } = await context.supabase
      .from("follows")
      .insert({ follower_id: context.userId, following_id: data.userId });
    if (error) throw new Error(error.message);
    await track(context.userId, "follow");
    return { following: true };
  });

export const listComments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { momentId: string }) => ({ momentId: z.string().uuid().parse(d.momentId) }))
  .handler(async ({ data, context }) => {
    const { data: rows } = await context.supabase
      .from("comments")
      .select("id, body, created_at, author_id, parent_id, profiles!comments_author_profile_fkey(username, display_name, avatar_url)")
      .eq("moment_id", data.momentId)
      .order("created_at", { ascending: false })
      .limit(200);
    const list = (rows ?? []) as unknown as Array<{
      id: string;
      body: string;
      created_at: string;
      author_id: string;
      parent_id: string | null;
      profiles: { username: string; display_name: string | null; avatar_url: string | null } | null;
    }>;
    const ids = list.map((c) => c.id);
    const { data: likeRows } = ids.length
      ? await context.supabase
          .from("comment_likes")
          .select("comment_id, user_id")
          .in("comment_id", ids)
      : { data: [] as Array<{ comment_id: string; user_id: string }> };
    const counts = new Map<string, number>();
    const mine = new Set<string>();
    for (const r of (likeRows ?? []) as Array<{ comment_id: string; user_id: string }>) {
      counts.set(r.comment_id, (counts.get(r.comment_id) ?? 0) + 1);
      if (r.user_id === context.userId) mine.add(r.comment_id);
    }
    const avatars = await signAvatars(list.map((c) => c.profiles?.avatar_url ?? null));
    return {
      comments: list.map((c) => ({
        id: c.id,
        body: c.body,
        createdAt: c.created_at,
        parentId: c.parent_id,
        likeCount: counts.get(c.id) ?? 0,
        liked: mine.has(c.id),
        isOwn: c.author_id === context.userId,
        username: c.profiles?.username ?? "someone",
        displayName: c.profiles?.display_name ?? null,
        avatarUrl: c.profiles?.avatar_url ? (avatars[c.profiles.avatar_url] ?? null) : null,
      })),
    };
  });

export const toggleCommentLike = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { commentId: string }) => ({ commentId: z.string().uuid().parse(d.commentId) }))
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("comment_likes")
      .select("id")
      .eq("comment_id", data.commentId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (existing) {
      await context.supabase.from("comment_likes").delete().eq("id", existing.id);
      return { liked: false };
    }
    const { error } = await context.supabase
      .from("comment_likes")
      .insert({ comment_id: data.commentId, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { liked: true };
  });


export const addComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { momentId: string; body: string; parentId?: string | null }) => ({
    momentId: z.string().uuid().parse(d.momentId),
    body: z.string().trim().min(1).max(500).parse(d.body),
    parentId: d.parentId ? z.string().uuid().parse(d.parentId) : null,
  }))
  .handler(async ({ data, context }) => {
    const sb = await admin();
    // Rate limit: 15 comments per 10 minutes.
    const { count } = await sb
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("author_id", context.userId)
      .gt("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString());
    if ((count ?? 0) >= 15) throw new Error("Slow down a little — try again in a few minutes.");

    // Respect the author's comment setting.
    const { data: moment } = await sb
      .from("moments")
      .select("author_id, profiles!moments_author_profile_fkey(allow_comments)")
      .eq("id", data.momentId)
      .maybeSingle();
    const setting = (moment as unknown as { profiles?: { allow_comments: string } })?.profiles
      ?.allow_comments;
    if (moment && moment.author_id !== context.userId) {
      if (setting === "nobody") throw new Error("Comments are turned off for this moment.");
      if (setting === "followers") {
        const { data: rel } = await sb
          .from("follows")
          .select("id")
          .eq("follower_id", context.userId)
          .eq("following_id", moment.author_id)
          .maybeSingle();
        if (!rel) throw new Error("Only followers can comment on this moment.");
      }
    }

    const { error } = await context.supabase
      .from("comments")
      .insert({
        moment_id: data.momentId,
        author_id: context.userId,
        body: data.body,
        parent_id: data.parentId,
      });
    if (error) throw new Error(error.message);
    await track(context.userId, "comment_created");
    return { ok: true };
  });

export const deleteComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { commentId: string }) => ({ commentId: z.string().uuid().parse(d.commentId) }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("comments").delete().eq("id", data.commentId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Profiles, discovery, notifications                                  */
/* ------------------------------------------------------------------ */

export const getProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { username: string; sort?: string }) => ({
    username: usernameSchema.parse(d.username),
    sort: z.enum(["new", "views", "old"]).catch("new").parse(d.sort ?? "new"),
  }))
  .handler(async ({ data, context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("*")
      .ilike("username", data.username)
      .maybeSingle();
    if (!profile) return { profile: null, moments: [], isFollowing: false, isSelf: false };

    const isSelf = profile.id === context.userId;
    const { data: rel } = await context.supabase
      .from("follows")
      .select("id")
      .eq("follower_id", context.userId)
      .eq("following_id", profile.id)
      .maybeSingle();

    const orderCol = data.sort === "views" ? "view_count" : "created_at";
    const { data: rows } = await context.supabase
      .from("moments")
      .select(MOMENT_SELECT)
      .eq("author_id", profile.id)
      .is("deleted_at", null)
      .order(orderCol, { ascending: data.sort === "old" })
      .limit(40);

    const { data: repostRows } = await context.supabase
      .from("reposts")
      .select("moment_id, created_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(40);
    const repostIds = (repostRows ?? []).map((repost) => repost.moment_id);
    const { data: repostedMoments } = repostIds.length
      ? await context.supabase
          .from("moments")
          .select(MOMENT_SELECT)
          .in("id", repostIds)
          .eq("status", "published")
          .is("deleted_at", null)
      : { data: [] as unknown[] };
    const repostOrder = new Map(repostIds.map((id, index) => [id, index]));
    const orderedReposts = ((repostedMoments ?? []) as unknown as FeedRow[]).sort(
      (a, b) => (repostOrder.get(a.id) ?? 0) - (repostOrder.get(b.id) ?? 0),
    );

    const displayImagePath = profile.profile_image_type === "photo" && profile.personal_photo_url
      ? profile.personal_photo_url
      : profile.avatar_url;
    const avatars = await signAvatars([displayImagePath]);
    return {
      profile: {
        id: profile.id,
        username: profile.username,
        displayName: profile.display_name,
        bio: profile.bio,
        avatarUrl: displayImagePath ? (avatars[displayImagePath] ?? null) : null,
        hasAvatar: !!profile.avatar_url,
        hasPersonalPhoto: !!profile.personal_photo_url,
        profileImageType: profile.profile_image_type,
        followerCount: profile.follower_count,
        followingCount: profile.following_count,
        momentCount: profile.moment_count,
        totalViews: Number(profile.total_views ?? 0),
        totalLikes: Number(profile.total_likes ?? 0),
        isPrivate: profile.is_private,
        showReposts: profile.show_reposts,
        socialLinks: ((profile as unknown as { social_links?: Record<string, string> })
          .social_links ?? {}) as Record<string, string>,
        createdAt: profile.created_at,

      },
      moments: await decorate((rows ?? []) as unknown as FeedRow[], context.userId),
      reposts: await decorate(orderedReposts, context.userId),
      isFollowing: !!rel,
      isSelf,
    };
  });

export const searchReelzy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { q: string }) => ({ q: z.string().trim().max(60).parse(d.q) }))
  .handler(async ({ data, context }) => {
    const term = data.q.replace(/[%_]/g, "");
    const people = term
      ? await context.supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url, follower_count, moment_count")
          .eq("discoverable", true)
          .neq("id", context.userId)
          .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
          .limit(20)
      : await context.supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url, follower_count, moment_count")
          .eq("discoverable", true)
          .neq("id", context.userId)
          .order("follower_count", { ascending: false })
          .limit(20);

    const rows = people.data ?? [];
    const avatars = await signAvatars(rows.map((p) => p.avatar_url));

    let moments: MomentCard[] = [];
    if (term) {
      const { data: mrows } = await context.supabase
        .from("moments")
        .select(MOMENT_SELECT)
        .eq("status", "published")
        .ilike("caption", `%${term}%`)
        .order("view_count", { ascending: false })
        .limit(12);
      moments = await decorate((mrows ?? []) as unknown as FeedRow[], context.userId);
    } else {
      const { data: mrows } = await context.supabase
        .from("moments")
        .select(MOMENT_SELECT)
        .eq("status", "published")
        .gt("created_at", new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString())
        .order("view_count", { ascending: false })
        .limit(12);
      moments = await decorate((mrows ?? []) as unknown as FeedRow[], context.userId);
    }

    return {
      people: rows.map((p) => ({
        id: p.id,
        username: p.username,
        displayName: p.display_name,
        avatarUrl: p.avatar_url ? (avatars[p.avatar_url] ?? null) : null,
        followerCount: p.follower_count,
        momentCount: p.moment_count,
      })),
      moments,
    };
  });

export const listNotifications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rows } = await context.supabase
      .from("notifications")
      .select("id, type, created_at, read_at, actor_id, moment_id")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    const list = rows ?? [];
    const actorIds = [...new Set(list.map((n) => n.actor_id).filter(Boolean))] as string[];
    const { data: actors } = actorIds.length
      ? await context.supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .in("id", actorIds)
      : { data: [] };
    const avatars = await signAvatars((actors ?? []).map((a) => a.avatar_url));
    const byId = new Map((actors ?? []).map((a) => [a.id, a]));
    return {
      notifications: list.map((n) => {
        const actor = n.actor_id ? byId.get(n.actor_id) : undefined;
        return {
          id: n.id,
          type: n.type,
          createdAt: n.created_at,
          read: !!n.read_at,
          momentId: n.moment_id,
          actor: actor
            ? {
                username: actor.username,
                displayName: actor.display_name,
                avatarUrl: actor.avatar_url ? (avatars[actor.avatar_url] ?? null) : null,
              }
            : null,
        };
      }),
    };
  });

export const markNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", context.userId)
      .is("read_at", null);
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Safety                                                              */
/* ------------------------------------------------------------------ */

export const submitReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { targetType: string; targetId: string; category: string; details?: string }) => ({
    targetType: z.enum(["user", "moment", "comment"]).parse(d.targetType),
    targetId: z.string().uuid().parse(d.targetId),
    category: z
      .enum([
        "harassment",
        "bullying",
        "hate",
        "sexual",
        "violence",
        "dangerous",
        "spam",
        "impersonation",
        "illegal",
        "self_harm",
        "other",
      ])
      .parse(d.category),
    details: z.string().trim().max(500).optional().parse(d.details),
  }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("reports").insert({
      reporter_id: context.userId,
      target_type: data.targetType,
      target_id: data.targetId,
      category: data.category,
      details: data.details ?? null,
    });
    if (error) throw new Error(error.message);
    if (data.targetType === "moment") {
      const sb = await admin();
      await sb.from("moments").update({ moderation_state: "flagged" }).eq("id", data.targetId);
    }
    await track(context.userId, "report_submitted", { type: data.targetType });
    return { ok: true };
  });

export const toggleBlock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => ({ userId: z.string().uuid().parse(d.userId) }))
  .handler(async ({ data, context }) => {
    if (data.userId === context.userId) throw new Error("You cannot block yourself.");
    const { data: existing } = await context.supabase
      .from("blocks")
      .select("id")
      .eq("blocker_id", context.userId)
      .eq("blocked_id", data.userId)
      .maybeSingle();
    if (existing) {
      await context.supabase.from("blocks").delete().eq("id", existing.id);
      return { blocked: false };
    }
    const { error } = await context.supabase
      .from("blocks")
      .insert({ blocker_id: context.userId, blocked_id: data.userId });
    if (error) throw new Error(error.message);
    // Blocking also severs both follow directions.
    const sb = await admin();
    await sb
      .from("follows")
      .delete()
      .or(
        `and(follower_id.eq.${context.userId},following_id.eq.${data.userId}),and(follower_id.eq.${data.userId},following_id.eq.${context.userId})`,
      );
    await track(context.userId, "user_blocked");
    return { blocked: true };
  });

export const listBlocked = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rows } = await context.supabase
      .from("blocks")
      .select("blocked_id")
      .eq("blocker_id", context.userId);
    const ids = (rows ?? []).map((r) => r.blocked_id);
    if (!ids.length) return { blocked: [] };
    const sb = await admin();
    const { data: people } = await sb
      .from("profiles")
      .select("id, username, display_name")
      .in("id", ids);
    return {
      blocked: (people ?? []).map((p) => ({
        id: p.id,
        username: p.username,
        displayName: p.display_name,
      })),
    };
  });

/* ------------------------------------------------------------------ */
/* Account lifecycle                                                   */
/* ------------------------------------------------------------------ */

export const exportMyData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = await admin();
    const [profile, moments, comments, follows, likes] = await Promise.all([
      sb.from("profiles").select("*").eq("id", context.userId).maybeSingle(),
      sb.from("moments").select("id, caption, created_at, view_count, like_count").eq("author_id", context.userId),
      sb.from("comments").select("id, body, created_at").eq("author_id", context.userId),
      sb.from("follows").select("following_id, created_at").eq("follower_id", context.userId),
      sb.from("likes").select("moment_id, created_at").eq("user_id", context.userId),
    ]);
    return {
      exportedAt: new Date().toISOString(),
      profile: profile.data,
      moments: moments.data ?? [],
      comments: comments.data ?? [],
      following: follows.data ?? [],
      likes: likes.data ?? [],
    };
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { confirmUsername: string }) => ({
    confirmUsername: z.string().trim().min(1).parse(d.confirmUsername),
  }))
  .handler(async ({ data, context }) => {
    const sb = await admin();
    const { data: profile } = await sb
      .from("profiles")
      .select("username")
      .eq("id", context.userId)
      .maybeSingle();
    if (!profile || profile.username.toLowerCase() !== data.confirmUsername.trim().toLowerCase()) {
      throw new Error("Username confirmation did not match.");
    }

    // Remove stored media, then the account itself (cascades to all records).
    const { data: files } = await sb.storage.from("moments").list(context.userId, { limit: 1000 });
    for (const folder of files ?? []) {
      const { data: inner } = await sb.storage
        .from("moments")
        .list(`${context.userId}/${folder.name}`, { limit: 1000 });
      const paths = (inner ?? []).map((f) => `${context.userId}/${folder.name}/${f.name}`);
      if (paths.length) await sb.storage.from("moments").remove(paths);
    }
    await track(context.userId, "account_deleted");
    const { error } = await sb.auth.admin.deleteUser(context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* 3D avatar                                                           */
/* ------------------------------------------------------------------ */

export const saveAvatar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { dataUrl: string }) => ({
    dataUrl: z.string().min(32).max(12_000_000).startsWith("data:image/").parse(d.dataUrl),
  }))
  .handler(async ({ data, context }) => {
    const base64 = data.dataUrl.slice(data.dataUrl.indexOf(",") + 1);
    const binary = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    if (binary.byteLength > 8 * 1024 * 1024) throw new Error("Avatar image is too large.");

    const sb = await admin();
    const path = `${context.userId}/avatar-${Date.now()}.png`;
    const { error: upErr } = await sb.storage
      .from("avatars")
      .upload(path, binary, { contentType: "image/png", upsert: true });
    if (upErr) throw new Error(upErr.message);

    const { error } = await sb
      .from("profiles")
      .update({ avatar_url: path } as never)
      .eq("id", context.userId);
    if (error) throw new Error(error.message);

    const signed = await signAvatars([path]);
    await track(context.userId, "avatar_created");
    return { path, url: signed[path] ?? null };
  });

export const saveProfilePhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { dataUrl: string }) => ({
    dataUrl: z.string().min(32).max(12_000_000).regex(/^data:image\/(jpeg|png|webp);base64,/).parse(d.dataUrl),
  }))
  .handler(async ({ data, context }) => {
    const header = data.dataUrl.slice(0, data.dataUrl.indexOf(","));
    const contentType = header.includes("image/png")
      ? "image/png"
      : header.includes("image/webp")
        ? "image/webp"
        : "image/jpeg";
    const extension = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
    const base64 = data.dataUrl.slice(data.dataUrl.indexOf(",") + 1);
    const binary = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    if (binary.byteLength > 8 * 1024 * 1024) throw new Error("Profile photo is too large.");

    const sb = await admin();
    const path = `${context.userId}/photo-${Date.now()}.${extension}`;
    const { error: uploadError } = await sb.storage
      .from("avatars")
      .upload(path, binary, { contentType, upsert: false });
    if (uploadError) throw new Error(uploadError.message);

    const { error } = await sb
      .from("profiles")
      .update({ personal_photo_url: path, profile_image_type: "photo" })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);

    const signed = await signAvatars([path]);
    await track(context.userId, "profile_photo_updated");
    return { path, url: signed[path] ?? null };
  });

/* ------------------------------------------------------------------ */
/* Activity history                                                    */
/* ------------------------------------------------------------------ */

export const listMyComments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("comments")
      .select("id, body, created_at, moment_id")
      .eq("author_id", context.userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(50);
    return { comments: data ?? [] };
  });

/* ------------------------------------------------------------------ */
/* Direct messages — requests first when you aren't mutual follows     */
/* ------------------------------------------------------------------ */

const PENDING_MESSAGE_LIMIT = 3;

function pair(a: string, b: string) {
  return a < b ? { user_a: a, user_b: b } : { user_a: b, user_b: a };
}

async function areMutualFollows(a: string, b: string) {
  const sb = await admin();
  const { data } = await sb
    .from("follows")
    .select("follower_id, following_id")
    .or(
      `and(follower_id.eq.${a},following_id.eq.${b}),and(follower_id.eq.${b},following_id.eq.${a})`,
    );
  const rows = data ?? [];
  return (
    rows.some((r) => r.follower_id === a && r.following_id === b) &&
    rows.some((r) => r.follower_id === b && r.following_id === a)
  );
}

async function blockedBetween(a: string, b: string) {
  const sb = await admin();
  const { data } = await sb
    .from("blocks")
    .select("id")
    .or(
      `and(blocker_id.eq.${a},blocked_id.eq.${b}),and(blocker_id.eq.${b},blocked_id.eq.${a})`,
    )
    .limit(1);
  return (data ?? []).length > 0;
}

/** Opens (or reuses) a conversation and sends the first/next message. */
export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { toUserId?: string; conversationId?: string; body: string }) => ({
    toUserId: d.toUserId ? z.string().uuid().parse(d.toUserId) : undefined,
    conversationId: d.conversationId ? z.string().uuid().parse(d.conversationId) : undefined,
    body: z.string().trim().min(1, "Write something first.").max(2000).parse(d.body),
  }))
  .handler(async ({ data, context }) => {
    const me = context.userId;
    const sb = await admin();

    let convo: {
      id: string;
      user_a: string;
      user_b: string;
      requester_id: string;
      status: string;
    } | null = null;

    if (data.conversationId) {
      const { data: row } = await sb
        .from("conversations")
        .select("id, user_a, user_b, requester_id, status")
        .eq("id", data.conversationId)
        .maybeSingle();
      if (!row || (row.user_a !== me && row.user_b !== me)) throw new Error("Chat not found.");
      convo = row;
    } else {
      if (!data.toUserId) throw new Error("Pick someone to message.");
      if (data.toUserId === me) throw new Error("You can't message yourself.");
      const { user_a, user_b } = pair(me, data.toUserId);
      const { data: row } = await sb
        .from("conversations")
        .select("id, user_a, user_b, requester_id, status")
        .eq("user_a", user_a)
        .eq("user_b", user_b)
        .maybeSingle();
      convo = row ?? null;
    }

    const other = convo
      ? convo.user_a === me
        ? convo.user_b
        : convo.user_a
      : (data.toUserId as string);

    if (await blockedBetween(me, other)) throw new Error("You can't message this person.");

    if (!convo) {
      const { data: target } = await sb
        .from("profiles")
        .select("allow_messages, banned_at, deleted_at")
        .eq("id", other)
        .maybeSingle();
      if (!target || target.banned_at || target.deleted_at) throw new Error("Person not found.");
      const mutual = await areMutualFollows(me, other);
      const setting = (target as { allow_messages?: string }).allow_messages ?? "everyone";
      if (setting === "nobody") throw new Error("This person isn't accepting messages.");
      if (setting === "followers") {
        const { data: follows } = await sb
          .from("follows")
          .select("id")
          .eq("follower_id", other)
          .eq("following_id", me)
          .maybeSingle();
        if (!follows) throw new Error("This person only accepts messages from people they follow.");
      }
      const { user_a, user_b } = pair(me, other);
      const { data: created, error } = await sb
        .from("conversations")
        .insert({
          user_a,
          user_b,
          requester_id: me,
          status: mutual ? "accepted" : "pending",
        })
        .select("id, user_a, user_b, requester_id, status")
        .single();
      if (error || !created) throw new Error(error?.message ?? "Couldn't start the chat.");
      convo = created;
    }

    if (convo.status === "rejected") throw new Error("This person declined your message request.");

    if (convo.status === "pending") {
      if (convo.requester_id !== me) {
        throw new Error("Accept the request before replying.");
      }
      const { count } = await sb
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", convo.id)
        .eq("sender_id", me);
      if ((count ?? 0) >= PENDING_MESSAGE_LIMIT) {
        throw new Error("Wait until your request is accepted before sending more.");
      }
    }

    const { data: msg, error: msgErr } = await sb
      .from("messages")
      .insert({ conversation_id: convo.id, sender_id: me, body: data.body })
      .select("id, body, created_at, sender_id")
      .single();
    if (msgErr) throw new Error(msgErr.message);

    await track(me, "message_sent", { pending: convo.status === "pending" });
    return { conversationId: convo.id, status: convo.status, message: msg };
  });

export const listConversations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const me = context.userId;
    const sb = await admin();
    const { data: rows } = await sb
      .from("conversations")
      .select("id, user_a, user_b, requester_id, status, last_message_at")
      .or(`user_a.eq.${me},user_b.eq.${me}`)
      .order("last_message_at", { ascending: false })
      .limit(100);

    const list = rows ?? [];
    if (list.length === 0) return { chats: [], requests: [] };

    const otherIds = list.map((c) => (c.user_a === me ? c.user_b : c.user_a));
    const { data: people } = await sb
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", otherIds);
    const avatars = await signAvatars((people ?? []).map((p) => p.avatar_url));
    const byId = new Map((people ?? []).map((p) => [p.id, p]));

    const { data: lastMsgs } = await sb
      .from("messages")
      .select("id, conversation_id, body, sender_id, created_at, read_at")
      .in("conversation_id", list.map((c) => c.id))
      .order("created_at", { ascending: false })
      .limit(500);

    const lastByConvo = new Map<string, { body: string; created_at: string; sender_id: string }>();
    const unreadByConvo = new Map<string, number>();
    for (const m of lastMsgs ?? []) {
      if (!lastByConvo.has(m.conversation_id)) lastByConvo.set(m.conversation_id, m);
      if (m.sender_id !== me && !m.read_at) {
        unreadByConvo.set(m.conversation_id, (unreadByConvo.get(m.conversation_id) ?? 0) + 1);
      }
    }

    const decorate = (c: (typeof list)[number]) => {
      const otherId = c.user_a === me ? c.user_b : c.user_a;
      const p = byId.get(otherId);
      const last = lastByConvo.get(c.id) ?? null;
      return {
        id: c.id,
        status: c.status,
        isRequester: c.requester_id === me,
        lastMessageAt: c.last_message_at,
        unread: unreadByConvo.get(c.id) ?? 0,
        lastMessage: last ? { body: last.body, createdAt: last.created_at } : null,
        person: {
          id: otherId,
          username: p?.username ?? "someone",
          displayName: p?.display_name ?? p?.username ?? "Someone",
          avatarUrl: p?.avatar_url ? (avatars[p.avatar_url] ?? p.avatar_url) : null,
        },
      };
    };

    const decorated = list.map(decorate);
    return {
      chats: decorated.filter((c) => c.status === "accepted"),
      requests: decorated.filter((c) => c.status === "pending" && !c.isRequester),
      sent: decorated.filter((c) => c.status === "pending" && c.isRequester),
    };
  });

export const getConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { conversationId: string }) => ({
    conversationId: z.string().uuid().parse(d.conversationId),
  }))
  .handler(async ({ data, context }) => {
    const me = context.userId;
    const sb = await admin();
    const { data: convo } = await sb
      .from("conversations")
      .select("id, user_a, user_b, requester_id, status")
      .eq("id", data.conversationId)
      .maybeSingle();
    if (!convo || (convo.user_a !== me && convo.user_b !== me)) throw new Error("Chat not found.");

    const otherId = convo.user_a === me ? convo.user_b : convo.user_a;
    const { data: p } = await sb
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .eq("id", otherId)
      .maybeSingle();
    const avatars = await signAvatars([p?.avatar_url ?? null]);

    const { data: msgs } = await sb
      .from("messages")
      .select("id, body, sender_id, created_at")
      .eq("conversation_id", convo.id)
      .order("created_at", { ascending: true })
      .limit(300);

    await sb
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", convo.id)
      .neq("sender_id", me)
      .is("read_at", null);

    return {
      id: convo.id,
      status: convo.status,
      isRequester: convo.requester_id === me,
      person: {
        id: otherId,
        username: p?.username ?? "someone",
        displayName: p?.display_name ?? p?.username ?? "Someone",
        avatarUrl: p?.avatar_url ? (avatars[p.avatar_url] ?? p.avatar_url) : null,
      },
      messages: (msgs ?? []).map((m) => ({
        id: m.id,
        body: m.body,
        createdAt: m.created_at,
        mine: m.sender_id === me,
      })),
    };
  });

export const respondToMessageRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { conversationId: string; accept: boolean }) => ({
    conversationId: z.string().uuid().parse(d.conversationId),
    accept: z.boolean().parse(d.accept),
  }))
  .handler(async ({ data, context }) => {
    const me = context.userId;
    const sb = await admin();
    const { data: convo } = await sb
      .from("conversations")
      .select("id, user_a, user_b, requester_id, status")
      .eq("id", data.conversationId)
      .maybeSingle();
    if (!convo || (convo.user_a !== me && convo.user_b !== me)) throw new Error("Chat not found.");
    if (convo.requester_id === me) throw new Error("You started this chat.");
    const { error } = await sb
      .from("conversations")
      .update({ status: data.accept ? "accepted" : "rejected" })
      .eq("id", convo.id);
    if (error) throw new Error(error.message);
    await track(me, data.accept ? "message_request_accepted" : "message_request_rejected");
    return { ok: true, status: data.accept ? "accepted" : "rejected" };
  });
