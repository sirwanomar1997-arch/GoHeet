import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Trash2, Send, Camera } from "lucide-react";
import { AppShell } from "@/components/reelzy/nav";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/reelzy/empty-state";
import { listSavedClips, deleteClip, SHARE_LATER_LIMIT, type SavedClip } from "@/lib/share-later";
import { publishMoment, startCapture } from "@/lib/reelzy.functions";
import { supabase } from "@/integrations/supabase/client";
import { filterCss } from "@/components/reelzy/creative";

export const Route = createFileRoute("/_authenticated/share-later")({
  component: ShareLaterPage,
  head: () => ({
    meta: [
      { title: "Share later · Reelzy" },
      {
        name: "description",
        content: "Hold up to three captured moments on your device and share them when you're ready.",
      },
      { property: "og:title", content: "Share later · Reelzy" },
      {
        property: "og:description",
        content: "A three-slot holding area for moments you captured now and want to share soon.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ShareLaterPage() {
  const navigate = useNavigate();
  const [clips, setClips] = useState<SavedClip[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const openSession = useServerFn(startCapture);
  const publish = useServerFn(publishMoment);

  useEffect(() => {
    void listSavedClips().then(setClips);
  }, []);

  const urls = useMemo(
    () => new Map(clips.map((c) => [c.id, URL.createObjectURL(c.blob)])),
    [clips],
  );
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls]);

  async function remove(id: string) {
    await deleteClip(id);
    setClips(await listSavedClips());
    toast("Removed.");
  }

  async function shareNow(clip: SavedClip) {
    setBusy(clip.id);
    try {
      const session = await openSession({ data: { deviceKind: "web" } });
      const ext = clip.kind === "photo" ? "jpg" : clip.blob.type.includes("mp4") ? "mp4" : "webm";
      const mediaPath = `${session.storagePrefix}/moment.${ext}`;
      const up = await supabase.storage
        .from("moments")
        .upload(mediaPath, clip.blob, { contentType: clip.blob.type, upsert: true });
      if (up.error) throw new Error(up.error.message);

      let thumbnailPath: string | undefined;
      if (clip.poster) {
        const tp = `${session.storagePrefix}/poster.jpg`;
        const t = await supabase.storage
          .from("moments")
          .upload(tp, clip.poster, { contentType: "image/jpeg", upsert: true });
        if (!t.error) thumbnailPath = tp;
      }

      await publish({
        data: {
          sessionId: session.sessionId,
          mediaPath,
          kind: clip.kind,
          durationMs: clip.durationMs,
          ...(thumbnailPath ? { thumbnailPath } : {}),
          ...(clip.caption ? { caption: clip.caption } : {}),
          ...(clip.place ? { locationLabel: clip.place } : {}),
          ...(clip.styleFilter ? { styleFilter: clip.styleFilter } : {}),
          originalAudioVolume: 1,
        },
      });
      // Sharing empties the slot — this is a waiting room, never a library.
      await deleteClip(clip.id);
      toast.success("Shared. That's a real one.");
      await navigate({ to: "/feed" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't share that moment.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <AppShell>
      <header className="sticky top-0 z-30 bg-background/90 px-4 py-4 backdrop-blur-xl">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-[-0.04em]">Share later</h1>
            <p className="text-sm text-muted-foreground">
              Held on this device for when you're ready. Not an album.
            </p>
          </div>
          <span className="data-figure rounded-full border border-border px-3 py-1 text-xs">
            {clips.length}/{SHARE_LATER_LIMIT}
          </span>
        </div>
      </header>

      {clips.length === 0 ? (
        <EmptyState
          title="Nothing waiting."
          line="Record a moment and hold it here if you can't share it right away."
          action={
            <Link
              to="/camera"
              className="tap-target inline-flex items-center gap-2 rounded-full border border-border px-6 text-sm"
            >
              <Camera className="size-4" />
              Open the camera
            </Link>
          }
        />
      ) : (
        <div className="space-y-4 px-4 pb-8">
          {clips.map((clip) => (
            <article key={clip.id} className="overflow-hidden rounded-3xl border border-border bg-surface">
              <div className="relative aspect-[9/16] max-h-[52svh] bg-black">
                {clip.kind === "video" ? (
                  <video
                    src={urls.get(clip.id)}
                    className="size-full object-contain"
                    style={filterCss(clip.styleFilter) ? { filter: filterCss(clip.styleFilter) } : undefined}
                    controls
                    playsInline
                    loop
                  />
                ) : (
                  <img
                    src={urls.get(clip.id)}
                    alt={clip.caption || "Held moment"}
                    className="size-full object-contain"
                    style={filterCss(clip.styleFilter) ? { filter: filterCss(clip.styleFilter) } : undefined}
                  />
                )}
              </div>
              <div className="space-y-3 p-4">
                {clip.caption ? <p className="text-sm">{clip.caption}</p> : null}
                <div className="flex gap-2">
                  <Button
                    onClick={() => void shareNow(clip)}
                    disabled={busy !== null}
                    className="ember-fill h-12 flex-1 rounded-2xl text-sm font-semibold text-primary-foreground"
                  >
                    <Send className="mr-2 size-4" />
                    {busy === clip.id ? "Sharing…" : "Share now"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => void remove(clip.id)}
                    disabled={busy !== null}
                    aria-label="Delete this moment"
                    className="h-12 rounded-2xl border border-border px-5"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
