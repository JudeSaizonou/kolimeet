import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

interface MobileMenuProps {
  user: any;
  profile: any;
  isAdmin: boolean;
  onSignOut: () => void;
}

export const MobileMenu = ({ user, profile, isAdmin, onSignOut }: MobileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
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

      {/* Mobile Menu Dropdown */}
      <div 
        ref={menuRef}
        className={cn(
          "fixed top-24 left-1/2 -translate-x-1/2 z-[201]",
          "w-[90vw] max-w-[350px] max-h-[calc(100vh-7rem)] overflow-y-auto",
          "bg-[#F2F2F2] rounded-[20px] p-10",
          "flex flex-col justify-end items-center gap-[15px]",
          "transition-all duration-300 md:hidden",
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
        )}
      >
        {/* Navigation Links */}
        <div className="flex flex-col items-center gap-[15px] w-full">
          <a 
            href="https://kolimeet.framer.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#333333] text-lg hover:opacity-70 transition-opacity"
            onClick={handleLinkClick}
          >
            Accueil
          </a>
          
          {!user && (
            <>
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
            </>
          )}
          
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
              {/* Dépliant Publier */}
              <div className="w-full flex flex-col items-center gap-[15px]">
                <button
                  onClick={() => setIsPublishOpen(!isPublishOpen)}
                  className="text-[#333333] text-lg hover:opacity-70 transition-opacity flex items-center gap-2"
                >
                  Publier
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform duration-300",
                    isPublishOpen && "rotate-180"
                  )} />
                </button>
                
                {isPublishOpen && (
                  <div className="flex flex-col items-center gap-[15px] w-full">
                    <Link 
                      to="/publier/colis" 
                      className="text-[#333333] text-base hover:opacity-70 transition-opacity pl-6"
                      onClick={handleLinkClick}
                    >
                      Un colis
                    </Link>
                    
                    <Link 
                      to="/publier/trajet" 
                      className="text-[#333333] text-base hover:opacity-70 transition-opacity pl-6"
                      onClick={handleLinkClick}
                    >
                      Une annonce
                    </Link>
                  </div>
                )}
              </div>
              
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
