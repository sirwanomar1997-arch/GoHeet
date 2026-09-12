import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import { listBlocked, toggleBlock } from "@/lib/reelzy.functions";
import { AppShell } from "@/components/reelzy/nav";
import { EmptyState, LoadingRail } from "@/components/reelzy/empty-state";

export const Route = createFileRoute("/_authenticated/blocked")({
  component: BlockedPage,
  head: () => ({
    meta: [
      { title: "Blocked people · GoHeet" },
      { name: "description", content: "People you have blocked on GoHeet. Unblock anyone here." },
      { property: "og:title", content: "Blocked people · GoHeet" },
      {
        property: "og:description",
        content: "People you have blocked on GoHeet. Unblock anyone here.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function BlockedPage() {
  const fetchBlocked = useServerFn(listBlocked);
  const unblock = useServerFn(toggleBlock);
  const [busy, setBusy] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["blocked"],
    queryFn: () => fetchBlocked({ data: undefined as never }),
  });
  const people = data?.blocked ?? [];

  return (
    <AppShell>
      <header className="sticky top-0 z-30 bg-background/90 px-4 py-4 backdrop-blur-xl">
        <Link
          to="/settings"
          className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground"
        >
          <ChevronLeft className="size-3.5" /> Settings
        </Link>
        <h1 className="font-display text-2xl font-extrabold tracking-[-0.04em]">Blocked people</h1>
      </header>

      {isLoading ? (
        <LoadingRail />
      ) : people.length === 0 ? (
        <EmptyState title="Nobody blocked." line="People you block will be listed here." />
      ) : (
        <ul className="space-y-2 px-4 pb-6">
          {people.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between rounded-2xl border border-border bg-surface p-3"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">
                  {b.displayName || `@${b.username}`}
                </span>
                <span className="block truncate text-xs text-muted-foreground">@{b.username}</span>
              </span>
              <button
                type="button"
                disabled={busy === b.id}
                className="shrink-0 rounded-full border border-border px-4 py-1.5 text-xs font-semibold disabled:opacity-50"
                onClick={async () => {
                  setBusy(b.id);
                  try {
                    await unblock({ data: { userId: b.id } });
                    toast.success("Unblocked.");
                    await refetch();
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Something went wrong.");
                  } finally {
                    setBusy(null);
                  }
                }}
              >
                Unblock
              </button>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
