import { Link, useRouterState } from "@tanstack/react-router";
import { Compass, Layers, Bell, User } from "lucide-react";
import { useMe } from "@/lib/use-me";

/**
 * The Reelzy ledger bar: four quiet destinations around one loud capture key.
 * The camera is the only thing in the product that gets the ember gradient.
 */
export function ReelzyNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data } = useMe();
  const username = data?.profile?.username;

  const item = (active: boolean) =>
    `group relative flex flex-col items-center justify-center gap-1 tap-target flex-1 transition-colors duration-200 ${
      active ? "text-foreground" : "text-muted-foreground hover:text-foreground/80"
    }`;

  const dot = (active: boolean) =>
    `absolute -top-0.5 h-[3px] w-5 rounded-full transition-all duration-300 ${
      active ? "ember-fill opacity-100" : "opacity-0"
    }`;

  return (
    <nav
      aria-label="Reelzy"
      className="hairline-top fixed inset-x-0 bottom-0 z-40 bg-background/80 backdrop-blur-2xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-lg items-end px-3 pb-2 pt-2.5">
        <Link to="/feed" className={item(pathname === "/feed")} aria-label="Feed">
          <span className={dot(pathname === "/feed")} />
          <Layers className="size-5" strokeWidth={pathname === "/feed" ? 2.4 : 1.7} />
          <span className="text-[10px] font-medium tracking-tight">Feed</span>
        </Link>
        <Link to="/discover" className={item(pathname === "/discover")} aria-label="Discover people">
          <span className={dot(pathname === "/discover")} />
          <Compass className="size-5" strokeWidth={pathname === "/discover" ? 2.4 : 1.7} />
          <span className="text-[10px] font-medium tracking-tight">Find</span>
        </Link>

        <Link
          to="/camera"
          aria-label="Open the Reelzy camera"
          className="ember-fill key-glow mx-2 -mt-8 flex size-[68px] shrink-0 items-center justify-center rounded-[28px] transition-transform duration-200 active:scale-90"
        >
          <span className="grid size-8 place-items-center rounded-full border-[3px] border-primary-foreground/85">
            <span className="size-2 rounded-full bg-primary-foreground/85" />
          </span>
        </Link>

        <Link to="/activity" className={item(pathname === "/activity")} aria-label="Activity">
          <span className={dot(pathname === "/activity")} />
          <Bell className="size-5" strokeWidth={pathname === "/activity" ? 2.4 : 1.7} />
          <span className="text-[10px] font-medium tracking-tight">Pulse</span>
        </Link>
        {username ? (
          <Link
            to="/u/$username"
            params={{ username }}
            className={item(pathname.startsWith("/u/"))}
            aria-label="Your profile"
          >
            <span className={dot(pathname.startsWith("/u/"))} />
            <User className="size-5" strokeWidth={pathname.startsWith("/u/") ? 2.4 : 1.7} />
            <span className="text-[10px] font-medium tracking-tight">You</span>
          </Link>
        ) : (
          <span className={item(false)}>
            <User className="size-5" strokeWidth={1.7} />
            <span className="text-[10px] font-medium tracking-tight">You</span>
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
