import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { ReelzyMark, ReelzyWordmark } from "@/components/reelzy/logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const searchSchema = z.object({
  mode: z.enum(["signup", "signin"]).optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in to Reelzy" },
      {
        name: "description",
        content: "Create your Reelzy account or sign back in to capture and share real moments.",
      },
      { property: "og:title", content: "Sign in to Reelzy" },
      { property: "og:description", content: "Camera-first social video. Real moments only." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signup" | "signin">(search.mode ?? "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const dest = search.redirect && search.redirect.startsWith("/") ? search.redirect : "/feed";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}${dest}` },
        });
        if (error) throw error;
        if (!data.session) {
          setSent(true);
          return;
        }
        await navigate({ to: "/onboarding" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await navigate({ to: dest });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in didn't work. Try email instead.");
      return;
    }
    if (result.redirected) return;
    await navigate({ to: dest });
  }

  if (sent) {
    return (
      <main className="grid min-h-svh place-items-center bg-background px-6 text-center">
        <div className="max-w-sm">
          <ReelzyMark className="mx-auto size-10" />
          <h1 className="mt-6 font-display text-2xl font-semibold">Check your email</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We sent a confirmation link to {email}. Tap it and come back to finish setting up your
            profile.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-svh bg-background px-6 pb-12 pt-10">
      <div className="mx-auto max-w-sm">
        <Link to="/" className="flex items-center gap-2">
          <ReelzyMark className="size-8" />
          <ReelzyWordmark />
        </Link>

        <h1 className="mt-12 font-display text-3xl font-extrabold tracking-[-0.04em]">
          {mode === "signup" ? "Start capturing." : "Welcome back."}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signup"
            ? "Reelzy is for people aged 13 and over. We'll ask your date of birth next."
            : "Your moments are waiting."}
        </p>

        <button
          type="button"
          onClick={google}
          className="tap-target mt-8 flex w-full items-center justify-center gap-3 rounded-2xl border border-border bg-surface-raised text-sm font-medium"
        >
          <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
            <path
              fill="currentColor"
              d="M21.35 11.1H12v2.9h5.35c-.23 1.4-1.63 4.1-5.35 4.1a5.9 5.9 0 1 1 0-11.8c1.68 0 2.81.72 3.46 1.34l2.36-2.27C16.4 3.9 14.4 3 12 3a9 9 0 1 0 0 18c5.2 0 8.64-3.65 8.64-8.8 0-.6-.06-1.05-.29-1.1Z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="data-figure text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            or
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 h-12 bg-surface-raised"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 h-12 bg-surface-raised"
            />
          </div>
          <Button
            type="submit"
            disabled={busy}
            className="ember-fill h-12 w-full rounded-2xl text-base font-semibold text-primary-foreground"
          >
            {busy ? "One moment…" : mode === "signup" ? "Create account" : "Sign in"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          className="mt-6 w-full text-center text-sm text-muted-foreground underline"
        >
          {mode === "signup" ? "I already have an account" : "I need an account"}
        </button>

        <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground">
          By continuing you agree to the{" "}
          <Link to="/legal/$doc" params={{ doc: "terms" }} className="underline">
            Terms
          </Link>
          ,{" "}
          <Link to="/legal/$doc" params={{ doc: "privacy" }} className="underline">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link to="/legal/$doc" params={{ doc: "guidelines" }} className="underline">
            Community Guidelines
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
