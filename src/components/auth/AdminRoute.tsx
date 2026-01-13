import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('[AdminRoute] State:', { 
      user: user?.id, 
      isAdmin, 
      authLoading, 
      adminLoading 
    });

    // CRITICAL: Wait for ALL loading to complete before making any decisions
    if (authLoading || adminLoading) {
      console.log('[AdminRoute] Still loading, waiting...');
      return;
    }

    // Auth check - only redirect if loading is complete AND no user
    if (!authLoading && !user) {
      console.log('[AdminRoute] No user, redirecting to login');
      navigate("/auth/login", { replace: true });
      return;
    }

    // Admin check - only redirect if BOTH loading are complete AND not admin
    if (!authLoading && !adminLoading && user && !isAdmin) {
      console.log('[AdminRoute] User not admin, redirecting to home');
      navigate("/", { replace: true });
      return;
    }

    // Grant access only if we have user AND isAdmin
    if (user && isAdmin) {
      console.log('[AdminRoute] Access granted!');
    }
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  // Show loading screen while checking
  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Vérification des droits d'administrateur...</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Auth: {authLoading ? '⏳' : '✓'} | Admin: {adminLoading ? '⏳' : '✓'}
          </p>
        </div>
      </div>
    );
  }

  // Block access if no user or not admin (after loading complete)
  if (!user || !isAdmin) {
    console.log('[AdminRoute] Blocking access:', { 
      hasUser: !!user, 
      isAdmin,
      authLoading,
      adminLoading 
    });
    return null;
  }

  // Grant access - we have user AND isAdmin AND loading is complete
  console.log('[AdminRoute] Rendering admin content');
  return <>{children}</>;
};
