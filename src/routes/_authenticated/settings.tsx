import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  deleteAccount,
  exportMyData,
  listBlocked,
  toggleBlock,
  updateProfile,
} from "@/lib/reelzy.functions";
import { useMe } from "@/lib/use-me";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/reelzy/nav";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: me } = useMe();
  const save = useServerFn(updateProfile);
  const exportData = useServerFn(exportMyData);
  const removeAccount = useServerFn(deleteAccount);
  const fetchBlocked = useServerFn(listBlocked);
  const unblock = useServerFn(toggleBlock);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [discoverable, setDiscoverable] = useState(true);
  const [allowComments, setAllowComments] = useState("everyone");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    const p = me?.profile;
    if (!p) return;
    setDisplayName(p.display_name ?? "");
    setBio(p.bio ?? "");
    setIsPrivate(!!p.is_private);
    setDiscoverable(p.discoverable !== false);
    setAllowComments(p.allow_comments ?? "everyone");
  }, [me]);

  const blocked = useQuery({
    queryKey: ["blocked"],
    queryFn: () => fetchBlocked({ data: undefined as never }),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      save({ data: { displayName, bio, isPrivate, discoverable, allowComments } }),
    onSuccess: () => {
      toast.success("Saved.");
      void qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => removeAccount({ data: { confirmUsername: confirm } }),
    onSuccess: async () => {
      await supabase.auth.signOut();
      toast.success("Your account and everything in it is gone.");
      await navigate({ to: "/" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
  }

  async function download() {
    const data = await exportData({ data: undefined as never });
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "reelzy-data.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  const section = "rounded-2xl border border-border bg-surface p-4";

  return (
    <AppShell>
      <header className="px-5 pb-2 pt-6">
        <h1 className="font-display text-2xl font-extrabold tracking-[-0.04em]">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Signed in as @{me?.profile?.username ?? "…"}
        </p>
      </header>

      <div className="space-y-4 px-5 pb-12">
        <section className={section}>
          <h2 className="font-display text-base font-semibold">You</h2>
          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="dn">Display name</Label>
              <Input
                id="dn"
                value={displayName}
                maxLength={40}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1.5 h-11 bg-surface-raised"
              />
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                maxLength={160}
                onChange={(e) => setBio(e.target.value)}
                className="mt-1.5 bg-surface-raised"
              />
            </div>
          </div>
        </section>

        <section className={section}>
          <h2 className="font-display text-base font-semibold">Privacy</h2>
          <div className="mt-4 space-y-4">
            <label className="flex items-center justify-between gap-4">
              <span className="text-sm">
                Private account
                <span className="block text-xs text-muted-foreground">
                  Only approved followers see your moments.
                </span>
              </span>
              <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
            </label>
            <label className="flex items-center justify-between gap-4">
              <span className="text-sm">
                Show me in search
                <span className="block text-xs text-muted-foreground">
                  Turn off to stay out of discovery.
                </span>
              </span>
              <Switch checked={discoverable} onCheckedChange={setDiscoverable} />
            </label>
            <div>
              <Label htmlFor="comments">Who can comment</Label>
              <select
                id="comments"
                value={allowComments}
                onChange={(e) => setAllowComments(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-surface-raised px-3 text-sm"
              >
                <option value="everyone">Everyone</option>
                <option value="followers">People I approve of (followers)</option>
                <option value="nobody">Nobody</option>
              </select>
            </div>
          </div>
        </section>

        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="ember-fill h-12 w-full rounded-2xl text-base font-semibold text-primary-foreground"
        >
          {saveMutation.isPending ? "Saving…" : "Save changes"}
        </Button>

        <section className={section}>
          <h2 className="font-display text-base font-semibold">Blocked people</h2>
          {(blocked.data?.blocked.length ?? 0) === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">You haven&apos;t blocked anyone.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {blocked.data?.blocked.map((b) => (
                <li key={b.id} className="flex items-center justify-between py-2.5">
                  <span className="text-sm">@{b.username}</span>
                  <button
                    type="button"
                    className="text-xs underline"
                    onClick={async () => {
                      await unblock({ data: { userId: b.id } });
                      void blocked.refetch();
                    }}
                  >
                    Unblock
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {me?.isStaff ? (
          <Link to="/admin" className={`${section} block text-sm font-semibold`}>
            Open moderation dashboard →
          </Link>
        ) : null}

        <section className={section}>
          <h2 className="font-display text-base font-semibold">Your data</h2>
          <button type="button" onClick={download} className="mt-3 text-sm underline">
            Download everything we hold about you
          </button>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {["terms", "privacy", "guidelines", "safety", "cookies", "copyright"].map((d) => (
              <Link key={d} to="/legal/$doc" params={{ doc: d }} className="underline capitalize">
                {d}
              </Link>
            ))}
          </div>
        </section>

        <button
          type="button"
          onClick={signOut}
          className="tap-target w-full rounded-2xl border border-border text-sm font-medium"
        >
          Sign out
        </button>

        <section className="rounded-2xl border border-destructive/40 p-4">
          <h2 className="font-display text-base font-semibold text-destructive">Delete account</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            This removes your profile, moments, media, comments and follows. It cannot be undone.
            Type your username to confirm.
          </p>
          <Input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={me?.profile?.username ?? "username"}
            className="mt-3 h-11 bg-surface-raised"
          />
          <Button
            variant="destructive"
            disabled={!confirm || deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
            className="mt-3 h-11 w-full rounded-2xl"
          >
            Permanently delete my account
          </Button>
        </section>
      </div>
    </AppShell>
  );
}
