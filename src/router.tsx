import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  // Defaults tuned for heavy traffic: repeated visits to the same screen reuse
  // what is already loaded instead of firing a fresh request, retries back off
  // so a busy moment never turns into a request storm, and window focus does
  // not refetch everything at once.
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: (failureCount, error) => {
          const message = error instanceof Error ? error.message : "";
          if (/unauthorized|not allowed|forbidden/i.test(message)) return false;
          return failureCount < 2;
        },
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8_000),
      },
      mutations: { retry: 0 },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadDelay: 0,
    defaultPreloadStaleTime: 10_000,
  });

  return router;
};
