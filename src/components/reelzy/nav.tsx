import { Link, useRouterState } from "@tanstack/react-router";
import { Search } from "lucide-react";
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

function PaperPlaneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M27.6 4.7 4.9 13.2c-1.4.5-1.4 2.4.1 2.8l8.5 2.4 2.4 8.5c.4 1.5 2.3 1.5 2.8.1l8.5-22.7c.1-.3-.2-.5-.5-.4L12.8 17.8"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
          className="capture-orbit mx-1 -mt-11 grid size-[86px] shrink-0 place-items-center rounded-full transition-transform duration-200 active:scale-90"
        >
          <span className="capture-face grid size-[70px] place-items-center rounded-full">
            <span className="grid size-11 place-items-center rounded-full border-[3px] border-primary-foreground/90">
              <span className="size-4 rounded-full bg-primary-foreground/90" />
            </span>
          </span>
        </Link>

        <Link
          to="/activity"
          className={item(pathname === "/activity", "text-nav-pulse", "nav-glow-pulse")}
          aria-label="Notifications and messages"
        >
          <PaperPlaneIcon className="size-8" />
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
          <span className={item(false, "text-nav-profile", "nav-glow-profile")} aria-label="Profile">
            <ProfileIcon className="size-8" />
          </span>
        )}
      </div>
    </nav>
  );
}


export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-lg">{children}</div>
      <ReelzyNav />
    </div>
  );
}
