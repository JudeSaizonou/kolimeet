import { Link } from "react-router-dom";
import { Package } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t bg-secondary">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Package className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-foreground">ColisLink</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-md">
              Plateforme de mise en relation entre voyageurs et expéditeurs pour l'envoi de colis entre la France et le Bénin.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-3 text-foreground">Liens utiles</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/cgu" className="text-muted-foreground hover:text-primary transition-colors">
                  CGU
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-muted-foreground hover:text-primary transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-3 text-foreground">Communauté</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/explorer" className="text-muted-foreground hover:text-primary transition-colors">
                  Explorer les annonces
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ColisLink. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
