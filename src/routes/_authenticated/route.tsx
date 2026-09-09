import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

// Cache the signed-in user in memory so moving between pages inside the app
// is instant instead of waiting on an auth lookup for every navigation.
let cachedUser: { user: unknown; at: number } | null = null;
const CACHE_MS = 60_000;

supabase.auth.onAuthStateChange((_event, session) => {
  cachedUser = session?.user ? { user: session.user, at: Date.now() } : null;
});

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    if (cachedUser && Date.now() - cachedUser.at < CACHE_MS) {
      return { user: cachedUser.user as never };
    }
    // Prefer the locally cached session: it is available immediately after
    // sign-in, so the first navigation never lands on a blank screen.
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session?.user) {
      cachedUser = { user: sessionData.session.user, at: Date.now() };
      return { user: sessionData.session.user };
    }

    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) throw redirect({ to: "/auth" });
      cachedUser = { user: data.user, at: Date.now() };
      return { user: data.user };
    } catch (err) {
      if (err && typeof err === "object" && "to" in err) throw err;
      throw redirect({ to: "/auth" });
    }
  },
  component: () => <Outlet />,
});
