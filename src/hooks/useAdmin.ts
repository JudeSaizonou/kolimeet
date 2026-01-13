import { useState, useEffect, useMemo } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { AdminUser, AdminRole } from "@/integrations/supabase/types";

export function useAdmin() {
  const { user, loading: authLoading } = useAuth(); // ← Récupérer authLoading
  const [adminData, setAdminData] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[useAdmin] Effect triggered:', { 
      userId: user?.id, 
      userEmail: user?.email,
      authLoading
    });
    
    // Wait for auth to finish loading
    if (authLoading) {
      console.log('[useAdmin] Auth still loading, waiting...');
      return;
    }
    
    if (!user) {
      console.log('[useAdmin] No user after auth loaded, clearing admin data');
      setAdminData(null);
      setLoading(false);
      return;
    }

    fetchAdminData();
  }, [user, authLoading]); // ← Ajouter authLoading aux dépendances

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[useAdmin] Fetching admin data for user:', user!.id);

      const { data, error: fetchError } = await supabase
        .from("admin_users")
        .select("*")
        .eq("user_id", user!.id)
        .eq("is_active", true)
        .single();

      console.log('[useAdmin] Query result:', { 
        data, 
        error: fetchError,
        hasData: !!data 
      });

      if (fetchError) {
        if (fetchError.code === "PGRST116") {
          // No admin record found
          console.warn('[useAdmin] No admin record found (PGRST116)');
          setAdminData(null);
          setLoading(false);
        } else {
          console.error('[useAdmin] Query error:', fetchError);
          setError(fetchError.message);
          setAdminData(null);
          setLoading(false);
          throw fetchError;
        }
      } else {
        console.log('[useAdmin] Admin data loaded:', {
          role: data.role,
          is_active: data.is_active,
          hasPermissions: !!data.permissions
        });
        setAdminData(data as AdminUser);
        setLoading(false);
      }
    } catch (err: any) {
      console.error("[useAdmin] Error fetching admin data:", err);
      setError(err.message);
      setAdminData(null);
      setLoading(false);
    }
    
    console.log('[useAdmin] Fetch complete');
  };

  /**
   * Check if current user is an admin (any role)
   * Using useMemo to ensure reactive updates when adminData changes
   */
  const isAdminValue = useMemo(() => {
    const result = adminData !== null && adminData?.is_active === true;
    console.log('[useAdmin] isAdmin computed:', { 
      hasAdminData: !!adminData, 
      is_active: adminData?.is_active,
      result 
    });
    return result;
  }, [adminData]);

  /**
   * Check if current user has a specific admin role
   */
  const hasRole = (role: AdminRole): boolean => {
    if (!adminData) return false;
    
    // super_admin has all roles
    if (adminData.role === "super_admin") return true;
    
    return adminData.role === role;
  };

  /**
   * Check if current user has any of the specified roles
   */
  const hasAnyRole = (roles: AdminRole[]): boolean => {
    if (!adminData) return false;
    
    // super_admin has all roles
    if (adminData.role === "super_admin") return true;
    
    return roles.includes(adminData.role);
  };

  /**
   * Check if current user has a specific permission
   */
  const hasPermission = (section: string, action: string): boolean => {
    if (!adminData || !adminData.permissions) return false;
    
    // super_admin has all permissions
    if (adminData.role === "super_admin") return true;
    
    const sectionPermissions = adminData.permissions[section as keyof typeof adminData.permissions];
    if (!sectionPermissions) return false;
    
    return sectionPermissions.includes(action);
  };

  /**
   * Check if user can manage users (ban, suspend, etc.)
   */
  const canManageUsers = (): boolean => {
    return hasAnyRole(["super_admin", "moderator"]);
  };

  /**
   * Check if user can manage content (delete trips/parcels)
   */
  const canManageContent = (): boolean => {
    return hasAnyRole(["super_admin", "moderator"]);
  };

  /**
   * Check if user can resolve flags
   */
  const canResolveFlags = (): boolean => {
    return hasAnyRole(["super_admin", "moderator"]);
  };

  /**
   * Check if user can view analytics
   */
  const canViewAnalytics = (): boolean => {
    return isAdmin(); // All admins can view analytics
  };

  /**
   * Check if user can modify settings
   */
  const canModifySettings = (): boolean => {
    return hasRole("super_admin"); // Only super_admin
  };

  /**
   * Check if user can manage other admins
   */
  const canManageAdmins = (): boolean => {
    return hasRole("super_admin"); // Only super_admin
  };

  /**
   * Get current admin user data
   */
  const getCurrentAdmin = (): AdminUser | null => {
    return adminData;
  };

  /**
   * Get admin role label
   */
  const getRoleLabel = (role?: AdminRole): string => {
    const roleLabels: Record<AdminRole, string> = {
      super_admin: "Super Admin",
      moderator: "Modérateur",
      support: "Support",
      analyst: "Analyste",
    };
    return roleLabels[role || adminData?.role || "support"];
  };

  /**
   * Update last login timestamp
   */
  const updateLastLogin = async () => {
    if (!adminData) return;

    try {
      await supabase
        .from("admin_users")
        .update({ last_login: new Date().toISOString() })
        .eq("user_id", user!.id);
    } catch (err) {
      console.error("Error updating last login:", err);
    }
  };

  return {
    adminData,
    loading,
    error,
    isAdmin: isAdminValue, // Return memoized boolean value
    hasRole,
    hasAnyRole,
    hasPermission,
    canManageUsers,
    canManageContent,
    canResolveFlags,
    canViewAnalytics,
    canModifySettings,
    canManageAdmins,
    getCurrentAdmin,
    getRoleLabel,
    updateLastLogin,
    refetch: fetchAdminData,
  };
}

