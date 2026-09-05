import { createFileRoute, Link } from "@tanstack/react-router";
import { ReelzyMark, ReelzyWordmark } from "@/components/reelzy/logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Reelzy — Real moments, captured live" },
      {
        name: "description",
        content:
          "Reelzy is a camera-first short video app. Everything you see was captured in the Reelzy camera — no camera roll uploads, no recycled content.",
      },
      { property: "og:title", content: "Reelzy — Real moments, captured live" },
      {
        property: "og:description",
        content: "Real life. Real people. Real moments. Camera-only, by design.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <main className="relative min-h-svh overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-32 size-[420px] rounded-full opacity-25 blur-[90px]"
        style={{ background: "var(--gradient-ember)" }}
      />
      <div className="relative mx-auto flex min-h-svh max-w-lg flex-col px-6 pb-10 pt-10">
        <header className="flex items-center gap-2">
          <ReelzyMark className="size-8" />
          <ReelzyWordmark />
        </header>

        <div className="mt-16 flex-1">
          <p className="data-figure text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
            Camera only · No uploads
          </p>
          <h1 className="mt-5 font-display text-[3.25rem] font-extrabold leading-[0.95] tracking-[-0.045em]">
            Real life.
            <br />
            Real people.
            <br />
            <span className="gradient-text">Real moments.</span>
          </h1>
          <p className="mt-6 max-w-[34ch] text-base leading-relaxed text-muted-foreground">
            Everything on Reelzy is captured here, right now, in the Reelzy camera. Nothing comes
            from your camera roll. Nothing is staged three weeks in advance.
          </p>

          <ul className="mt-10 space-y-4">
            {[
              ["01", "Open the camera", "Capture is the only way in. That's the whole point."],
              ["02", "Keep it light", "A caption, a place, and you're done. No filter treadmill."],
              ["03", "Live as a timeline", "Your profile reads like a life, not a grid of squares."],
            ].map(([n, title, line]) => (
              <li key={n} className="flex gap-4 border-t border-border pt-4">
                <span className="data-figure text-xs text-primary">{n}</span>
                <div>
                  <p className="font-display text-base font-semibold">{title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{line}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12 space-y-3">
          <Link
            to="/auth"
            className="ember-fill tap-target flex w-full items-center justify-center rounded-2xl text-base font-semibold text-primary-foreground"
          >
            Create your account
          </Link>
          <Link
            to="/auth"
            search={{ mode: "signin" }}
            className="tap-target flex w-full items-center justify-center rounded-2xl border border-border text-base font-medium"
          >
            I already have one
          </Link>
          <p className="pt-2 text-center text-xs text-muted-foreground">
            You must be 13 or older. Read our{" "}
            <Link to="/legal/$doc" params={{ doc: "terms" }} className="underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link to="/legal/$doc" params={{ doc: "privacy" }} className="underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
