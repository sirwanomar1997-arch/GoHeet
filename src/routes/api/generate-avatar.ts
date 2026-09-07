import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// A detailed avatar can take many quick visual choices in one studio session.
const MAX_GENERATIONS_PER_HOUR = 60;

/**
 * Streams a GoHeet 3D-style avatar portrait from the Lovable AI Gateway.
 * Accepts an optional selfie (data URL) captured in the GoHeet camera.
 * Requires a signed-in user; rate limited per user.
 */
export const Route = createFileRoute("/api/generate-avatar")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // --- Auth: require a valid user session ---
        const authHeader = request.headers.get("authorization");
        const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
        if (!token || token.split(".").length !== 3) {
          return new Response("Unauthorized", { status: 401 });
        }
        const supabase = createClient<Database>(
          process.env["SUPABASE_URL"]!,
          process.env["SUPABASE_PUBLISHABLE_KEY"]!,
          {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
          },
        );
        const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
        const userId = claimsData?.claims?.sub;
        if (claimsError || !userId) {
          return new Response("Unauthorized", { status: 401 });
        }

        // --- Per-user rate limit (avatar generation spends paid AI credits) ---
        const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { count } = await supabase
          .from("avatar_generation_logs")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", since);
        if ((count ?? 0) >= MAX_GENERATIONS_PER_HOUR) {
          return new Response("Avatar generation limit reached. Try again later.", { status: 429 });
        }
        await supabase.from("avatar_generation_logs").insert({ user_id: userId });

        const body = (await request.json()) as {
          prompt?: string;
          selfie?: string | null;
          visualReference?: string | null;
          stream?: boolean;
        };
        const prompt = (body.prompt ?? "").slice(0, 1200);
        const stream = body.stream !== false;
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        if (!prompt) return new Response("Missing prompt", { status: 400 });

        const selfie = typeof body.selfie === "string" && body.selfie.startsWith("data:image/")
          ? body.selfie
          : null;
        const visualReference =
          typeof body.visualReference === "string" && body.visualReference.startsWith("data:image/")
            ? body.visualReference
            : null;

        const content = selfie || visualReference
          ? [
              { type: "text", text: prompt },
              ...(selfie ? [{ type: "image_url", image_url: { url: selfie } }] : []),
              ...(visualReference ? [{ type: "image_url", image_url: { url: visualReference } }] : []),
            ]
          : prompt;

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3.1-flash-image",
            messages: [{ role: "user", content }],
            modalities: ["image", "text"],
            ...(stream ? { stream: true } : {}),
          }),
        });

        if (!upstream.ok || !upstream.body) {
          return new Response(await upstream.text(), { status: upstream.status });
        }
        if (!stream) {
          return new Response(upstream.body, {
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(upstream.body, {
          headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
        });
      },
    },
  },
});
