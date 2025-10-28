import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Package, Users, Shield, ArrowRight } from "lucide-react";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Envoyer ou transporter un colis facilement entre la France et le Bénin
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              ColisLink met en relation les voyageurs avec les expéditeurs pour un transport de colis sécurisé et économique.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/explorer">
                <Button size="lg" className="w-full sm:w-auto font-semibold">
                  Explorer les annonces
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/auth/register">
                <Button size="lg" variant="outline" className="w-full sm:w-auto font-semibold">
                  Créer un compte
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-secondary py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-foreground mb-12">
              Comment ça marche ?
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Card className="p-6 border-2">
                <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center mb-4">
                  <Package className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  Publiez votre annonce
                </h3>
                <p className="text-muted-foreground">
                  Que vous soyez voyageur ou expéditeur, créez votre annonce en quelques clics.
                </p>
              </Card>

              <Card className="p-6 border-2">
                <div className="h-12 w-12 rounded-lg bg-success flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-success-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  Trouvez votre match
                </h3>
                <p className="text-muted-foreground">
                  Parcourez les annonces et contactez les personnes qui correspondent à vos besoins.
                </p>
              </Card>

              <Card className="p-6 border-2">
                <div className="h-12 w-12 rounded-lg bg-accent flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-accent-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  Échangez en toute sécurité
                </h3>
                <p className="text-muted-foreground">
                  Communiquez directement avec les autres utilisateurs via notre plateforme sécurisée.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Prêt à commencer ?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Rejoignez ColisLink aujourd'hui et découvrez une nouvelle façon d'envoyer vos colis.
            </p>
            <Link to="/auth/register">
              <Button size="lg" className="font-semibold">
                S'inscrire gratuitement
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
