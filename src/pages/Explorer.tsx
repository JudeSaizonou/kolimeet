import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";

const Explorer = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1">
        <section className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Explorer les annonces
            </h1>
            <p className="text-muted-foreground mb-6">
              Trouvez le voyageur ou l'expéditeur qui correspond à vos besoins.
            </p>
            
            <div className="flex gap-4 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="Rechercher une destination..." 
                  className="pl-10"
                />
              </div>
              <Button>
                Rechercher
              </Button>
            </div>
          </div>

          <Card className="p-8 text-center border-2 border-dashed">
            <p className="text-muted-foreground mb-4">
              Les annonces seront bientôt disponibles !
            </p>
            <p className="text-sm text-muted-foreground">
              En attendant, créez votre compte pour être notifié des nouvelles fonctionnalités.
            </p>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Explorer;
