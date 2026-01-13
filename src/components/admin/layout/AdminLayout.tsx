import { Outlet } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { useEffect } from "react";
import { useAdmin } from "@/hooks/useAdmin";

export function AdminLayout() {
  const { updateLastLogin } = useAdmin();

  useEffect(() => {
    // Update last login timestamp when admin accesses dashboard
    updateLastLogin();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      
      {/* Main content - offset by sidebar width on desktop */}
      <main className="md:pl-64 min-h-screen">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
