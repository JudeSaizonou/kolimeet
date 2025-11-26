import { Link, useNavigate, useLocation } from "react-router-dom";
import { Package, User, LogOut, FileText, Plane, MessageSquare, Shield, CreditCard, Heart } from "lucide-react";
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
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MobileMenu } from "./MobileMenu";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const { user, signOut } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { unreadCount } = useUnreadCount();
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Masquer la navbar sur mobile quand on est dans une conversation
  const isInConversation = location.pathname.startsWith('/messages/') && location.pathname !== '/messages';
  const shouldHideOnMobile = isInConversation;

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
      "fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-[1200px]",
      shouldHideOnMobile && "hidden md:block"
    )}>
      <nav className={cn(
        "flex items-center justify-between",
        "px-6 py-4 gap-2.5",
        "bg-black/50 backdrop-blur-md",
        "rounded-full",
        "border border-white/20",
        "shadow-lg shadow-black/10",
        // Responsive padding
        "md:px-12 md:py-6"
      )}>
        {/* Logo */}
        {user ? (
          <Link to="/explorer" className="flex items-center gap-2 flex-shrink-0">
            <Package className="h-6 w-6 text-white" />
            <span className="text-xl font-bold text-[#d6d6d6] whitespace-nowrap">
              kilomeet
            </span>
          </Link>
        ) : (
          <a 
            href="https://kolimeet.framer.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 flex-shrink-0"
          >
            <Package className="h-6 w-6 text-white" />
            <span className="text-xl font-bold text-[#d6d6d6] whitespace-nowrap">
              kilomeet
            </span>
          </a>
        )}
        
        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-[30px] flex-1 justify-center" style={{ fontFamily: 'Figtree' }}>
          <a 
            href="https://kolimeet.framer.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#d6d6d6] hover:text-white transition-all duration-200 text-base font-medium whitespace-nowrap"
          >
            Accueil
          </a>
          
          {!user && (
            <>
              <a 
                href="https://kolimeet.framer.ai/services"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#d6d6d6] hover:text-white transition-all duration-200 text-base font-medium whitespace-nowrap"
              >
                Nos services
              </a>
              
              <a 
                href="https://kolimeet.framer.ai/about-us"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#d6d6d6] hover:text-white transition-all duration-200 text-base font-medium whitespace-nowrap"
              >
                À propos de nous
              </a>
            </>
          )}
          
          <a 
            href="https://kolimeet.framer.ai/blog"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#d6d6d6] hover:text-white transition-all duration-200 text-base font-medium whitespace-nowrap"
          >
            Blog
          </a>
          
          <Link 
            to="/explorer"
            className="text-[#d6d6d6] hover:text-white transition-all duration-200 text-base font-medium whitespace-nowrap"
          >
            Explorer
          </Link>
          
          {user && (
            <>
              <Link 
                to="/explorer"
                className="text-[#d6d6d6] hover:text-white transition-all duration-200 text-base font-medium whitespace-nowrap"
              >
                Explorer
              </Link>
              <Link 
                to="/messages"
                className="text-[#d6d6d6] hover:text-white transition-all duration-200 text-base font-medium whitespace-nowrap relative"
              >
                Messagerie
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {user ? (
                <button className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent rounded-full">
                  <Avatar className="h-9 w-9 border-2 border-white/30">
                    <AvatarImage src={profile?.avatar_url} alt="Avatar" />
                    <AvatarFallback className="bg-white/10">
                      <User className="h-5 w-5 text-white" />
                    </AvatarFallback>
                  </Avatar>
                </button>
              ) : (
                <Button 
                  variant="outline"
                  className="px-6 py-2.5 bg-transparent border border-white/50 rounded-full text-white text-sm font-medium hover:bg-white/10 hover:border-white/80 transition-all duration-300 whitespace-nowrap"
                >
                  Mon profil
                </Button>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {user ? (
                <>
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
                      to="/favoris"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Heart className="h-4 w-4" />
                      Favoris
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
                      <span>Messagerie</span>
                      {unreadCount > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shrink-0">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
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
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link
                      to="/auth/login"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <User className="h-4 w-4" />
                      Connexion
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      to="/auth/register"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <User className="h-4 w-4" />
                      Créer un compte
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
