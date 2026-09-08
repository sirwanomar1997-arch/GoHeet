import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { GoHeetWordmark } from "@/components/reelzy/logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set a new password | GoHeet" },
      {
        name: "description",
        content: "Choose a new password for your GoHeet account and get back to your moments.",
      },
      { property: "og:title", content: "Set a new password | GoHeet" },
      {
        property: "og:description",
        content: "Choose a new password for your GoHeet account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});

const RULES = [
  { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { label: "One capital letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "One number", test: (v: string) => /\d/.test(v) },
  { label: "One special character", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
] as const;

function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const failed = RULES.filter((r) => !r.test(password));
    if (failed.length) {
      toast.error(`Password needs: ${failed.map((r) => r.label.toLowerCase()).join(", ")}.`);
      return;
    }
    if (password !== confirm) {
      toast.error("The two passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated. You're logged in.");
      window.location.replace("/feed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-svh bg-background px-6 pb-12 pt-10">
      <div className="mx-auto max-w-sm">
        <GoHeetWordmark />
        <h1 className="mt-10 font-display text-2xl font-semibold">Set a new password</h1>
        {!ready ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Open this page from the link in your email to set a new password.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="np">New password</Label>
              <Input
                id="np"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 h-12 bg-surface-raised"
              />
              {password.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {RULES.map((rule) => (
                    <li
                      key={rule.label}
                      className={`text-xs ${
                        rule.test(password) ? "text-green-500" : "text-muted-foreground"
                      }`}
                    >
                      {rule.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <Label htmlFor="cp">Repeat new password</Label>
              <Input
                id="cp"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-1.5 h-12 bg-surface-raised"
              />
            </div>
            <Button
              type="submit"
              disabled={busy}
              className="ember-fill h-12 w-full rounded-2xl text-base font-semibold text-primary-foreground"
            >
              {busy ? "Saving…" : "Save new password"}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
