import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Undo2, ChevronLeft } from "lucide-react";
import { listTrash, restoreMoment, deleteMomentForever, emptyTrash } from "@/lib/reelzy.functions";
import { AppShell } from "@/components/reelzy/nav";
import { EmptyState, LoadingRail } from "@/components/reelzy/empty-state";

export const Route = createFileRoute("/_authenticated/trash")({
  component: TrashPage,
  head: () => ({
    meta: [
      { title: "Trash · GoHeet" },
      {
        name: "description",
        content: "Deleted Reelz stay here for 30 days. Restore a moment or erase it for good.",
      },
      { property: "og:title", content: "Trash · GoHeet" },
      {
        property: "og:description",
        content: "Deleted Reelz stay here for 30 days before they disappear for good.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function TrashPage() {
  const fetchTrash = useServerFn(listTrash);
  const restore = useServerFn(restoreMoment);
  const erase = useServerFn(deleteMomentForever);
  const wipe = useServerFn(emptyTrash);
  const [busy, setBusy] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["trash"],
    queryFn: () => fetchTrash({}),
  });

  const items = data?.items ?? [];

  async function run(id: string, fn: () => Promise<unknown>, done: string) {
    setBusy(id);
    try {
      await fn();
      toast.success(done);
      await refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <AppShell>
      <header className="sticky top-0 z-30 bg-background/90 px-4 py-4 backdrop-blur-xl">
        <Link to="/settings" className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <ChevronLeft className="size-3.5" /> Settings
        </Link>
        <h1 className="font-display text-2xl font-extrabold tracking-[-0.04em]">Trash</h1>
        <p className="text-sm text-muted-foreground">
          Deleted Reelz wait here for 30 days, then they are erased automatically.
        </p>
      </header>

      {isLoading ? (
        <LoadingRail />
      ) : items.length === 0 ? (
        <EmptyState
          title="Trash is empty."
          line="Anything you delete lands here for 30 days, just in case."
          action={
            <Link to="/settings" className="tap-target inline-flex rounded-full border border-border px-6 text-sm">
              Back to settings
            </Link>
          }
        />
      ) : (
        <div className="space-y-3 px-4 pb-28">
          <button
            type="button"
            className="tap-target w-full rounded-2xl border border-border px-4 text-sm font-medium text-rose-400"
            disabled={busy === "all"}
            onClick={() => {
              if (!window.confirm("Erase everything in the trash? This cannot be undone.")) return;
              void run("all", () => wipe({}), "Trash emptied.");
            }}
          >
            Empty trash now
          </button>

          {items.map((m) => (
            <article key={m.id} className="flex gap-3 rounded-3xl border border-border bg-card/60 p-3">
              <div className="size-20 shrink-0 overflow-hidden rounded-2xl bg-muted">
                {m.thumbnailUrl ? (
                  <img src={m.thumbnailUrl} alt={m.caption ?? "Deleted moment"} className="size-full object-cover" />
                ) : m.mediaUrl && m.kind === "photo" ? (
                  <img src={m.mediaUrl} alt={m.caption ?? "Deleted moment"} className="size-full object-cover" />
                ) : m.mediaUrl ? (
                  <video src={m.mediaUrl} muted playsInline className="size-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{m.caption || "Untitled moment"}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {m.daysLeft === 0 ? "Erasing today" : `${m.daysLeft} day${m.daysLeft === 1 ? "" : "s"} left`}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    disabled={busy === m.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium"
                    onClick={() => void run(m.id, () => restore({ data: { momentId: m.id } }), "Moment restored.")}
                  >
                    <Undo2 className="size-3.5 text-emerald-400" /> Restore
                  </button>
                  <button
                    type="button"
                    disabled={busy === m.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-rose-400"
                    onClick={() => {
                      if (!window.confirm("Delete this moment for good?")) return;
                      void run(m.id, () => erase({ data: { momentId: m.id } }), "Deleted for good.");
                    }}
                  >
                    <Trash2 className="size-3.5" /> Delete forever
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
