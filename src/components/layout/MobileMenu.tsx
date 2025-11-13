import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface MobileMenuProps {
  user: any;
  profile: any;
  isAdmin: boolean;
  onSignOut: () => void;
}

export const MobileMenu = ({ user, profile, isAdmin, onSignOut }: MobileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Hamburger Button */}
      <button 
        className="md:hidden flex flex-col items-center justify-center gap-1.5 w-10 h-10 focus:outline-none relative z-[101]"
        aria-label="Menu"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div 
          className={cn(
            "w-6 h-0.5 bg-white rounded-full transition-all duration-300",
            isOpen && "rotate-45 translate-y-2"
          )}
        />
        <div 
          className={cn(
            "w-6 h-0.5 bg-white rounded-full transition-all duration-300",
            isOpen && "-rotate-45 -translate-y-2"
          )}
        />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[99] md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Menu Dropdown */}
      <div 
        className={cn(
          "fixed top-24 left-1/2 -translate-x-1/2 z-[100]",
          "w-[90vw] max-w-[350px] bg-[#F2F2F2] rounded-[20px] p-10",
          "flex flex-col justify-end items-center gap-[30px]",
          "transition-all duration-300 md:hidden",
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
        )}
      >
        {/* Navigation Links */}
        <div className="flex flex-col items-center gap-[30px] w-full">
          <a 
            href="https://kolimeet.framer.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#333333] text-lg hover:opacity-70 transition-opacity"
            onClick={handleLinkClick}
          >
            Accueil
          </a>
          
          <a 
            href="https://kolimeet.framer.ai/services"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#333333] text-lg hover:opacity-70 transition-opacity"
            onClick={handleLinkClick}
          >
            Nos services
          </a>
          
          <a 
            href="https://kolimeet.framer.ai/about-us"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#333333] text-lg hover:opacity-70 transition-opacity"
            onClick={handleLinkClick}
          >
            À propos de nous
          </a>
          
          <a 
            href="https://kolimeet.framer.ai/blog"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#333333] text-lg hover:opacity-70 transition-opacity"
            onClick={handleLinkClick}
          >
            Blog
          </a>
          
          <Link 
            to="/explorer" 
            className="text-[#333333] text-lg hover:opacity-70 transition-opacity"
            onClick={handleLinkClick}
          >
            Explorer
          </Link>

          {user ? (
            <>
              <Link 
                to="/publier/trajet" 
                className="text-[#333333] text-lg hover:opacity-70 transition-opacity"
                onClick={handleLinkClick}
              >
                Publier un trajet
              </Link>
              
              <Link 
                to="/publier/colis" 
                className="text-[#333333] text-lg hover:opacity-70 transition-opacity"
                onClick={handleLinkClick}
              >
                Publier un colis
              </Link>
              
              <Link 
                to="/mes-annonces" 
                className="text-[#333333] text-lg hover:opacity-70 transition-opacity"
                onClick={handleLinkClick}
              >
                Mes annonces
              </Link>
              
              <Link 
                to="/messages" 
                className="text-[#333333] text-lg hover:opacity-70 transition-opacity"
                onClick={handleLinkClick}
              >
                Messagerie
              </Link>
              
              <Link 
                to="/profil" 
                className="text-[#333333] text-lg hover:opacity-70 transition-opacity"
                onClick={handleLinkClick}
              >
                Mon profil
              </Link>

              {isAdmin && (
                <Link 
                  to="/admin" 
                  className="text-[#333333] text-lg hover:opacity-70 transition-opacity"
                  onClick={handleLinkClick}
                >
                  Administration
                </Link>
              )}

              <button
                onClick={() => {
                  onSignOut();
                  handleLinkClick();
                }}
                className="text-[#333333] text-lg hover:opacity-70 transition-opacity"
              >
                Déconnexion
              </button>

              {/* CTA Button - Publier */}
              <Link 
                to="/publier/trajet"
                className="px-6 py-3 bg-transparent border border-black/50 rounded-full text-[#333333] hover:bg-black/5 transition-colors"
                onClick={handleLinkClick}
              >
                Publier une annonce
              </Link>
            </>
          ) : (
            <>
              {/* CTA Button - Login */}
              <Link 
                to="/auth/login"
                className="px-6 py-3 bg-transparent border border-black/50 rounded-full text-[#333333] hover:bg-black/5 transition-colors"
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
