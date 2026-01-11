import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Compass, Heart, Plus, MessageCircle, User, Plane, Package, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useThreads } from "@/hooks/useThreads";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  badge?: number;
  action?: () => void;
}

export function BottomNavbar() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { threads } = useThreads();
  const [publishSheetOpen, setPublishSheetOpen] = useState(false);

  // Compter les messages non lus
  const unreadMessagesCount = threads?.filter(t => t.unread_count > 0).length || 0;

  // Ne pas afficher si l'utilisateur n'est pas connecté
  if (!user) return null;

  // Masquer uniquement dans les pages de publication et d'authentification
  const hiddenPaths = [
    '/publier/',
    '/auth/',
    '/onboarding',
  ];
  
  const shouldHide = hiddenPaths.some(path => location.pathname.startsWith(path));
  if (shouldHide) return null;

  const navItems: NavItem[] = [
    {
      label: "Explorer",
      href: "/explorer",
      icon: <Compass className="h-6 w-6" strokeWidth={1.5} />,
      activeIcon: <Compass className="h-6 w-6" strokeWidth={2.5} />,
    },
    {
      label: "Favoris",
      href: "/favoris",
      icon: <Heart className="h-6 w-6" strokeWidth={1.5} />,
      activeIcon: <Heart className="h-6 w-6 fill-current" strokeWidth={2} />,
    },
    {
      label: "Publier",
      icon: <Plus className="h-7 w-7" strokeWidth={2.5} />,
      action: () => setPublishSheetOpen(true),
    },
    {
      label: "Messages",
      href: "/messages",
      icon: <MessageCircle className="h-6 w-6" strokeWidth={1.5} />,
      activeIcon: <MessageCircle className="h-6 w-6 fill-current" strokeWidth={2} />,
      badge: unreadMessagesCount,
    },
    {
      label: "Profil",
      href: "/profil",
      icon: <User className="h-6 w-6" strokeWidth={1.5} />,
      activeIcon: <User className="h-6 w-6" strokeWidth={2.5} />,
    },
  ];

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === "/explorer") {
      return location.pathname === "/" || location.pathname === "/explorer";
    }
    return location.pathname.startsWith(href);
  };

  const handlePublishOption = (type: 'trip' | 'parcel') => {
    setPublishSheetOpen(false);
    navigate(type === 'trip' ? '/publier/trajet' : '/publier/colis');
  };

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe" aria-label="Navigation principale">
        {/* Fond avec effet de flou et bordure subtile */}
        <div className="absolute inset-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]" />
        
        {/* Contenu de la navbar */}
        <div className="relative flex items-end justify-around h-20 px-1 pb-6 pt-2">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const isPublish = item.label === "Publier";
            
            const content = isPublish ? (
              // Bouton Publier spécial (style FAB)
              <button
                onClick={item.action}
                className="relative -mt-8 flex flex-col items-center"
                aria-label="Publier une annonce"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-violet-600 shadow-xl shadow-primary/40 flex items-center justify-center text-white transform hover:scale-105 active:scale-95 transition-all duration-200">
                  {item.icon}
                </div>
                <span className="text-[10px] font-semibold text-slate-500 mt-1">
                  {item.label}
                </span>
              </button>
            ) : (
              <Link
                to={item.href || "/"}
                className="flex flex-col items-center justify-center gap-1 min-w-0 px-4 py-1"
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
              >
                <div className="relative h-6 w-6 flex items-center justify-center">
                  <span className={cn(
                    "transition-all duration-200",
                    active ? "text-primary scale-110" : "text-slate-600"
                  )}>
                    {active && item.activeIcon ? item.activeIcon : item.icon}
                  </span>
                  {/* Badge de notifications - seulement si > 0 */}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={cn(
                      "absolute -top-2 -right-3 min-w-[18px] h-[18px] flex items-center justify-center",
                      "bg-red-500 text-white text-[10px] font-bold rounded-full",
                      "shadow-lg shadow-red-500/30 border-2 border-white",
                      "animate-in zoom-in duration-200"
                    )}>
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "text-[11px] font-medium transition-colors duration-200",
                  active ? "text-primary font-semibold" : "text-slate-600"
                )}>
                  {item.label}
                </span>
              </Link>
            );

            return (
              <div key={item.label} className="flex-1 flex justify-center">
                {content}
              </div>
            );
          })}
        </div>
        
        {/* Safe area pour les iPhones avec encoche */}
        <div className="h-safe-area-bottom bg-white/95" />
      </nav>

      {/* Bottom Sheet pour choisir le type de publication */}
      <Sheet open={publishSheetOpen} onOpenChange={setPublishSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl px-6 pb-10">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-center text-xl">Que souhaitez-vous publier ?</SheetTitle>
          </SheetHeader>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            {/* Option Trajet */}
            <button
              onClick={() => handlePublishOption('trip')}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-br from-violet-50 to-violet-100 border-2 border-violet-200 hover:border-violet-400 hover:shadow-lg transition-all duration-200 active:scale-95"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shadow-lg shadow-primary/30">
                <Plane className="h-8 w-8 text-white" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-900">Un trajet</p>
                <p className="text-xs text-slate-500 mt-1">Je voyage et propose de transporter</p>
              </div>
            </button>

            {/* Option Colis */}
            <button
              onClick={() => handlePublishOption('parcel')}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100 border-2 border-amber-200 hover:border-amber-400 hover:shadow-lg transition-all duration-200 active:scale-95"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Package className="h-8 w-8 text-white" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-900">Un colis</p>
                <p className="text-xs text-slate-500 mt-1">J'ai un colis à faire transporter</p>
              </div>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
