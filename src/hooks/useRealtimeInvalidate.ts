import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribes to Supabase Realtime changes on a table and invalidates
 * the given React Query keys automatically on any INSERT / UPDATE / DELETE.
 *
 * @param table      - Supabase table name to watch (e.g. "operations")
 * @param queryKeys  - Array of React Query keys to invalidate on change
 * @param filter     - Optional Supabase realtime filter (e.g. "client_id=eq.abc")
 */
export function useRealtimeInvalidate(table: string, queryKeys: unknown[][], filter?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channelName = `realtime-${table}-${filter ?? "all"}-${Math.random()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          ...(filter ? { filter } : {}),
        },
        () => {
          queryKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, filter]);
}
