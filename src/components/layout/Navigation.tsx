import { Link } from "react-router-dom";
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
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-[1200px]">
      <nav className={cn(
        "flex items-center justify-between",
        "px-6 py-4 gap-2.5",
        "bg-black/20 backdrop-blur-md",
        "rounded-full",
        "border border-white/10",
        // Responsive padding
        "md:px-12 md:py-6"
      )}>
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <Package className="h-6 w-6 text-white" />
          <span className="text-xl font-bold text-[#d6d6d6] whitespace-nowrap">
            kilomeet
          </span>
        </Link>
        
        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-6 flex-1 justify-center">
          <a 
            href="https://kolimeet.framer.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#d6d6d6] hover:text-white transition-all duration-200 text-sm font-medium whitespace-nowrap"
          >
            Accueil
          </a>
          
          <a 
            href="https://kolimeet.framer.ai/services"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#d6d6d6] hover:text-white transition-all duration-200 text-sm font-medium whitespace-nowrap"
          >
            Nos services
          </a>
          
          <a 
            href="https://kolimeet.framer.ai/about-us"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#d6d6d6] hover:text-white transition-all duration-200 text-sm font-medium whitespace-nowrap"
          >
            À propos de nous
          </a>
          
          <a 
            href="https://kolimeet.framer.ai/blog"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#d6d6d6] hover:text-white transition-all duration-200 text-sm font-medium whitespace-nowrap"
          >
            Blog
          </a>
          
          <Link 
            to="/explorer"
            className="text-[#d6d6d6] hover:text-white transition-all duration-200 text-sm font-medium whitespace-nowrap"
          >
            Explorer
          </Link>
          
          {user && (
            <>
              <Link 
                to="/mes-annonces"
                className="text-[#d6d6d6] hover:text-white transition-all duration-200 text-sm font-medium whitespace-nowrap"
              >
                Mes annonces
              </Link>
              <Link 
                to="/messages"
                className="text-[#d6d6d6] hover:text-white transition-all duration-200 text-sm font-medium whitespace-nowrap"
              >
                Messages
              </Link>
            </>
          )}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost"
                  className="text-[#d6d6d6] hover:text-white hover:bg-white/10 transition-all duration-200"
                >
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
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent rounded-full">
                  <Avatar className="h-9 w-9 border-2 border-white/30">
                    <AvatarImage src={profile?.avatar_url} alt="Avatar" />
                    <AvatarFallback className="bg-white/10">
                      <User className="h-5 w-5 text-white" />
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
              <Button 
                variant="outline"
                className="px-6 py-2.5 bg-transparent border border-white/50 rounded-full text-white text-sm font-medium hover:bg-white/10 hover:border-white/80 transition-all duration-300 whitespace-nowrap"
              >
                Créer un compte
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Menu */}
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
