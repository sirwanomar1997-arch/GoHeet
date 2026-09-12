import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { signInWithIdentifier } from "@/lib/reelzy.functions";
import { GoHeetMark, GoHeetWordmark } from "@/components/reelzy/logo";
import { HeetFlame } from "@/components/reelzy/heet-flame";
import { Input } from "@/components/ui/input";
import { Check, Eye, EyeOff } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const searchSchema = z.object({
  mode: z.enum(["signup", "signin"]).optional(),
  redirect: z.string().optional(),
});

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { label: "One number", test: (v: string) => /\d/.test(v) },
] as const;

const AUTH_COPY = {
  en: {
    createTitle: "Create your account", createDescription: "Sign up with your email or phone number.",
    almostThere: "Almost there.", enterTextCode: "Enter the code we texted you.", emailOrPhone: "Email or phone number",
    phoneCodeHint: "We'll text you a code to confirm this number.", phoneHint: "Start with + to use a phone number instead.",
    password: "Password", repeatPassword: "Repeat password", changeNumber: "Change number", oneMoment: "One moment…",
    verifyContinue: "Verify & continue", sendCode: "Send code", createAccount: "Create account",
    resetTitle: "Reset your password", resetDescription: "Enter the email or phone number on your account.",
    codeDescription: "Enter the code we sent to {id}.", choosePassword: "Choose a new password.",
    verificationCode: "Verification code", differentLogin: "Use a different email or number", sending: "Sending…",
    checking: "Checking…", verifyCode: "Verify code", newPassword: "New password", repeatNewPassword: "Repeat new password",
    saving: "Saving…", savePassword: "Save new password", hidePassword: "Hide password", showPassword: "Show password",
    min8: "At least 8 characters", capital: "One capital letter", number: "One number", special: "One special character",
  },
  sv: {
    createTitle: "Skapa ditt konto", createDescription: "Registrera dig med din e-postadress eller ditt telefonnummer.",
    almostThere: "Nästan klart.", enterTextCode: "Ange koden vi skickade till dig.", emailOrPhone: "E-postadress eller telefonnummer",
    phoneCodeHint: "Vi skickar en kod för att bekräfta numret.", phoneHint: "Börja med + för att använda ett telefonnummer istället.",
    password: "Lösenord", repeatPassword: "Upprepa lösenord", changeNumber: "Byt nummer", oneMoment: "Ett ögonblick…",
    verifyContinue: "Verifiera och fortsätt", sendCode: "Skicka kod", createAccount: "Skapa konto",
    resetTitle: "Återställ ditt lösenord", resetDescription: "Ange e-postadressen eller telefonnumret för ditt konto.",
    codeDescription: "Ange koden vi skickade till {id}.", choosePassword: "Välj ett nytt lösenord.",
    verificationCode: "Verifieringskod", differentLogin: "Använd en annan e-postadress eller ett annat nummer", sending: "Skickar…",
    checking: "Kontrollerar…", verifyCode: "Verifiera kod", newPassword: "Nytt lösenord", repeatNewPassword: "Upprepa nytt lösenord",
    saving: "Sparar…", savePassword: "Spara nytt lösenord", hidePassword: "Dölj lösenord", showPassword: "Visa lösenord",
    min8: "Minst 8 tecken", capital: "En stor bokstav", number: "En siffra", special: "Ett specialtecken",
  },
} as const;

function useAuthCopy() {
  const { locale } = useI18n();
  return locale === "sv" ? AUTH_COPY.sv : AUTH_COPY.en;
}

function passwordProblem(value: string): string | null {
  const failed = PASSWORD_RULES.filter((r) => !r.test(value));
  if (failed.length === 0) return null;
  return `Password needs: ${failed.map((r) => r.label.toLowerCase()).join(", ")}.`;
}

