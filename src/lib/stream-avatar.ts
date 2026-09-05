import { createParser } from "eventsource-parser";
import { flushSync } from "react-dom";
import { supabase } from "@/integrations/supabase/client";

async function avatarHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Sign in to create your avatar");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

type Payload = {
  type?: string;
  b64_json?: string;
  error?: { message?: string };
};

/**
 * Streams avatar frames from /api/generate-avatar.
 * onFrame receives a data URL per frame; isFinal flips on the completed event.
 */
export async function streamAvatar(
  prompt: string,
  selfie: string | null,
  onFrame: (dataUrl: string, isFinal: boolean) => void,
): Promise<void> {
  const res = await fetch("/api/generate-avatar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, selfie }),
  });
  if (!res.ok || !res.body) {
    throw new Error(`Avatar generation failed: ${res.status} ${await res.text().catch(() => "")}`);
  }

  let sawAnyEvent = false;
  let sawCompleted = false;
  let streamError: string | undefined;

  const parser = createParser({
    onEvent(event) {
      let payload: Payload | undefined;
      try {
        payload = JSON.parse(event.data) as Payload;
      } catch {
        /* keep generic message */
      }
      if (event.event === "error" || payload?.type === "error") {
        sawAnyEvent = true;
        streamError = payload?.error?.message ?? "Avatar generation failed";
        return;
      }
      if (
        event.event !== "image_generation.partial_image" &&
        event.event !== "image_generation.completed"
      ) {
        return;
      }
      if (!payload?.b64_json) return;
      sawAnyEvent = true;
      const isFinal = event.event === "image_generation.completed";
      const b64 = payload.b64_json;
      flushSync(() => onFrame(`data:image/png;base64,${b64}`, isFinal));
      if (isFinal) sawCompleted = true;
    },
  });

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      parser.feed(value);
    }
  } finally {
    reader.cancel().catch(() => {});
  }

  if (streamError) throw new Error(streamError);

  if (!sawAnyEvent) {
    const replay = await fetch("/api/generate-avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, selfie, stream: false }),
    });
    if (!replay.ok) {
      throw new Error(`Avatar generation failed: ${replay.status}`);
    }
    const json = (await replay.json()) as { data?: { b64_json?: string }[] };
    const b64 = json.data?.[0]?.b64_json;
    if (!b64) throw new Error("Avatar generation returned no image");
    onFrame(`data:image/png;base64,${b64}`, true);
    return;
  }

  if (!sawCompleted) throw new Error("Avatar stream ended before it finished");
}
