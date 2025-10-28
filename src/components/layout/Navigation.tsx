import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navigation = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-foreground">ColisLink</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <Link to="/explorer">
            <Button variant="ghost" className="font-medium">
              Explorer
            </Button>
          </Link>
          <Link to="/auth/login">
            <Button className="font-medium">
              Connexion
            </Button>
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default Navigation;