function PasswordChecklist({ value }: { value: string }) {
  const copy = useAuthCopy();
  if (!value) return null;
  return (
    <ul className="mt-2 space-y-1">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(value);
        return (
          <li
            key={rule.label}
            className={`flex items-center gap-1.5 text-xs ${
              ok ? "text-green-500" : "text-muted-foreground"
            }`}
          >
            {ok ? (
              <Check className="size-3.5" />
            ) : (
              <span className="size-3.5 rounded-full border border-current opacity-50" />
            )}
            {rule.label === "At least 8 characters" ? copy.min8 : copy.number}
          </li>
        );
      })}
    </ul>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete = "new-password",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  const copy = useAuthCopy();
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative mt-1.5">
        <Input
          id={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={8}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 bg-surface-raised pr-11"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? copy.hidePassword : copy.showPassword}
          aria-pressed={show}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/auth")({
  ssr: false,
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
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const [signupOpen, setSignupOpen] = useState(search.mode === "signup");
  const [resetOpen, setResetOpen] = useState(false);

  // A leading "+" means the user is signing in with a phone number (SMS code),
  // which keeps it unambiguous from a username.
  const isPhone = identifier.trim().startsWith("+");

  const dest = search.redirect && search.redirect.startsWith("/") ? search.redirect : "/feed";

  // Move into the app with the in-app router instead of reloading the page.
  // A full document reload inside the native shell can paint a blank screen
  // until the user pulls to refresh.
  const goAuthed = useCallback(
    (to: string) => {
      void (async () => {
        // Make sure the session is actually stored before leaving this screen,
        // otherwise the next page can mount with no user and render nothing.
        for (let i = 0; i < 20; i++) {
          const { data } = await supabase.auth.getSession();
          if (data.session) break;
          await new Promise((r) => setTimeout(r, 50));
        }
        try {
          // Move first so the home screen paints straight away; refresh cached
          // data in the background instead of holding the user on a blank page.
          await router.navigate({ to: to as never, replace: true });
          void router.invalidate();
        } catch {
          window.location.replace(to);
          return;
        }
        // Safety net: if the router did not actually move (blank screen in the
        // native shell), fall back to a real navigation.
        setTimeout(() => {
          if (window.location.pathname.startsWith("/auth")) {
            window.location.replace(to);
          }
        }, 1200);
      })();
    },
    [router],
  );



  const goToExistingProfileOrSetup = useCallback(
    async (fallback: string) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        goAuthed(fallback);
        return;
      }

      // A missing row means this is a genuinely new account. A temporary
      // request failure must never send an established user through setup.
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", userData.user.id)
        .maybeSingle();
      if (profileError) {
        goAuthed(fallback);
        return;
      }
      goAuthed(profile?.username ? fallback : "/onboarding");
    },
    [goAuthed],
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        const savedDestination = window.sessionStorage.getItem("goheet.auth.destination");
        window.sessionStorage.removeItem("goheet.auth.destination");
        void goToExistingProfileOrSetup(
          savedDestination?.startsWith("/") ? savedDestination : dest,
        );
      }
    });
  }, [goToExistingProfileOrSetup, dest]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
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
        await goToExistingProfileOrSetup(dest);
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
      await goToExistingProfileOrSetup(dest);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function oauth(provider: "google" | "apple") {
    window.sessionStorage.setItem("goheet.auth.destination", dest);
    // Return to the origin root (a public route), not /auth. The broker redirects
    // here with the session, the root guard detects it and sends the user to
    // /feed (or /onboarding). Pointing the return at /auth itself can leave the
    // browser stuck on the Lovable broker page after Apple/Google sign-in.
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Sign-in didn't work. Try email instead.");
      return;
    }
    if (result.redirected) return;
    await goToExistingProfileOrSetup(dest);
  }

  return (
    <main className="min-h-svh bg-background px-6 pb-12 pt-10">
      <div className="mx-auto max-w-sm">
        <Link to="/" className="flex items-center">
          <GoHeetWordmark />
        </Link>

        <div className="mt-12 grid grid-cols-[minmax(0,1fr)_5.5rem] items-center gap-3">
          <h1
            className="font-brand text-[2.5rem] uppercase leading-[1.08] tracking-normal"
            data-no-translate
          >
            <span className="ember-text">Heet</span> your
            <br />
            moment
          </h1>
          <HeetFlame className="size-[5.5rem] justify-self-end" />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground" data-no-translate>
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

        <p className="mb-4 text-xs text-muted-foreground">
          Log in with your email, phone number or username.
        </p>

        <form onSubmit={submit} className="space-y-4">
          {isPhone && otpSent ? (
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
                  {isPhone ? "Phone number" : "Email or username"}
                </Label>
                <Input
                  id="identifier"
                  type="text"
                  inputMode={isPhone ? "tel" : undefined}
                  autoComplete={isPhone ? "tel" : "username"}
                  required
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (otpSent) setOtpSent(false);
                  }}
                  className="mt-1.5 h-12 bg-surface-raised"
                />
              </div>

              {!isPhone && (
                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="password"
                      type={showPw ? "text" : "password"}
                      autoComplete="current-password"
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
            {busy ? "One moment…" : isPhone ? (otpSent ? "Verify & log in" : "Send code") : "Log in"}
          </Button>
          <button
            type="button"
            onClick={() => setResetOpen(true)}
            disabled={busy}
            className="w-full text-center text-sm text-muted-foreground underline"
          >
            Forgot password?
          </button>
        </form>

        <button
          type="button"
          onClick={() => setSignupOpen(true)}
          className="mt-6 w-full text-center text-sm text-muted-foreground underline"
        >
          Create account
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

      <SignUpDialog open={signupOpen} onOpenChange={setSignupOpen} goAuthed={goAuthed} />
      <ResetDialog open={resetOpen} onOpenChange={setResetOpen} />
    </main>
  );
}

function SignUpDialog({
  open,
  onOpenChange,
  goAuthed,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  goAuthed: (to: string) => void;
}) {
  const copy = useAuthCopy();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const isPhone = identifier.trim().startsWith("+");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const id = identifier.trim();

      if (isPhone && otpSent) {
        const phone = "+" + id.replace(/[^\d]/g, "");
        const { error } = await supabase.auth.verifyOtp({
          phone,
          token: code.trim(),
          type: "sms",
        });
        if (error) throw error;
        goAuthed("/onboarding");
        return;
      }

      const problem = passwordProblem(password);
      if (problem) {
        toast.error(problem);
        return;
      }
      if (password !== confirm) {
        toast.error("The two passwords don't match.");
        return;
      }

      // Phone sign-up is verified with an SMS code before the account can
      // continue. Email sign-up goes straight through.
      if (isPhone) {
        const phone = "+" + id.replace(/[^\d]/g, "");
        const { error } = await supabase.auth.signUp({ phone, password });
        if (error) throw error;
        setOtpSent(true);
        toast("We sent a code to your phone.");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: id,
        password,
        options: { emailRedirectTo: `${window.location.origin}/onboarding` },
      });
      if (error) throw error;
      if (!data.session) {
        setEmailSent(true);
        return;
      }
      goAuthed("/onboarding");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl" data-no-translate>
        <DialogHeader>
          <DialogTitle>{copy.createTitle}</DialogTitle>
          <DialogDescription>
            {emailSent
              ? copy.almostThere
              : otpSent
                ? copy.enterTextCode
                : copy.createDescription}
          </DialogDescription>
        </DialogHeader>

        {emailSent ? (
          <div className="space-y-4 text-center">
            <GoHeetMark className="mx-auto size-10" />
            <p className="text-sm text-muted-foreground">
              We sent a confirmation link to {identifier}. Tap it and come back to finish setting up
              your profile.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {otpSent ? (
              <div>
                <Label htmlFor="su-code">{copy.enterTextCode}</Label>
                <Input
                  id="su-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="mt-1.5 h-12 bg-surface-raised"
                />
                <button
                  type="button"
                  className="mt-2 text-xs text-muted-foreground underline"
                  onClick={() => {
                    setOtpSent(false);
                    setCode("");
                  }}
                >
                  {copy.changeNumber}
                </button>
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor="su-id">{copy.emailOrPhone}</Label>
                  <Input
                    id="su-id"
                    type="text"
                    inputMode={isPhone ? "tel" : undefined}
                    autoComplete="email"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="mt-1.5 h-12 bg-surface-raised"
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {isPhone
                      ? copy.phoneCodeHint
                      : copy.phoneHint}
                  </p>
                </div>
                <div>
                  <PasswordField
                    id="su-pw"
                    label={copy.password}
                    value={password}
                    onChange={setPassword}
                  />
                  <PasswordChecklist value={password} />
                </div>
                <PasswordField
                  id="su-pw2"
                  label={copy.repeatPassword}
                  value={confirm}
                  onChange={setConfirm}
                />
              </>
            )}
            <Button
              type="submit"
              disabled={busy}
              className="ember-fill h-12 w-full rounded-2xl text-base font-semibold text-primary-foreground"
            >
              {busy
                ? copy.oneMoment
                : otpSent
                  ? copy.verifyContinue
                  : isPhone
                    ? copy.sendCode
                    : copy.createAccount}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ResetDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const copy = useAuthCopy();
  const [step, setStep] = useState<"identifier" | "code" | "password">("identifier");
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const isPhone = identifier.trim().startsWith("+");

  function close() {
    onOpenChange(false);
    setStep("identifier");
    setCode("");
    setPassword("");
    setConfirm("");
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const id = identifier.trim();
      if (id.startsWith("+")) {
        const phone = "+" + id.replace(/[^\d]/g, "");
        const { error } = await supabase.auth.signInWithOtp({
          phone,
          options: { shouldCreateUser: false },
        });
        if (error) throw error;
      } else {
        if (!id.includes("@")) {
          toast.error("Enter the email address or phone number on your account.");
          return;
        }
        const { error } = await supabase.auth.signInWithOtp({
          email: id,
          options: { shouldCreateUser: false },
        });
        if (error) throw error;
      }
      setStep("code");
      toast("We sent you a verification code.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const id = identifier.trim();
      const { error } = id.startsWith("+")
        ? await supabase.auth.verifyOtp({
            phone: "+" + id.replace(/[^\d]/g, ""),
            token: code.trim(),
            type: "sms",
          })
        : await supabase.auth.verifyOtp({
            email: id,
            token: code.trim(),
            type: "email",
          });
      if (error) throw error;
      setStep("password");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "That code didn't work.");
    } finally {
      setBusy(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const problem = passwordProblem(password);
    if (problem) {
      toast.error(problem);
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
      await supabase.auth.signOut();
      toast.success("Password updated. Log in with your new password.");
      close();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-sm rounded-3xl" data-no-translate>
        <DialogHeader>
          <DialogTitle>{copy.resetTitle}</DialogTitle>
          <DialogDescription>
            {step === "identifier"
              ? copy.resetDescription
              : step === "code"
                ? copy.codeDescription.replace("{id}", identifier.trim())
                : copy.choosePassword}
          </DialogDescription>
        </DialogHeader>

        {step === "identifier" && (
          <form onSubmit={sendCode} className="space-y-4">
            <div>
              <Label htmlFor="rs-id">{copy.emailOrPhone}</Label>
              <Input
                id="rs-id"
                type="text"
                inputMode={isPhone ? "tel" : undefined}
                autoComplete="username"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="mt-1.5 h-12 bg-surface-raised"
              />
            </div>
            <Button
              type="submit"
              disabled={busy}
              className="ember-fill h-12 w-full rounded-2xl text-base font-semibold text-primary-foreground"
            >
              {busy ? copy.sending : copy.sendCode}
            </Button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={verify} className="space-y-4">
            <div>
              <Label htmlFor="rs-code">{copy.verificationCode}</Label>
              <Input
                id="rs-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="mt-1.5 h-12 bg-surface-raised"
              />
              <button
                type="button"
                className="mt-2 text-xs text-muted-foreground underline"
                onClick={() => setStep("identifier")}
              >
                {copy.differentLogin}
              </button>
            </div>
            <Button
              type="submit"
              disabled={busy}
              className="ember-fill h-12 w-full rounded-2xl text-base font-semibold text-primary-foreground"
            >
              {busy ? copy.checking : copy.verifyCode}
            </Button>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={save} className="space-y-4">
            <div>
              <PasswordField
                id="rs-pw"
                label={copy.newPassword}
                value={password}
                onChange={setPassword}
              />
              <PasswordChecklist value={password} />
            </div>
            <PasswordField
              id="rs-pw2"
              label={copy.repeatNewPassword}
              value={confirm}
              onChange={setConfirm}
            />
            <Button
              type="submit"
              disabled={busy}
              className="ember-fill h-12 w-full rounded-2xl text-base font-semibold text-primary-foreground"
            >
              {busy ? copy.saving : copy.savePassword}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
