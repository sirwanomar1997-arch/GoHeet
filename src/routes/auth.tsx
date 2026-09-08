import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { signInWithIdentifier } from "@/lib/reelzy.functions";
import { GoHeetMark, GoHeetWordmark } from "@/components/reelzy/logo";
import { HeetFlame } from "@/components/reelzy/heet-flame";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const searchSchema = z.object({
  mode: z.enum(["signup", "signin"]).optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Log in to GoHeet" },
      {
        name: "description",
        content: "Log back in to GoHeet to capture and share real moments, or create a new account.",
      },
      { property: "og:title", content: "Log in to GoHeet" },
      { property: "og:description", content: "Camera-first social video. Real moments only." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const [mode, setMode] = useState<"signup" | "signin">(search.mode ?? "signin");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  // A leading "+" means the user is signing in with a phone number (SMS code),
  // which keeps it unambiguous from a username.
  const isPhone = identifier.trim().startsWith("+");

  const dest = search.redirect && search.redirect.startsWith("/") ? search.redirect : "/feed";

  // Clears any stale route data so the destination renders immediately
  // instead of showing a blank screen until a manual refresh.
  const goAuthed = useCallback(
    async (to: string) => {
      await router.invalidate();
      await navigate({ to });
    },
    [router, navigate],
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) void goAuthed(dest);
    });
  }, [goAuthed, dest]);

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
        await goAuthed("/onboarding");
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
        await goAuthed(dest);
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
      await goAuthed(dest);
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
    await goAuthed(dest);
  }

  if (sent) {
    return (
      <main className="grid min-h-svh place-items-center bg-background px-6 text-center">
        <div className="max-w-sm">
          <GoHeetMark className="mx-auto size-10" />
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
        <Link to="/" className="flex items-center">
          <GoHeetWordmark />
        </Link>

        <div className="mt-12 grid grid-cols-[minmax(0,1fr)_5.5rem] items-center gap-3">
          <h1 className="font-brand text-[2.5rem] uppercase leading-[1.08] tracking-normal">
            <span className="ember-text">Heet</span> your
            <br />
            moment
          </h1>
          <HeetFlame className="size-[5.5rem] justify-self-end" />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Capture your moment, right as it happens.
          <br />
          Just life, pressed into a reality frame.
        </p>

        <button
          type="button"
          onClick={() => oauth("google")}
          className="tap-target mt-8 flex w-full items-center justify-center gap-3 rounded-2xl border border-border bg-surface-raised text-sm font-medium"
        >
          <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
            <path fill="#4285F4" d="M23.06 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h6.2a5.3 5.3 0 0 1-2.3 3.48v2.89h3.72c2.18-2 3.44-4.96 3.44-8.38Z" />
            <path fill="#34A853" d="M12 24c3.1 0 5.7-1.03 7.6-2.78l-3.72-2.89c-1.03.69-2.35 1.1-3.88 1.1-2.98 0-5.5-2.01-6.4-4.72H1.86v2.99A12 12 0 0 0 12 24Z" />
            <path fill="#FBBC05" d="M5.6 14.71A7.2 7.2 0 0 1 5.22 12c0-.94.16-1.85.38-2.71V6.3H1.86A12 12 0 0 0 0 12c0 1.94.46 3.77 1.86 5.7l3.74-2.99Z" />
            <path fill="#EA4335" d="M12 4.77c1.68 0 3.18.58 4.37 1.71l3.27-3.27C17.7 1.27 15.1.25 12 .25A12 12 0 0 0 1.86 6.3l3.74 2.99C6.5 6.78 9.02 4.77 12 4.77Z" />
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
                  <div className="relative mt-1.5">
                    <Input
                      id="password"
                      type={showPw ? "text" : "password"}
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 bg-surface-raised pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      aria-label={showPw ? "Hide password" : "Show password"}
                      aria-pressed={showPw}
                      className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                    >
                      {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
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
          . GoHeet has zero tolerance for objectionable content or abusive
          people — reports are actioned within 24 hours.
        </p>
      </div>
    </main>
  );
}
