import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMe } from "@/lib/use-me";
import { listNotifications } from "@/lib/reelzy.functions";
import { HeetFlame } from "./heet-flame";
import { Button } from "@/components/ui/button";
import { setDemoMode, useDemoMode } from "@/lib/use-demo-mode";

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
 * The GoHeet ledger bar: four quiet destinations around one loud capture key.
 */
export function GoHeetNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data, isLoading, isError } = useMe();
  const username = data?.profile?.username;
  // The capture key only lives on browsing surfaces. Profile and Settings
  // are destination pages — the record button should not appear there.
  const showCapture =
    pathname === "/feed" ||
    pathname === "/discover" ||
    pathname === "/activity";

  const fetchNotifications = useServerFn(listNotifications);
  const { data: notif } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchNotifications({ data: undefined as never }),
    refetchInterval: 45_000,
    staleTime: 20_000,
  });
  const hasUnread = !!notif?.notifications.some((n) => !n.read);

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
      aria-label="GoHeet"
      className="fixed inset-x-0 bottom-0 z-40 px-2"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="nav-dock mx-auto flex h-[76px] max-w-lg items-center justify-between px-3">
        <Link
          to="/feed"
          replace
          className={item(pathname === "/feed", "text-nav-reelz", "nav-glow-reelz")}
          aria-label="Reelz feed"
        >
          <ReelzIcon className="size-8" />
          <span className={spark(pathname === "/feed")} />
        </Link>
        <Link
          to="/discover"
          replace
          className={item(pathname === "/discover", "text-nav-search", "nav-glow-search")}
          aria-label="Search"
        >
          <Search className="size-8" strokeWidth={2.25} />
          <span className={spark(pathname === "/discover")} />
        </Link>

        {showCapture ? (
          <Link
            to="/camera"
            replace
            aria-label="Open the GoHeet camera"
            className="capture-key group relative mx-0.5 grid size-16 shrink-0 place-items-center rounded-full transition-transform duration-200 active:scale-90"
          >
            <span className="absolute -inset-1 rounded-full bg-ember opacity-30 blur-lg transition-opacity duration-500 group-active:opacity-50" />
            <span className="capture-face relative grid size-full place-items-center overflow-hidden rounded-full">
              <svg className="size-7 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 4v16M4 12h16" />
              </svg>
              <span className="capture-shine pointer-events-none absolute inset-x-2 top-1 h-5 rounded-full" />
              <span className="pointer-events-none absolute inset-0.5 rounded-full border border-foreground/20" />
            </span>
          </Link>
        ) : null}

        <Link
          to="/activity"
          replace
          className={`group relative grid size-14 place-items-center rounded-2xl transition-all duration-300 active:scale-90 ${
            pathname === "/activity" ? "scale-105 opacity-100" : "opacity-75"
          }`}
          aria-label={hasUnread ? "New activity" : "Notifications and messages"}
        >
          <HeetFlame
            className={`size-8 ${hasUnread ? "animate-heet-flicker" : "animate-heet-shimmer"}`}
            glow={pathname === "/activity" || hasUnread}
          />
          {hasUnread ? (
            <span className="absolute right-3 top-2.5 size-2 rounded-full bg-[#FF2D8A] shadow-[0_0_8px_#FF2D8A]" />
          ) : null}
          <span className={`${spark(pathname === "/activity")} text-nav-pulse`} />
        </Link>
        {username ? (
          <Link
            to="/u/$username"
            params={{ username }}
            replace
            className={item(pathname.startsWith("/u/"), "text-nav-profile", "nav-glow-profile")}
            aria-label="Your profile"
          >
            <ProfileIcon className="size-8" />
            <span className={spark(pathname.startsWith("/u/"))} />
          </Link>
        ) : !isLoading && !isError ? (
          <Link
            to="/onboarding"
            replace
            className={item(pathname === "/onboarding", "text-nav-profile", "nav-glow-profile")}
            aria-label="Finish your profile"
          >
            <ProfileIcon className="size-8" />
            <span className={spark(pathname === "/onboarding")} />
          </Link>
        ) : (
          <span
            className={item(false, "text-nav-profile", "nav-glow-profile")}
            aria-label="Loading your profile"
          >
            <ProfileIcon className="size-8 animate-pulse" />
          </span>
        )}
      </div>
    </nav>
  );
}


/**
 * Swipe is a two-stop shuttle: Home feed <-> your own profile, nothing else.
 * Discover, Activity and every other surface are tap-only, and a swipe there
 * is swallowed so it can never walk backwards through history either.
 */
function useSwipeNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { data } = useMe();
  const username = data?.profile?.username;
  const touch = useRef<{ x: number; y: number; t: number } | null>(null);

  const onFeed = pathname === "/feed";
  const onOwnProfile = !!username && pathname === `/u/${username}`;
  const enabled = onFeed || onOwnProfile;

  return {
    onTouchStart: (e: React.TouchEvent) => {
      if (!enabled) {
        touch.current = null;
        return;
      }
      if (e.touches.length !== 1) {
        touch.current = null;
        return;
      }
      const t = e.touches[0];
      if (t) touch.current = { x: t.clientX, y: t.clientY, t: Date.now() };
    },
    onTouchEnd: (e: React.TouchEvent) => {
      const start = touch.current;
      touch.current = null;
      if (!enabled || !start || !username) return;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      // Must be a deliberate, mostly-horizontal flick.
      if (Date.now() - start.t > 800) return;
      if (Math.abs(dx) < 90 || Math.abs(dx) < Math.abs(dy) * 1.5) return;

      // Home swipes left to the profile; profile swipes right back home.
      if (onFeed && dx < 0) {
        void navigate({ to: "/u/$username", params: { username }, replace: true });
        return;
      }
      if (onOwnProfile && dx > 0) {
        void navigate({ to: "/feed", replace: true });
      }
    },
  };
}

export function AppShell({ children, hideNav = false }: { children: React.ReactNode; hideNav?: boolean }) {
  const swipe = useSwipeNav();
  const demo = useDemoMode();
  return (
    <div
      className={`min-h-screen touch-pan-y overscroll-none bg-background ${hideNav ? "pb-10" : "pb-24"}`}
      onTouchStart={swipe.onTouchStart}
      onTouchEnd={swipe.onTouchEnd}
    >
      <div className="mx-auto max-w-lg">{children}</div>
      {demo ? (
        <Button
          type="button"
          size="sm"
          onClick={() => setDemoMode(false)}
          className="fixed right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-[80] shadow-lg"
          translate="no"
          data-no-translate
        >
          Exit demo
        </Button>
      ) : null}
      {hideNav ? null : <GoHeetNav />}
    </div>
  );
}
