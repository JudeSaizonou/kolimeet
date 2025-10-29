import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useAdmin = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkAdminRole = async () => {
      const timestamp = new Date().toISOString();
      const isDev = import.meta.env.DEV;
      
      if (isDev) console.log(`[useAdmin][${timestamp}] Starting admin check`);
      
      // Wait for auth to finish loading first
      if (authLoading) {
        if (isDev) console.log(`[useAdmin][${timestamp}] Auth still loading, waiting...`);
        return; // Don't do anything while auth is loading
      }
      
      // Now auth is done - check if user exists
      if (!user) {
        if (isDev) console.log(`[useAdmin][${timestamp}] No user after auth complete, setting isAdmin to false`);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      if (isDev) console.log(`[useAdmin][${timestamp}] User found:`, user.id);

      try {
        if (isDev) console.log(`[useAdmin][${timestamp}] Calling is_user_admin function for user:`, user.id);
        
        const { data, error } = await supabase
          .rpc("is_user_admin", { user_uuid: user.id });

        if (isDev) console.log(`[useAdmin][${timestamp}] RPC response:`, { data, error });

        if (!isMounted) {
          if (isDev) console.log(`[useAdmin][${timestamp}] Component unmounted, skipping state update`);
          return;
        }

        if (error) {
          console.error(`[useAdmin][${timestamp}] Error checking admin role:`, error);
          setIsAdmin(false);
        } else {
          const hasAdminRole = data === true;
          if (isDev) console.log(`[useAdmin][${timestamp}] Admin status:`, hasAdminRole);
          setIsAdmin(hasAdminRole);
        }
      } catch (error) {
        console.error(`[useAdmin][${timestamp}] Exception checking admin role:`, error);
        if (isMounted) {
          setIsAdmin(false);
        }
      } finally {
        if (isMounted) {
          if (isDev) console.log(`[useAdmin][${timestamp}] Setting loading to false`);
          setLoading(false);
        }
      }
    };

    checkAdminRole();

    return () => {
      isMounted = false;
    };
  }, [user, authLoading]); // 🔧 FIX: Also depend on authLoading

  // Keep loading true while auth is loading
  const actualLoading = authLoading || loading;
  
  // Only log in development
  if (import.meta.env.DEV) {
    console.log(`[useAdmin] Current state:`, { 
      isAdmin, 
      loading: actualLoading, 
      authLoading, 
      adminLoading: loading,
      user: user?.id 
    });
  }

  return { isAdmin, loading: actualLoading };
};
