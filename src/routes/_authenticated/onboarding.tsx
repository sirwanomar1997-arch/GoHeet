import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { GoHeetWordmark } from "@/components/reelzy/logo";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { checkUsername, completeSignup } from "@/lib/reelzy.functions";
import { useMe } from "@/lib/use-me";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: Onboarding,
});

function ageFrom(dob: string) {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return -1;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

function Onboarding() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: me, isLoading, isError, refetch } = useMe();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "free" | "taken" | "invalid">("idle");

  const check = useServerFn(checkUsername);
  const finish = useServerFn(completeSignup);

  useEffect(() => {
    if (me?.profile?.username) {
      void navigate({ to: "/u/$username", params: { username: me.profile.username }, replace: true });
    }
  }, [me, navigate]);

  useEffect(() => {
    if (!username) return setStatus("idle");
    if (!/^[a-zA-Z0-9_.]{3,20}$/.test(username)) return setStatus("invalid");
    setStatus("checking");
    const t = setTimeout(async () => {
      try {
        const res = await check({ data: { username } });
        setStatus(res.available ? "free" : "taken");
      } catch {
        setStatus("invalid");
      }
    }, 350);
    return () => clearTimeout(t);
  }, [username, check]);

  const age = birthDate ? ageFrom(birthDate) : null;
  const tooYoung = age !== null && age >= 0 && age < 13;

  const submit = useMutation({
    mutationFn: () => finish({ data: { username, displayName, birthDate } }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["me"] });
      await navigate({ to: "/avatar" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || me?.profile?.username) {
    return (
      <main className="grid min-h-svh place-items-center bg-background px-6">
        <p className="text-sm text-muted-foreground">Opening your profile…</p>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="grid min-h-svh place-items-center bg-background px-6 text-center">
        <div>
          <p className="text-sm text-muted-foreground">We couldn’t load your profile.</p>
          <Button className="mt-4" onClick={() => void refetch()}>Try again</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-svh bg-background px-6 pb-16 pt-10">
      <div className="mx-auto max-w-sm">
        <GoHeetWordmark />
        <h1 className="mt-8 font-display text-3xl font-extrabold tracking-[-0.04em]">
          Create your profile.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This is how people will find you on GoHeet. It can be changed later, but not often.
        </p>

        <form
          className="mt-10 space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            submit.mutate();
          }}
        >
          <div>
            <Label htmlFor="username">Username</Label>
            <div className="mt-1.5 flex items-center rounded-xl border border-border bg-surface-raised pl-3">
              <span className="text-muted-foreground">@</span>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.trim().toLowerCase())}
                maxLength={20}
                required
                className="h-12 border-0 bg-transparent focus-visible:ring-0"
                placeholder="yourname"
              />
            </div>
            <p className="mt-1.5 h-4 text-xs">
              {status === "checking" && <span className="text-muted-foreground">Checking…</span>}
              {status === "free" && <span className="text-primary">@{username} is yours.</span>}
              {status === "taken" && <span className="text-destructive">That one is taken.</span>}
              {status === "invalid" && (
                <span className="text-destructive">3–20 letters, numbers, dot or underscore.</span>
              )}
            </p>
          </div>

          <div>
            <Label htmlFor="display">Display name</Label>
            <Input
              id="display"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={40}
              className="mt-1.5 h-12 bg-surface-raised"
              placeholder="What people call you"
            />
          </div>

          <div>
            <Label htmlFor="dob">Date of birth</Label>
            <Input
              id="dob"
              type="date"
              required
              value={birthDate}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setBirthDate(e.target.value)}
              className="mt-1.5 h-12 bg-surface-raised"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {tooYoung
                ? "You need to be 13 or older to use GoHeet."
                : "Only used for age verification. Never shown on your profile."}
            </p>
          </div>

          <Button
            type="submit"
            disabled={status !== "free" || !birthDate || tooYoung || submit.isPending}
            className="ember-fill h-12 w-full rounded-2xl text-base font-semibold text-primary-foreground"
          >
            {submit.isPending ? "Setting up…" : "Enter GoHeet"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/feed"
            className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Not now — take me to the app
          </Link>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Creating a profile means you accept the{" "}
          <Link to="/legal/$doc" params={{ doc: "terms" }} className="underline">
            Terms
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
