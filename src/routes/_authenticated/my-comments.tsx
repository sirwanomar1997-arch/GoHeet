import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { listMyComments } from "@/lib/reelzy.functions";
import { AppShell } from "@/components/reelzy/nav";
import { EmptyState, LoadingRail } from "@/components/reelzy/empty-state";
import { timeAgo } from "@/components/reelzy/format";

export const Route = createFileRoute("/_authenticated/my-comments")({
  component: MyCommentsPage,
  head: () => ({
    meta: [
      { title: "Comments you wrote · GoHeet" },
      { name: "description", content: "Every comment you have written on GoHeet, newest first." },
      { property: "og:title", content: "Comments you wrote · GoHeet" },
      {
        property: "og:description",
        content: "Every comment you have written on GoHeet, newest first.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function MyCommentsPage() {
  const fetchComments = useServerFn(listMyComments);
  const { data, isLoading } = useQuery({
    queryKey: ["my-comments"],
    queryFn: () => fetchComments({ data: undefined as never }),
  });
  const comments = data?.comments ?? [];

  return (
    <AppShell>
      <header className="sticky top-0 z-30 bg-background/90 px-4 py-4 backdrop-blur-xl">
        <Link
          to="/settings"
          className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground"
        >
          <ChevronLeft className="size-3.5" /> Settings
        </Link>
        <h1 className="font-display text-2xl font-extrabold tracking-[-0.04em]">
          Comments you wrote
        </h1>
      </header>

      {isLoading ? (
        <LoadingRail />
      ) : comments.length === 0 ? (
        <EmptyState title="No comments yet." line="Comments you write show up here." />
      ) : (
        <ul className="space-y-2 px-4 pb-6">
          {comments.map((c) => (
            <li key={c.id} className="rounded-2xl border border-border bg-surface p-3">
              <p className="text-sm">{c.body}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{timeAgo(c.created_at)}</p>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
