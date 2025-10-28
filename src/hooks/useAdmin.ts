import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        console.log("[useAdmin] No user, setting isAdmin to false");
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      console.log("[useAdmin] Checking admin role for user:", user.id);

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .single();

        console.log("[useAdmin] Query result:", { data, error });

        if (error && error.code !== "PGRST116") {
          console.error("[useAdmin] Error checking admin role:", error);
        }

        const hasAdminRole = !!data;
        console.log("[useAdmin] Setting isAdmin to:", hasAdminRole);
        setIsAdmin(hasAdminRole);
      } catch (error) {
        console.error("[useAdmin] Exception checking admin role:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminRole();
  }, [user]);

  return { isAdmin, loading };
};
