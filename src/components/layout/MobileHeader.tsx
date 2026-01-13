import { Link, useLocation } from "react-router-dom";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";

export function MobileHeader() {
  const { user } = useAuth();
  const location = useLocation();
  const { unreadCount } = useNotifications();

  // Ne pas afficher si pas connecté
  if (!user) return null;

  // Ne pas afficher dans les pages auth/publier/onboarding/messages/profil et détails
  const hiddenPaths = ['/publier/', '/auth/', '/onboarding', '/messages/', '/profil', '/trajets/', '/colis/', '/u/', '/mes-annonces', '/notifications'];
  const shouldHide = hiddenPaths.some(path => location.pathname.startsWith(path));
  // Aussi masquer sur les pages sans titre ou avec leur propre header
  if (shouldHide) return null;

  // Titre uniquement pour Explorer et Favoris (les pages principales)
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/explorer') return 'Kolimeet';
    if (path === '/favoris') return 'Favoris';
    return '';
  };

  const pageTitle = getPageTitle();
  
  // Ne pas afficher si pas de titre
  if (!pageTitle) return null;

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-100">
      <div className="flex items-center justify-between h-14 px-4 safe-area-top">
        {/* Logo */}
        {pageTitle === 'Kolimeet' ? (
          <Link to="/explorer" className="flex-shrink-0">
            <img src="/Kolimeetlogo.png" alt="Kolimeet" className="h-8 w-auto" />
          </Link>
        ) : (
          <h1 className="text-xl font-bold text-slate-900">
            {pageTitle}
          </h1>
        )}

        {/* Icône de notification */}
        <Link
          to="/notifications"
          className="relative p-2 -mr-2 rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors"
        >
          <Bell className="h-6 w-6 text-slate-600" strokeWidth={1.5} />
          {unreadCount > 0 && (
            <span className={cn(
              "absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center",
              "bg-red-500 text-white text-[10px] font-bold rounded-full",
              "shadow-sm border-2 border-white"
            )}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
