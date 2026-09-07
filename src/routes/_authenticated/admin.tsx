import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  adminAction,
  adminModerationLog,
  adminOverview,
  adminReportQueue,
  adminSearchPeople,
} from "@/lib/moderation.functions";
import { useMe } from "@/lib/use-me";
import { AppShell } from "@/components/reelzy/nav";
import { EmptyState, LoadingRail } from "@/components/reelzy/empty-state";
import { timeAgo } from "@/components/reelzy/format";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

function AdminPage() {
  const { data: me, isLoading: meLoading } = useMe();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"queue" | "people" | "log">("queue");
  const [q, setQ] = useState("");

  const overviewFn = useServerFn(adminOverview);
  const queueFn = useServerFn(adminReportQueue);
  const peopleFn = useServerFn(adminSearchPeople);
  const logFn = useServerFn(adminModerationLog);
  const actionFn = useServerFn(adminAction);

  const staff = !!me?.isStaff;

  const overview = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => overviewFn({ data: undefined as never }),
    enabled: staff,
  });
  const queue = useQuery({
    queryKey: ["admin", "queue"],
    queryFn: () => queueFn({ data: { status: "open" } }),
    enabled: staff && tab === "queue",
  });
  const people = useQuery({
    queryKey: ["admin", "people", q],
    queryFn: () => peopleFn({ data: { q } }),
    enabled: staff && tab === "people",
  });
  const log = useQuery({
    queryKey: ["admin", "log"],
    queryFn: () => logFn({ data: undefined as never }),
    enabled: staff && tab === "log",
  });

  const act = useMutation({
    mutationFn: (input: {
      action: string;
      targetType: string;
      targetId: string;
      reportId?: string;
    }) => actionFn({ data: input }),
    onSuccess: () => {
      toast.success("Done.");
      void qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (meLoading) {
    return (
      <AppShell>
        <LoadingRail />
      </AppShell>
    );
  }

  if (!staff) {
    return (
      <AppShell>
        <EmptyState
          title="Staff only."
          line="This area is for the GoHeet moderation team."
          action={
            <Link to="/feed" className="tap-target inline-flex rounded-full border border-border px-6 text-sm">
              Back to the feed
            </Link>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="px-5 pb-3 pt-6">
        <h1 className="font-display text-2xl font-extrabold tracking-[-0.04em]">Moderation</h1>
        <div className="mt-4 grid grid-cols-4 gap-2 rounded-2xl border border-border bg-surface p-3">
          {[
            ["People", overview.data?.people],
            ["Moments", overview.data?.moments],
            ["Open", overview.data?.openReports],
            ["Comments", overview.data?.comments],
          ].map(([k, v]) => (
            <div key={String(k)}>
              <p className="data-figure text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                {k}
              </p>
              <p className="data-figure mt-0.5 text-base">{v ?? "—"}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-1 rounded-full border border-border p-1">
          {(["queue", "people", "log"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 rounded-full py-1.5 text-xs font-semibold capitalize ${
                tab === t ? "bg-surface-raised" : "text-muted-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      <div className="px-5 pb-12">
        {tab === "queue" ? (
          queue.isLoading ? (
            <LoadingRail />
          ) : (queue.data?.reports.length ?? 0) === 0 ? (
            <EmptyState title="Queue is clear." line="No open reports right now." />
          ) : (
            <ul className="space-y-3">
              {queue.data?.reports.map((r) => {
                const ageH = (Date.now() - new Date(r.created_at).getTime()) / 3_600_000;
                const overdue = ageH >= 24;
                const urgent = !overdue && ageH >= 18;
                return (
                <li
                  key={r.id}
                  className={`rounded-2xl border bg-surface p-4 ${
                    overdue ? "border-destructive/70" : "border-border"
                  }`}
                >
                  <p className="data-figure text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {r.target_type} · {r.category} · {timeAgo(r.created_at)}
                  </p>
                  <p
                    className={`data-figure mt-1 text-[10px] uppercase tracking-[0.2em] ${
                      overdue ? "text-destructive" : urgent ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {overdue
                      ? `SLA breached · ${Math.floor(ageH - 24)}h over`
                      : `${Math.max(0, Math.ceil(24 - ageH))}h left in 24h SLA`}
                  </p>
                  <p className="mt-1.5 text-sm">{r.label}</p>
                  {r.details ? (
                    <p className="mt-1 text-xs text-muted-foreground">{r.details}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.target_type !== "user" ? (
                      <button
                        type="button"
                        onClick={() =>
                          act.mutate({
                            action: "remove_content",
                            targetType: r.target_type,
                            targetId: r.target_id,
                            reportId: r.id,
                          })
                        }
                        className="rounded-full border border-destructive/50 px-3 py-1.5 text-xs text-destructive"
                      >
                        Remove content
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            act.mutate({
                              action: "suspend_user",
                              targetType: "user",
                              targetId: r.target_id,
                              reportId: r.id,
                            })
                          }
                          className="rounded-full border border-border px-3 py-1.5 text-xs"
                        >
                          Suspend 7 days
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            act.mutate({
                              action: "ban_user",
                              targetType: "user",
                              targetId: r.target_id,
                              reportId: r.id,
                            })
                          }
                          className="rounded-full border border-destructive/50 px-3 py-1.5 text-xs text-destructive"
                        >
                          Ban
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        act.mutate({
                          action: "dismiss_report",
                          targetType: "report",
                          targetId: r.id,
                          reportId: r.id,
                        })
                      }
                      className="rounded-full border border-border px-3 py-1.5 text-xs"
                    >
                      Dismiss
                    </button>
                  </div>
                 </li>
                );
              })}
            </ul>
          )
        ) : null}

        {tab === "people" ? (
          <>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search people"
              className="h-11 bg-surface-raised"
            />
            <ul className="mt-4 divide-y divide-border">
              {people.data?.people.map((p) => (
                <li key={p.id} className="py-3">
                  <p className="text-sm font-semibold">@{p.username}</p>
                  <p className="data-figure text-[11px] text-muted-foreground">
                    {p.moment_count} moments · {p.follower_count} followers ·{" "}
                    {p.banned_at ? "BANNED" : p.suspended_until ? "SUSPENDED" : "active"}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        act.mutate({ action: "suspend_user", targetType: "user", targetId: p.id })
                      }
                      className="rounded-full border border-border px-3 py-1 text-xs"
                    >
                      Suspend
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        act.mutate({ action: "ban_user", targetType: "user", targetId: p.id })
                      }
                      className="rounded-full border border-destructive/50 px-3 py-1 text-xs text-destructive"
                    >
                      Ban
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        act.mutate({ action: "reinstate_user", targetType: "user", targetId: p.id })
                      }
                      className="rounded-full border border-border px-3 py-1 text-xs"
                    >
                      Reinstate
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {tab === "log" ? (
          <ul className="divide-y divide-border">
            {log.data?.actions.map((a) => (
              <li key={a.id} className="py-3">
                <p className="text-sm">{a.action.replace(/_/g, " ")}</p>
                <p className="data-figure text-[11px] text-muted-foreground">
                  {a.target_type} · {timeAgo(a.created_at)}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </AppShell>
  );
}
