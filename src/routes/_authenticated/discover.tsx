import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { searchGoHeet, toggleFollow } from "@/lib/reelzy.functions";
import { useDemoMode } from "@/lib/use-demo-mode";
import { getDemoSearch } from "@/lib/demo-data";
import { AppShell } from "@/components/reelzy/nav";
import { EmptyState, LoadingRail } from "@/components/reelzy/empty-state";
import { formatCount } from "@/components/reelzy/format";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/discover")({
  component: DiscoverPage,
});

function DiscoverPage() {
  const demo = useDemoMode();
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const search = useServerFn(searchGoHeet);
  const follow = useServerFn(toggleFollow);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["search", term, demo],
    queryFn: () => (demo ? getDemoSearch(term) : search({ data: { q: term } })),
  });

  const followMutation = useMutation({
    mutationFn: (userId: string) => follow({ data: { userId } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["search"] }),
  });

  return (
    <AppShell>
      <header className="sticky top-0 z-30 bg-background/90 px-4 py-3 backdrop-blur-xl">
        <h1 className="font-display text-2xl font-extrabold tracking-[-0.04em]">Find real people</h1>
        <form
          className="relative mt-3"
          onSubmit={(e) => {
            e.preventDefault();
            setTerm(q.trim());
          }}
        >
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onBlur={() => setTerm(q.trim())}
            placeholder="Search names, usernames, captions"
            aria-label="Search GoHeet"
            className="h-12 bg-surface-raised pl-10"
          />
        </form>
      </header>

      {isLoading ? (
        <LoadingRail label="Looking" />
      ) : (
        <div className="px-4 pb-8">
          <h2 className="data-figure mt-2 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            {term ? "People" : "Worth following"}
          </h2>
          <ul className="mt-3 divide-y divide-border">
            {(data?.people ?? []).map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-3">
                <Link to="/u/$username" params={{ username: p.username }} className="shrink-0">
                  <span className="grid size-11 place-items-center overflow-hidden rounded-2xl bg-surface-raised font-display text-sm font-bold uppercase">
                    {p.avatarUrl ? (
                      <img src={p.avatarUrl} alt="" className="size-full object-cover" />
                    ) : (
                      p.username.slice(0, 1)
                    )}
                  </span>
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    to="/u/$username"
                    params={{ username: p.username }}
                    className="block truncate font-semibold"
                  >
                    {p.displayName || p.username}
                  </Link>
                  <p className="data-figure truncate text-[11px] text-muted-foreground">
                    @{p.username} · {formatCount(p.followerCount)} followers ·{" "}
                    {formatCount(p.momentCount)} moments
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => followMutation.mutate(p.id)}
                  className="tap-target rounded-full border border-border px-4 text-xs font-semibold"
                >
                  Follow
                </button>
              </li>
            ))}
          </ul>

          {(data?.people.length ?? 0) === 0 && (data?.moments.length ?? 0) === 0 ? (
            <EmptyState title="No one here yet." line="Try a different name or word." />
          ) : null}

          {(data?.moments.length ?? 0) > 0 ? (
            <>
              <h2 className="data-figure mt-8 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                {term ? "Matching moments" : "Getting seen this week"}
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {data?.moments.map((m) => (
                  <Link
                    key={m.id}
                    to="/u/$username"
                    params={{ username: m.author.username }}
                    className="relative aspect-[9/14] overflow-hidden rounded-2xl bg-surface"
                  >
                    {m.posterUrl || m.mediaUrl ? (
                      <img
                        src={m.posterUrl ?? m.mediaUrl ?? ""}
                        alt={m.caption ?? `Moment by ${m.author.username}`}
                        className="size-full object-cover"
                        loading="lazy"
                      />
                    ) : null}
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background to-transparent p-2 pt-8">
                      <span className="data-figure block text-[10px] text-muted-foreground">
                        @{m.author.username}
                      </span>
                      <span className="data-figure block text-[10px] text-foreground">
                        {formatCount(m.viewCount)} seen
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </>
          ) : null}
        </div>
      )}
    </AppShell>
  );
}
