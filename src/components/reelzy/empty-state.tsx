import type { ReactNode } from "react";

export function EmptyState({
  title,
  line,
  action,
}: {
  title: string;
  line?: string;
  action?: ReactNode;
}) {
  return (
    <div className="animate-rise flex flex-col items-center px-8 py-16 text-center">
      <div className="ember-fill mb-5 h-px w-14 opacity-70" />
      <h2 className="font-display text-2xl font-semibold text-foreground">{title}</h2>
      {line ? <p className="mt-2 max-w-[28ch] text-sm text-muted-foreground">{line}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function LoadingRail({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16" role="status" aria-live="polite">
      <span className="ember-fill animate-ember-pulse size-2 rounded-full" />
      <span className="data-figure text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
