import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type TableName = 'trips' | 'parcels' | 'profiles' | 'reviews' | 'messages' | 'flags';

interface RealTimeConfig {
  tables: TableName[];
  onUpdate?: (table: string, payload: any) => void;
  showNotifications?: boolean;
}

export const useRealTimeUpdates = (config: RealTimeConfig) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleRealTimeUpdate = useCallback((table: string, payload: any) => {
    const isDev = import.meta.env.DEV;
    if (isDev) console.log(`[RealTime] ${table} updated:`, payload);

    // Invalidate relevant queries
    queryClient.invalidateQueries({ queryKey: [table] });
    
    // Invalidate related queries based on table
    switch (table) {
      case 'trips':
      case 'parcels':
        queryClient.invalidateQueries({ queryKey: ['listings'] });
        queryClient.invalidateQueries({ queryKey: ['search'] });
        queryClient.invalidateQueries({ queryKey: ['myListings'] });
        queryClient.invalidateQueries({ queryKey: ['explorer'] });
        break;
      case 'profiles':
        queryClient.invalidateQueries({ queryKey: ['users'] });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        break;
      case 'reviews':
        queryClient.invalidateQueries({ queryKey: ['reviews'] });
        queryClient.invalidateQueries({ queryKey: ['userRating'] });
        break;
      case 'messages':
        queryClient.invalidateQueries({ queryKey: ['messages'] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        queryClient.invalidateQueries({ queryKey: ['threads'] });
        break;
      case 'flags':
        queryClient.invalidateQueries({ queryKey: ['flags'] });
        break;
    }

    // Show notification if enabled and it's a deletion
    if (config.showNotifications && payload.eventType === 'DELETE') {
      const notifications = {
        trips: "Un trajet a été supprimé",
        parcels: "Un colis a été supprimé", 
        profiles: "Un utilisateur a été modéré",
        reviews: "Un avis a été supprimé",
        messages: "Un message a été supprimé",
        flags: "Un signalement a été traité"
      };

      toast({
        title: "Mise à jour",
        description: notifications[table as TableName] || "Contenu mis à jour",
        duration: 3000,
      });
    }

    // Call custom handler
    config.onUpdate?.(table, payload);
  }, [queryClient, config, toast]);

  useEffect(() => {
    if (!config.tables.length) return;

    const subscriptions = config.tables.map(table => {
      return supabase
        .channel(`${table}_changes`)
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: table 
          },
          (payload) => handleRealTimeUpdate(table, payload)
        )
        .subscribe();
    });

    if (import.meta.env.DEV) {
      console.log(`[RealTime] Subscribed to updates for:`, config.tables);
    }

    return () => {
      subscriptions.forEach(subscription => {
        supabase.removeChannel(subscription);
      });
      if (import.meta.env.DEV) {
        console.log(`[RealTime] Unsubscribed from updates`);
      }
    };
  }, [config.tables, handleRealTimeUpdate]);
};