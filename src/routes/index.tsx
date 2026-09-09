import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

// The OAuth broker (oauth.lovable.app) returns here with the session in the URL
// hash after Apple/Google sign-in. supabase-js recovers it asynchronously, so
// getSession() can race and report no session on the first call. When a session
// hash is present, wait for the auth state to settle before deciding where to go.
function waitForSessionFromUrl(timeoutMs = 4000): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(ok);
    };
    const timer = setTimeout(() => done(false), timeoutMs);
    const cleanup = () => {
      clearTimeout(timer);
      try {
        subscription.unsubscribe();
      } catch {
        /* noop */
      }
    };
    const subscription = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) done(true);
    });
    // Also poll in case the state change fired before we subscribed.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) done(true);
    });
  });
}

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    const hasSessionInUrl =
      typeof window !== "undefined" &&
      (window.location.hash.includes("access_token") ||
        window.location.hash.includes("refresh_token") ||
        window.location.search.includes("code="));

    if (hasSessionInUrl) {
      const ok = await waitForSessionFromUrl();
      if (ok) throw redirect({ to: "/feed" });
    }

    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/feed" });
    throw redirect({ to: "/auth" });
  },
  component: () => null,
});
