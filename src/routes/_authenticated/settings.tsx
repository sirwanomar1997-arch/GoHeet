import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bookmark,
  ChevronRight,
  Heart,
  History,
  MessageCircle,
  Pencil,
  UserPlus,
} from "lucide-react";
import {
  deleteAccount,
  exportMyData,
  listBlocked,
  listMyComments,
  toggleBlock,
  updateProfile,
} from "@/lib/reelzy.functions";
import { useMe } from "@/lib/use-me";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/reelzy/nav";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const fetchMyComments = useServerFn(listMyComments);
  const unblock = useServerFn(toggleBlock);

  const [email, setEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [discoverable, setDiscoverable] = useState(true);
  const [allowComments, setAllowComments] = useState("everyone");
  const [confirm, setConfirm] = useState("");
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  useEffect(() => {
    const p = me?.profile;
    if (!p) return;
    setIsPrivate(!!p.is_private);
    setDiscoverable(p.discoverable !== false);
    setAllowComments(p.allow_comments ?? "everyone");
  }, [me]);

  const blocked = useQuery({
    queryKey: ["blocked"],
    queryFn: () => fetchBlocked({ data: undefined as never }),
  });

  const myComments = useQuery({
    queryKey: ["my-comments"],
    enabled: showComments,
    queryFn: () => fetchMyComments({ data: undefined as never }),
  });

  const privacyMutation = useMutation({
    mutationFn: () => save({ data: { isPrivate, discoverable, allowComments } }),
    onSuccess: () => {
      toast.success("Privacy settings saved.");
      void qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const passwordMutation = useMutation({
    mutationFn: async () => {
      if (newPassword.length < 8) throw new Error("Use at least 8 characters.");
      if (newPassword !== confirmPassword) throw new Error("The two passwords don't match.");
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const emailMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Check your new inbox to confirm the change.");
      setNewEmail("");
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

  async function signOut(to: "/auth" | "/") {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    await navigate({ to, replace: true });
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
  const row =
    "flex w-full items-center justify-between gap-3 rounded-xl px-1 py-3 text-left text-sm";

  return (
    <AppShell>
      <header className="px-5 pb-2 pt-6">
        <h1 className="font-display text-2xl font-extrabold tracking-[-0.04em]">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Signed in as @{me?.profile?.username ?? "…"}
        </p>
      </header>

      <div className="space-y-4 px-5 pb-12">
        <Link to="/edit-profile" className={`${section} flex items-center justify-between`}>
          <span className="flex items-center gap-3 text-sm font-medium">
            <Pencil className="size-4 text-muted-foreground" /> Edit profile & platform links
          </span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>

        <section className={section}>
          <h2 className="font-display text-base font-semibold">Your activity</h2>
          <div className="mt-2 divide-y divide-border">
            <Link to="/u/$username" params={{ username: me?.profile?.username ?? "" }} className={row}>
              <span className="flex items-center gap-3">
                <History className="size-4 text-amber-400" /> Your Reelz
              </span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
            <Link to="/saved" className={row}>
              <span className="flex items-center gap-3">
                <Bookmark className="size-4 text-emerald-400" /> Saved videos
              </span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
            <Link to="/activity" className={row}>
              <span className="flex items-center gap-3">
                <Heart className="size-4 text-rose-400" /> Likes, follows & notifications
              </span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
            <button type="button" className={row} onClick={() => setShowComments((v) => !v)}>
              <span className="flex items-center gap-3">
                <MessageCircle className="size-4 text-sky-400" /> Comments you wrote
              </span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
          </div>
          {showComments ? (
            myComments.isLoading ? (
              <p className="mt-2 text-sm text-muted-foreground">Loading…</p>
            ) : (myComments.data?.comments.length ?? 0) === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">You haven&apos;t commented yet.</p>
            ) : (
              <ul className="mt-2 divide-y divide-border">
                {myComments.data?.comments.map((c) => (
                  <li key={c.id} className="py-2.5 text-sm">
                    <p>{c.body}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            )
          ) : null}
        </section>

        <section className={section}>
          <h2 className="font-display text-base font-semibold">Login & security</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Email on this account: {email || "—"}
          </p>
          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="np">New password</Label>
              <Input
                id="np"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1.5 h-11 bg-surface-raised"
              />
            </div>
            <div>
              <Label htmlFor="cp">Repeat new password</Label>
              <Input
                id="cp"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1.5 h-11 bg-surface-raised"
              />
            </div>
            <Button
              variant="secondary"
              disabled={!newPassword || passwordMutation.isPending}
              onClick={() => passwordMutation.mutate()}
              className="h-11 w-full rounded-2xl"
            >
              {passwordMutation.isPending ? "Changing…" : "Change password"}
            </Button>

            <div>
              <Label htmlFor="ne">Change email address</Label>
              <Input
                id="ne"
                type="email"
                value={newEmail}
                placeholder="new@email.com"
                onChange={(e) => setNewEmail(e.target.value)}
                className="mt-1.5 h-11 bg-surface-raised"
              />
              <Button
                variant="secondary"
                disabled={!newEmail || emailMutation.isPending}
                onClick={() => emailMutation.mutate()}
                className="mt-3 h-11 w-full rounded-2xl"
              >
                {emailMutation.isPending ? "Sending…" : "Send confirmation"}
              </Button>
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
            <Button
              onClick={() => privacyMutation.mutate()}
              disabled={privacyMutation.isPending}
              className="ember-fill h-11 w-full rounded-2xl font-semibold text-primary-foreground"
            >
              {privacyMutation.isPending ? "Saving…" : "Save privacy settings"}
            </Button>
          </div>
        </section>

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
          onClick={() => signOut("/auth")}
          className="tap-target flex w-full items-center justify-center gap-2 rounded-2xl border border-border text-sm font-medium"
        >
          <UserPlus className="size-4" /> Switch or add another account
        </button>
        <p className="-mt-2 text-center text-[11px] text-muted-foreground">
          You&apos;ll be taken to the login screen to sign in with another account.
        </p>

        <button
          type="button"
          onClick={() => signOut("/auth")}
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
