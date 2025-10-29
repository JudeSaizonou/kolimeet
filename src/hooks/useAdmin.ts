import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkAdminRole = async () => {
      const timestamp = new Date().toISOString();
      console.log(`[useAdmin][${timestamp}] Starting admin check`);
      
      // Wait for auth to be ready
      if (!user) {
        console.log(`[useAdmin][${timestamp}] No user, setting isAdmin to false`);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      console.log(`[useAdmin][${timestamp}] User found:`, user.id);

      try {
        // Use the new SECURITY DEFINER function to bypass RLS
        console.log(`[useAdmin][${timestamp}] Calling is_user_admin function for user:`, user.id);
        
        const { data, error } = await supabase
          .rpc("is_user_admin", { user_uuid: user.id });

        console.log(`[useAdmin][${timestamp}] RPC response:`, { data, error });

        if (!isMounted) {
          console.log(`[useAdmin][${timestamp}] Component unmounted, skipping state update`);
          return;
        }

        if (error) {
          console.error(`[useAdmin][${timestamp}] Error checking admin role:`, error);
          setIsAdmin(false);
        } else {
          const hasAdminRole = data === true;
          console.log(`[useAdmin][${timestamp}] Admin status:`, hasAdminRole);
          setIsAdmin(hasAdminRole);
        }
      } catch (error) {
        console.error(`[useAdmin][${timestamp}] Exception checking admin role:`, error);
        if (isMounted) {
          setIsAdmin(false);
        }
      } finally {
        if (isMounted) {
          console.log(`[useAdmin][${timestamp}] Setting loading to false`);
          setLoading(false);
        }
      }
    };

    checkAdminRole();

    return () => {
      isMounted = false;
    };
  }, [user]);

  return { isAdmin, loading };
};
