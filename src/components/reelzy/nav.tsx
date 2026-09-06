import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Search, Heart } from "lucide-react";
import { useRef } from "react";
import { useMe } from "@/lib/use-me";

function ReelzIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="4" y="5" width="10" height="9" rx="2.5" stroke="currentColor" strokeWidth="2.5" />
      <rect x="18" y="5" width="10" height="9" rx="2.5" stroke="currentColor" strokeWidth="2.5" />
      <rect x="4" y="18" width="10" height="9" rx="2.5" stroke="currentColor" strokeWidth="2.5" />
      <path d="m20 19.5 7 3.5-7 3.5v-7Z" fill="currentColor" />
    </svg>
  );
}


function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="10.5" r="5.5" stroke="currentColor" strokeWidth="2.5" />
      <path
        d="M6.5 27c.8-5.2 4.1-8 9.5-8s8.7 2.8 9.5 8"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * The Reelzy ledger bar: four quiet destinations around one loud capture key.
 * The camera is the only thing in the product that gets the ember gradient.
 */
export function ReelzyNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data } = useMe();
  const username = data?.profile?.username;

  const item = (active: boolean, color: string, glow: string) =>
    `group relative grid size-14 place-items-center rounded-2xl transition-all duration-300 active:scale-90 ${color} ${
      active ? `${glow} scale-105 opacity-100` : "opacity-65"
    }`;

  const spark = (active: boolean) =>
    `absolute -bottom-0.5 h-1 w-1 rounded-full bg-current transition-all duration-300 ${
      active ? "scale-100 opacity-100" : "scale-0 opacity-0"
    }`;

  return (
    <nav
      aria-label="Reelzy"
      className="fixed inset-x-0 bottom-0 z-40 px-2"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="nav-dock mx-auto flex h-[76px] max-w-lg items-center justify-between px-3">
        <Link
          to="/feed"
          className={item(pathname === "/feed", "text-nav-reelz", "nav-glow-reelz")}
          aria-label="Reelz feed"
        >
          <ReelzIcon className="size-8" />
          <span className={spark(pathname === "/feed")} />
        </Link>
        <Link
          to="/discover"
          className={item(pathname === "/discover", "text-nav-search", "nav-glow-search")}
          aria-label="Search"
        >
          <Search className="size-8" strokeWidth={2.25} />
          <span className={spark(pathname === "/discover")} />
        </Link>

        <Link
          to="/camera"
          aria-label="Open the Reelzy camera"
          className="capture-key group relative mx-0.5 grid size-14 shrink-0 place-items-center rounded-2xl transition-transform duration-200 active:scale-90"
        >
          <span className="absolute inset-0 rounded-2xl bg-orange-600 opacity-20 blur-md transition-opacity duration-500 group-active:opacity-40" />
          <span className="capture-disc relative grid size-full place-items-center overflow-hidden rounded-2xl">
            <svg className="size-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 4v16M4 12h16" />
            </svg>
            <span className="capture-bevel pointer-events-none absolute inset-0.5 rounded-[14px] border border-white/20" />
          </span>
        </Link>

        <Link
          to="/activity"
          className={item(pathname === "/activity", "text-nav-pulse", "nav-glow-pulse")}
          aria-label="Notifications and messages"
        >
          <Heart className="size-8" strokeWidth={2.25} />
          <span className={spark(pathname === "/activity")} />
        </Link>
        {username ? (
          <Link
            to="/u/$username"
            params={{ username }}
            className={item(pathname.startsWith("/u/"), "text-nav-profile", "nav-glow-profile")}
            aria-label="Your profile"
          >
            <ProfileIcon className="size-8" />
            <span className={spark(pathname.startsWith("/u/"))} />
          </Link>
        ) : (
          <Link
            to="/onboarding"
            className={item(pathname === "/onboarding", "text-nav-profile", "nav-glow-profile")}
            aria-label="Finish your profile"
          >
            <ProfileIcon className="size-8" />
            <span className={spark(pathname === "/onboarding")} />
          </Link>
        )}
      </div>
    </nav>
  );
}


/** Swipeable destinations, left → right. Camera stays tap-only (it needs the screen). */
function useSwipeNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { data } = useMe();
  const username = data?.profile?.username;
  const touch = useRef<{ x: number; y: number } | null>(null);

  const routes: string[] = username
    ? ["/feed", "/discover", "/activity", `/u/${username}`]
    : ["/feed", "/discover", "/activity"];
  const index = routes.findIndex((r) =>
    r.startsWith("/u/") ? pathname.startsWith("/u/") : pathname === r,
  );

  return {
    onTouchStart: (e: React.TouchEvent) => {
      const t = e.touches[0];
      if (t) touch.current = { x: t.clientX, y: t.clientY };
    },
    onTouchEnd: (e: React.TouchEvent) => {
      const start = touch.current;
      touch.current = null;
      const t = e.changedTouches[0];
      if (!start || !t || index === -1) return;
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      if (Math.abs(dx) < 90 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      const next = dx < 0 ? routes[index + 1] : routes[index - 1];
      if (next) void navigate({ to: next });
    },
  };
}

export function AppShell({ children, hideNav = false }: { children: React.ReactNode; hideNav?: boolean }) {
  const swipe = useSwipeNav();
  return (
    <div
      className={`min-h-screen bg-background ${hideNav ? "pb-10" : "pb-24"}`}
      onTouchStart={swipe.onTouchStart}
      onTouchEnd={swipe.onTouchEnd}
    >
      <div className="mx-auto max-w-lg">{children}</div>
      {hideNav ? null : <ReelzyNav />}
    </div>
  );
}
