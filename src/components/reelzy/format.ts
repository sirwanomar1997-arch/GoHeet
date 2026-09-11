export function formatCount(n: number): string {
  // Compact counts: 12,8 tn for thousands, 1,3 mn / 27 mn for millions.
  const comma = (v: number) => v.toFixed(1).replace(".", ",").replace(/,0$/, "");
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${comma(n / 1000)} tn`;
  return `${comma(n / 1_000_000)} mn`;
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function dayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const isSameDay = date.toDateString() === today.toDateString();
  if (isSameDay) return "Today";
  const yesterday = new Date(today.getTime() - 86400000);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
