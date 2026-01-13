import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Package,
  Flag,
  MessageSquare,
  BarChart3,
  Settings,
  FileText,
  LogOut,
} from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  icon: React.ElementType;
  label: string;
  to: string;
  badge?: number;
  requiresRole?: string[];
}

const navigationItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/admin" },
  { icon: Users, label: "Utilisateurs", to: "/admin/users" },
  { icon: Package, label: "Contenu", to: "/admin/content" },
  { icon: Flag, label: "Signalements", to: "/admin/flags" },
  { icon: MessageSquare, label: "Support", to: "/admin/support" },
  { icon: BarChart3, label: "Analytics", to: "/admin/analytics" },
  { icon: Settings, label: "Paramètres", to: "/admin/settings", requiresRole: ["super_admin"] },
  { icon: FileText, label: "Logs", to: "/admin/logs" },
];

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { adminData, getRoleLabel } = useAdmin();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const initials = adminData
    ? user?.email?.slice(0, 2).toUpperCase() || "AD"
    : "AD";

  return (
    <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 bg-slate-900 text-white">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold">
          K
        </div>
        <div>
          <h1 className="font-bold text-lg">Kolimeet</h1>
          <p className="text-xs text-slate-400">Admin</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          // Check role requirements
          if (item.requiresRole && adminData) {
            const hasRequiredRole = item.requiresRole.includes(adminData.role);
            if (!hasRequiredRole && adminData.role !== "super_admin") {
              return null; // Hide if doesn't have role (super_admin sees all)
            }
          }

          const Icon = item.icon;
          const active = isActive(item.to);

          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-rose-600 text-white hover:bg-rose-700 ml-auto"
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.email}</p>
            <p className="text-xs text-slate-400">{getRoleLabel()}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Déconnexion
        </Button>
      </div>
    </aside>
  );
}
