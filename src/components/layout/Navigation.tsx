import { Link, useLocation } from "react-router-dom";
import { Package, User, LogOut, FileText, Plane, MessageSquare, Shield, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MobileMenu } from "./MobileMenu";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const { user, signOut } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [profile, setProfile] = useState<any>(null);
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const isAuthPage = location.pathname.startsWith("/auth/");
  const isTransparentNav = isHomePage || isAuthPage;

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    setProfile(data);
  };

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b",
      isTransparentNav ? "bg-black/30 backdrop-blur-sm border-white/20" : "bg-background"
    )}>
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <Package className={cn("h-6 w-6", isTransparentNav ? "text-white" : "text-primary")} />
          <span className={cn("text-xl font-bold", isTransparentNav ? "text-white" : "text-foreground")}>
            kilomeet
          </span>
        </Link>
        
        <div className="hidden md:flex items-center gap-4">
          <Link to="/explorer">
            <Button 
              variant="ghost" 
              className={cn(
                "font-medium",
                isTransparentNav && "text-white hover:bg-white/20 hover:text-white"
              )}
            >
              Explorer
            </Button>
          </Link>

          {user && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>
                    Publier
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link to="/publier/trajet" className="flex items-center gap-2 cursor-pointer">
                      <Plane className="h-4 w-4" />
                      Publier un trajet
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/publier/colis" className="flex items-center gap-2 cursor-pointer">
                      <Package className="h-4 w-4" />
                      Publier un colis
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Link to="/messages">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className={cn(isTransparentNav && "text-white hover:bg-white/20 hover:text-white")}
                >
                  <MessageSquare className="h-5 w-5" />
                </Button>
              </Link>
            </>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full">
                  <Avatar className="h-9 w-9 border-2 border-primary">
                    <AvatarImage src={profile?.avatar_url} alt="Avatar" />
                    <AvatarFallback className="bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-foreground">
                    {profile?.full_name || "Utilisateur"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user.email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    to="/profil"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <User className="h-4 w-4" />
                    Mon profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    to="/mes-annonces"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <FileText className="h-4 w-4" />
                    Mes annonces
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    to="/mes-reservations"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <CreditCard className="h-4 w-4" />
                    Mes réservations
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    to="/messages"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Messagerie
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        to="/admin"
                        className="flex items-center gap-2 cursor-pointer text-primary"
                      >
                        <Shield className="h-4 w-4" />
                        Administration
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={signOut}
                  className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth/login">
              <Button className="font-medium">
                Connexion
              </Button>
            </Link>
          )}
        </div>

        <MobileMenu 
          user={user} 
          profile={profile} 
          isAdmin={isAdmin} 
          onSignOut={signOut} 
        />
      </nav>
    </header>
  );
};

export default Navigation;
