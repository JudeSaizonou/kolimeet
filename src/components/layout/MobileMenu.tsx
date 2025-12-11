import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { useUnreadCount } from "@/hooks/useUnreadCount";

interface MobileMenuProps {
  user: any;
  profile: any;
  isAdmin: boolean;
  onSignOut: () => void;
}

export const MobileMenu = ({ user, profile, isAdmin, onSignOut }: MobileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const { unreadCount } = useUnreadCount();
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Hamburger Button */}
      <button 
        ref={buttonRef}
        className="md:hidden flex flex-col items-center justify-center gap-1.5 w-10 h-10 focus:outline-none relative z-[202]"
        aria-label="Menu"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div 
          className={cn(
            "w-6 h-0.5 bg-foreground rounded-full transition-all duration-300",
            isOpen && "rotate-45 translate-y-2 bg-white"
          )}
        />
        <div 
          className={cn(
            "w-6 h-0.5 bg-foreground rounded-full transition-all duration-300",
            isOpen && "-rotate-45 -translate-y-2 bg-white"
          )}
        />
      </button>

      {/* Mobile Menu Dropdown */}
      <div 
        ref={menuRef}
        className={cn(
          "fixed top-24 left-1/2 -translate-x-1/2 z-[201]",
          "w-[90vw] max-w-[350px] max-h-[calc(100vh-7rem)] overflow-y-auto",
          "bg-white rounded-2xl p-8 shadow-xl border border-gray-100",
          "flex flex-col justify-end items-center gap-4",
          "transition-all duration-300 md:hidden font-sans",
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
        )}
      >
        {/* Navigation Links */}
        <div className="flex flex-col items-center gap-3 w-full">
          <Link 
            to="/explorer" 
            className="text-slate-700 text-base font-medium hover:text-primary transition-colors py-2"
            onClick={handleLinkClick}
          >
            Explorer
          </Link>

          {user ? (
            <>
              {/* Dépliant Publier */}
              <div className="w-full flex flex-col items-center gap-2">
                <button
                  onClick={() => setIsPublishOpen(!isPublishOpen)}
                  className="text-slate-700 text-base font-medium hover:text-primary transition-colors flex items-center gap-2 py-2"
                >
                  Publier
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform duration-300",
                    isPublishOpen && "rotate-180"
                  )} />
                </button>
                
                {isPublishOpen && (
                  <div className="flex flex-col items-center gap-2 w-full bg-violet-50 rounded-xl py-3 px-4">
                    <Link 
                      to="/publier/colis" 
                      className="text-slate-600 text-sm font-medium hover:text-primary transition-colors py-1.5"
                      onClick={handleLinkClick}
                    >
                      Un colis
                    </Link>
                    
                    <Link 
                      to="/publier/trajet" 
                      className="text-slate-600 text-sm font-medium hover:text-primary transition-colors py-1.5"
                      onClick={handleLinkClick}
                    >
                      Une annonce
                    </Link>
                  </div>
                )}
              </div>
              
              <Link 
                to="/messages" 
                className="text-slate-700 text-base font-medium hover:text-primary transition-colors relative inline-flex items-center gap-2 py-2"
                onClick={handleLinkClick}
              >
                Messagerie
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              <Link 
                to="/mes-annonces" 
                className="text-slate-700 text-base font-medium hover:text-primary transition-colors py-2"
                onClick={handleLinkClick}
              >
                Mes annonces
              </Link>
              
              <Link 
                to="/favoris" 
                className="text-slate-700 text-base font-medium hover:text-primary transition-colors inline-flex items-center gap-2 py-2"
                onClick={handleLinkClick}
              >
                <span>Favoris</span>
              </Link>
              
              <Link 
                to="/profil" 
                className="text-slate-700 text-base font-medium hover:text-primary transition-colors py-2"
                onClick={handleLinkClick}
              >
                Mon profil
              </Link>

              {isAdmin && (
                <Link 
                  to="/admin" 
                  className="text-slate-700 text-base font-medium hover:text-primary transition-colors py-2"
                  onClick={handleLinkClick}
                >
                  Administration
                </Link>
              )}
            </>
          ) : (
            <>
              {/* CTA Button - Login */}
              <Link 
                to="/auth/login"
                className="px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors w-full text-center mt-2"
                onClick={handleLinkClick}
              >
                Connexion
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
};
