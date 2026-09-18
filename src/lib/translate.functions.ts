import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Interface auto-translation.
 *
 * The app ships English source text. Whenever someone uses GoHeet in another
 * language, the visible interface strings are translated once, stored in the
 * shared `ui_translations` table, and reused for everyone after that — so each
 * sentence is only ever translated a single time per language.
 *
 * People's own content (posts, names, messages) is never sent here.
 */
const schema = z.object({
  locale: z
    .string()
    .trim()
    .min(2)
    .max(8)
    .regex(/^[a-zA-Z-]+$/),
  texts: z.array(z.string().trim().min(1).max(300)).min(1).max(80),
});

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  sv: "Swedish",
  ar: "Arabic",
  es: "Spanish",
  fr: "French",
  de: "German",
  tr: "Turkish",
  ja: "Japanese",
  zh: "Simplified Chinese",
  ko: "Korean",
  hi: "Hindi",
  bn: "Bengali",
  ur: "Urdu",
  fa: "Persian",
  he: "Hebrew",
  ku: "Kurdish (Sorani)",
  pt: "Portuguese",
  it: "Italian",
  ru: "Russian",
  uk: "Ukrainian",
  pl: "Polish",
  nl: "Dutch",
  da: "Danish",
  no: "Norwegian",
  fi: "Finnish",
  cs: "Czech",
  ro: "Romanian",
  el: "Greek",
  hu: "Hungarian",
  id: "Indonesian",
  ms: "Malay",
  vi: "Vietnamese",
  th: "Thai",
  tl: "Filipino",
  sw: "Swahili",
  so: "Somali",
  am: "Amharic",
  af: "Afrikaans",
};

function hash(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
    h2 = Math.imul(h2 + c + 1, 2246822519) >>> 0;
  }
  return h1.toString(36) + h2.toString(36);
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (
          c: string,
          v: string,
        ) => {
          in: (c: string, v: string[]) => Promise<{ data: { source: string; translated: string }[] | null }>;
          limit: (n: number) => Promise<{ data: { source: string; translated: string }[] | null }>;
        };
      };
      upsert: (rows: unknown[], opts: Record<string, unknown>) => Promise<{ error: unknown }>;
    };
  };
}

/**
 * The entire known dictionary for one language, in a single request.
 *
 * Switching language then only has to read what is already on the device, so
 * the whole interface changes in the same instant instead of trickling in.
 */
export const uiBundle = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        locale: z
          .string()
          .trim()
          .min(2)
          .max(8)
          .regex(/^[a-zA-Z-]+$/),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<{ translations: Record<string, string> }> => {
    const locale = data.locale.toLowerCase().split("-")[0] as string;
    if (!locale || locale === "en" || !LANGUAGE_NAMES[locale]) return { translations: {} };
    const sb = await admin();
    const { data: rows } = await sb.from("ui_translations").select("source, translated").eq("locale", locale).limit(5000);
    const translations: Record<string, string> = {};
    for (const row of rows ?? []) translations[row.source] = row.translated;
    return { translations };
  });


async function machineTranslate(language: string, texts: string[]): Promise<Record<string, string>> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return {};

  const prompt = `Translate these short mobile app interface strings from English into ${language}.

Rules:
- Keep the meaning natural and short — this is UI text on a phone.
- Never translate the brand words: GoHeet, Heet, Heets, Reelz.
- Keep placeholders like {name}, {username}, @, numbers and emoji exactly as they are.
- Keep the same capitalisation style and punctuation.
- Return JSON only: {"items":[{"s":"<original>","t":"<translation>"}]} with one entry per input string, in the same order.

Strings:
${JSON.stringify(texts)}`;

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.8-flash",
        messages: [
          { role: "system", content: "You are a precise software localisation engine." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      console.error("[ui-translate] gateway", res.status, await res.text());
      return {};
    }
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content ?? "";
    const parsed = JSON.parse(raw.replace(/^```json|```$/g, "").trim()) as {
      items?: { s?: string; t?: string }[];
    };
    const out: Record<string, string> = {};
    for (const item of parsed.items ?? []) {
      if (typeof item?.s === "string" && typeof item?.t === "string" && item.t.trim()) {
        out[item.s] = item.t.trim();
      }
    }
    return out;
  } catch (err) {
    console.error("[ui-translate]", err);
    return {};
  }
}

export const translateUi = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }): Promise<{ translations: Record<string, string> }> => {
    const locale = data.locale.toLowerCase().split("-")[0] as string;
    const language = LANGUAGE_NAMES[locale];
    if (!language || locale === "en") return { translations: {} };

    const unique = Array.from(new Set(data.texts));
    const byHash = new Map(unique.map((t) => [hash(t), t]));

    const sb = await admin();
    const { data: cached } = await sb
      .from("ui_translations")
      .select("source, translated")
      .eq("locale", locale)
      .in("source_hash", Array.from(byHash.keys()));

    const translations: Record<string, string> = {};
    for (const row of cached ?? []) translations[row.source] = row.translated;

    let missing = unique.filter((t) => !(t in translations));
    if (missing.length === 0) return { translations };

    // Never translate people's usernames or nicknames, in any language.
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const lowered = missing.map((t) => t.toLowerCase().replace(/^@/, ""));
      const { data: names } = await (supabaseAdmin as any)
        .from("profiles")
        .select("username, display_name")
        .or(`username.in.(${lowered.map((n) => JSON.stringify(n)).join(",")}),display_name.in.(${lowered.map((n) => JSON.stringify(n)).join(",")})`)
        .limit(200);
      if (names?.length) {
        const blocked = new Set<string>();
        for (const row of names as { username?: string; display_name?: string }[]) {
          if (row.username) blocked.add(row.username.toLowerCase());
          if (row.display_name) blocked.add(row.display_name.toLowerCase());
        }
        missing = missing.filter((t) => !blocked.has(t.toLowerCase().replace(/^@/, "")));
      }
    } catch {
      /* name check unavailable — continue */
    }
    if (missing.length === 0) return { translations };

    const fresh = await machineTranslate(language, missing);
    const rows = Object.entries(fresh).map(([source, translated]) => ({
      locale,
      source_hash: hash(source),
      source,
      translated,
    }));

    if (rows.length) {
      const { error } = await sb.from("ui_translations").upsert(rows, {
        onConflict: "locale,source_hash",
        ignoreDuplicates: true,
      });
      if (error) console.error("[ui-translate] cache write", error);
    }

    return { translations: { ...translations, ...fresh } };
  });

/**
 * Translate one private message into the reader's own language.
 *
 * Private content is never cached or shared — the translation is produced on
 * demand and returned only to the person who asked for it.
 */
export const translateMessage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        text: z.string().trim().min(1).max(2000),
        locale: z.string().trim().min(2).max(8).regex(/^[a-zA-Z-]+$/),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<{ text: string }> => {
    const locale = data.locale.toLowerCase().split("-")[0] as string;
    const language = LANGUAGE_NAMES[locale] ?? "English";
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { text: data.text };
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3.8-flash",
          messages: [
            {
              role: "system",
              content:
                "You translate chat messages. Reply with the translation only — no quotes, no notes. Keep names, @handles, emoji and numbers exactly as written.",
            },
            { role: "user", content: `Translate into ${language}:\n\n${data.text}` },
          ],
        }),
      });
      if (!res.ok) return { text: data.text };
      const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const out = json.choices?.[0]?.message?.content?.trim();
      return { text: out || data.text };
    } catch {
      return { text: data.text };
    }
  });
