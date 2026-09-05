import { createFileRoute } from "@tanstack/react-router";

/**
 * Streams a Reelzy 3D-style avatar portrait from the Lovable AI Gateway.
 * Accepts an optional selfie (data URL) captured in the Reelzy camera.
 */
export const Route = createFileRoute("/api/generate-avatar")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as {
          prompt?: string;
          selfie?: string | null;
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

        const content = selfie
          ? [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: selfie } },
            ]
          : prompt;

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-pro-image",
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
