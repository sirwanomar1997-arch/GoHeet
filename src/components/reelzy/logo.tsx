export function ReelzyMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Reelzy">
      <defs>
        <linearGradient id="reelzy-ember" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.82 0.17 72)" />
          <stop offset="100%" stopColor="oklch(0.62 0.238 20)" />
        </linearGradient>
      </defs>
      <path
        d="M14 10h20a16 16 0 0 1 3.2 31.7L50 54h-13L26 40v13a1 1 0 0 1-1.6.8L14 46V10Zm12 10v12h8a6 6 0 0 0 0-12h-8Z"
        fill="url(#reelzy-ember)"
      />
      <circle cx="53" cy="14" r="5" fill="oklch(0.62 0.238 20)" />
    </svg>
  );
}

export function ReelzyWordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-display text-xl font-extrabold uppercase tracking-[-0.04em] ${className}`}
    >
      Reelzy
    </span>
  );
}
