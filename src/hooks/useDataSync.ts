import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface DataSyncOptions {
  queryKeys?: string[];
  onSync?: () => void;
}

/**
 * Hook to force data synchronization when coming back online
 * or when specific events occur
 */
export const useDataSync = (options: DataSyncOptions = {}) => {
  const queryClient = useQueryClient();
  const { queryKeys = [], onSync } = options;

  // Sync when coming back online
  useEffect(() => {
    const handleOnline = () => {
      if (import.meta.env.DEV) {
        console.log('[DataSync] Back online, refreshing data...');
      }
      
      if (queryKeys.length > 0) {
        queryKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });
      } else {
        // Refresh all queries
        queryClient.invalidateQueries();
      }

      onSync?.();
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [queryClient, queryKeys, onSync]);

  // Manual sync function
  const syncNow = () => {
    if (queryKeys.length > 0) {
      queryKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
    } else {
      queryClient.invalidateQueries();
    }
    onSync?.();
  };

  return { syncNow };
};