// GoHeet brand mark + wordmark.
// The mark is a rounded "G" with a play triangle in its opening and a
// small flame at the top-right, carrying the ember gradient.

export function GoHeetMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="GoHeet">
      <defs>
        <linearGradient id="goheet-ember" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFD300" />
          <stop offset="52%" stopColor="#FF7A00" />
          <stop offset="100%" stopColor="#FF2A68" />
        </linearGradient>
      </defs>

      {/* depth bars on the left contour */}
      <rect x="9" y="14" width="8" height="36" rx="4" fill="url(#goheet-ember)" opacity="0.45" />
      <rect x="12" y="11" width="8" height="42" rx="4" fill="url(#goheet-ember)" opacity="0.7" />

      {/* main G ring */}
      <path
        d="M32 8a24 24 0 1 0 0 48 24 24 0 0 0 18-7.3v-13a1 1 0 0 0-1.7-.7A16 16 0 1 1 40 17v13h-9a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h18v6.4A24 24 0 0 0 32 8Z"
        fill="url(#goheet-ember)"
      />

      {/* play triangle inside the opening */}
      <path d="M44 24.5 52 31l-8 6.5z" fill="#0a0a0a" opacity="0.92" />

      {/* flame at top-right */}
      <path
        d="M52 4.5c2.4 1.6 3.1 4.3 2 7-.9 2.2-2.8 3.2-2.4 5.4.2 1.2 1 2 1.6 2.4-3 .1-5-2-5.4-4.6-.5-3.4 1.6-5.4 2.6-7.4.6-1.2.4-2.2 1.6-2.8Z"
        fill="url(#goheet-ember)"
      />
    </svg>
  );
}

export function GoHeetWordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-display text-xl font-extrabold tracking-[-0.04em] ${className}`}
      data-no-translate
      translate="no"
    >
      <span className="ember-text">Go</span>
      <span className="text-foreground">Heet</span>
    </span>
  );
}
