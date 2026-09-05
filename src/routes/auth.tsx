import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { signInWithIdentifier } from "@/lib/reelzy.functions";
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
      { title: "Log in to Reelzy" },
      {
        name: "description",
        content: "Log back in to Reelzy to capture and share real moments, or create a new account.",
      },
      { property: "og:title", content: "Log in to Reelzy" },
      { property: "og:description", content: "Camera-first social video. Real moments only." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signup" | "signin">(search.mode ?? "signin");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  // A leading "+" means the user is signing in with a phone number (SMS code),
  // which keeps it unambiguous from a username.
  const isPhone = identifier.trim().startsWith("+");

  const dest = search.redirect && search.redirect.startsWith("/") ? search.redirect : "/feed";

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: dest });
    });
  }, [navigate, dest]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: identifier.trim(),
          password,
          options: { emailRedirectTo: `${window.location.origin}${dest}` },
        });
        if (error) throw error;
        if (!data.session) {
          setSent(true);
          return;
        }
        await navigate({ to: "/onboarding" });
        return;
      }

      // Sign in
      const id = identifier.trim();
      if (id.startsWith("+")) {
        const phone = "+" + id.replace(/[^\d]/g, "");
        if (!otpSent) {
          const { error } = await supabase.auth.signInWithOtp({ phone });
          if (error) throw error;
          setOtpSent(true);
          toast("We sent a code to your phone.");
          return;
        }
        const { error } = await supabase.auth.verifyOtp({
          phone,
          token: code.trim(),
          type: "sms",
        });
        if (error) throw error;
        await navigate({ to: dest });
        return;
      }

      // Email or username — resolved securely on the server
      const res = await signInWithIdentifier({
        data: { identifier: id, password },
      });
      const { error } = await supabase.auth.setSession({
        access_token: res.accessToken,
        refresh_token: res.refreshToken,
      });
      if (error) throw error;
      await navigate({ to: dest });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function oauth(provider: "google" | "apple") {
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Sign-in didn't work. Try email instead.");
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
            We sent a confirmation link to {identifier}. Tap it and come back to finish setting up
            your profile.
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
          Real moments.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Capture your moment, right as it happens. Just life, pressed into a reality frame.
        </p>

        <button
          type="button"
          onClick={() => oauth("google")}
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

        <button
          type="button"
          onClick={() => oauth("apple")}
          className="tap-target mt-3 flex w-full items-center justify-center gap-3 rounded-2xl border border-border bg-surface-raised text-sm font-medium"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
            <path d="M17.05 12.54c-.03-2.89 2.36-4.27 2.47-4.34-1.35-1.97-3.44-2.24-4.18-2.27-1.78-.18-3.47 1.05-4.37 1.05-.9 0-2.29-1.02-3.77-1-1.94.03-3.72 1.13-4.72 2.86-2.01 3.49-.51 8.66 1.45 11.5.96 1.39 2.1 2.95 3.6 2.89 1.45-.06 2-.93 3.75-.93s2.25.93 3.78.9c1.56-.03 2.55-1.41 3.5-2.8 1.1-1.61 1.56-3.17 1.58-3.25-.03-.02-3.04-1.17-3.09-4.61ZM14.15 4.06c.8-.97 1.34-2.32 1.19-3.66-1.15.05-2.55.77-3.38 1.73-.74.86-1.39 2.23-1.22 3.55 1.29.1 2.6-.65 3.41-1.62Z" />
          </svg>
          Continue with Apple
        </button>

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="data-figure text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            or
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        {mode === "signin" && (
          <p className="mb-4 text-xs text-muted-foreground">
            Log in with your email, phone number or username.
          </p>
        )}

        <form onSubmit={submit} className="space-y-4">
          {mode === "signin" && isPhone && otpSent ? (
            <div>
              <Label htmlFor="code">Enter the code</Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="mt-1.5 h-12 bg-surface-raised"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                We texted a code to {identifier.trim()}.{" "}
                <button
                  type="button"
                  className="underline"
                  onClick={() => {
                    setOtpSent(false);
                    setCode("");
                  }}
                >
                  Change number
                </button>
              </p>
            </div>
          ) : (
            <>
              <div>
                <Label htmlFor="identifier">
                  {mode === "signin" ? (isPhone ? "Phone number" : "Email or username") : "Email"}
                </Label>
                <Input
                  id="identifier"
                  type={mode === "signup" ? "email" : "text"}
                  inputMode={isPhone ? "tel" : undefined}
                  autoComplete={mode === "signup" ? "email" : isPhone ? "tel" : "username"}
                  required
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (otpSent) setOtpSent(false);
                  }}
                  className="mt-1.5 h-12 bg-surface-raised"
                />
              </div>
              {(mode === "signup" || (mode === "signin" && !isPhone)) && (
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
              )}
            </>
          )}
          <Button
            type="submit"
            disabled={busy}
            className="ember-fill h-12 w-full rounded-2xl text-base font-semibold text-primary-foreground"
          >
            {busy
              ? "One moment…"
              : mode === "signup"
                ? "Create account"
                : isPhone
                  ? otpSent
                    ? "Verify & log in"
                    : "Send code"
                  : "Log in"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-6 w-full text-center text-sm text-muted-foreground underline"
        >
          {mode === "signin" ? "Create account" : "Log in"}
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
