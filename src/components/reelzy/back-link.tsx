import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

const CLASS =
  "tap-target grid size-11 shrink-0 touch-manipulation place-items-center rounded-full border border-border bg-surface text-muted-foreground transition-transform active:scale-90";

/**
 * Small round back control used on every sub-page so people are never stuck.
 * Defaults to browser history, falls back to an explicit route.
 */
export function BackLink({ to, label = "Back" }: { to?: string; label?: string }) {
  const router = useRouter();

  if (to) {
    return (
      <Link to={to} preload="intent" aria-label={label} className={CLASS}>
        <ArrowLeft className="size-5" />
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      className={CLASS}
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.history.back();
        } else {
          void router.navigate({ to: "/feed" });
        }
      }}
    >
      <ArrowLeft className="size-5" />
    </button>
  );
}
