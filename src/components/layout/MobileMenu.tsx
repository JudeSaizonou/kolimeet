import { Link } from "react-router-dom";
import { Package, Plane, MessageSquare, User, FileText, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";

interface MobileMenuProps {
  user: any;
  profile: any;
  isAdmin: boolean;
  onSignOut: () => void;
}

export const MobileMenu = ({ user, profile, isAdmin, onSignOut }: MobileMenuProps) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 mt-6">
          <Link to="/explorer">
            <Button variant="ghost" className="w-full justify-start">
              Explorer
            </Button>
          </Link>

          {user && (
            <>
              <div className="border-t pt-4">
                <p className="text-sm font-medium px-2 mb-2">Publier</p>
                <Link to="/publier/trajet">
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Plane className="h-4 w-4" />
                    Publier un trajet
                  </Button>
                </Link>
                <Link to="/publier/colis">
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Package className="h-4 w-4" />
                    Publier un colis
                  </Button>
                </Link>
              </div>

              <div className="border-t pt-4">
                <Link to="/profil">
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <User className="h-4 w-4" />
                    Mon profil
                  </Button>
                </Link>
                <Link to="/mes-annonces">
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <FileText className="h-4 w-4" />
                    Mes annonces
                  </Button>
                </Link>
                <Link to="/messages">
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Messagerie
                  </Button>
                </Link>
              </div>

              {isAdmin && (
                <div className="border-t pt-4">
                  <Link to="/admin">
                    <Button variant="ghost" className="w-full justify-start gap-2 text-primary">
                      <Shield className="h-4 w-4" />
                      Administration
                    </Button>
                  </Link>
                </div>
              )}

              <div className="border-t pt-4">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-destructive"
                  onClick={onSignOut}
                >
                  <LogOut className="h-4 w-4" />
                  Déconnexion
                </Button>
              </div>
            </>
          )}

          {!user && (
            <Link to="/auth/login">
              <Button className="w-full">
                Connexion
              </Button>
            </Link>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
