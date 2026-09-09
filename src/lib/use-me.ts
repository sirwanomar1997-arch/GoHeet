import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMe } from "@/lib/reelzy.functions";

export function useMe() {
  const fetchMe = useServerFn(getMe);
  return useQuery({
    queryKey: ["me"],
    queryFn: () => fetchMe({ data: undefined as never }),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    retry: 2,
    retryDelay: (attempt) => Math.min(400 * 2 ** attempt, 2_000),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}
