import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Package, 
  Users, 
  Shield, 
  ArrowRight, 
  Plane, 
  MapPin, 
  MessageSquare, 
  Star,
  Lock,
  Mail,
  CheckCircle,
  Globe
} from "lucide-react";

const HomePage = () => {
  return (
    <>
      {/* Hero Section - Full viewport with background image */}
      <section className="relative min-h-[70vh] lg:min-h-[85vh] flex items-center pt-20 md:pt-28 pb-16 md:pb-24 lg:pb-32 px-4 overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/hero-bg.jpg" 
            alt="" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
        </div>
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Text Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                Envoyez vos colis <span className="text-primary">partout dans le monde</span>
              </h1>
              
              <p className="text-lg sm:text-xl md:text-2xl lg:text-2xl text-muted-foreground mb-6 leading-relaxed">
                La plateforme de mise en relation pour le transport de colis entre particuliers
              </p>
              
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Envoyez vos colis avec des voyageurs de confiance ou rentabilisez vos trajets 
                en transportant des colis pour d'autres. Simple, économique et sécurisé.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" asChild className="text-base lg:text-lg lg:px-8 lg:py-6">
                  <Link to="/explorer">
                    Explorer les annonces
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-base lg:text-lg lg:px-8 lg:py-6 bg-background/80 backdrop-blur-sm">
                  <Link to="/auth/register">
                    Créer un compte gratuit
                  </Link>
                </Button>
              </div>
            </div>
            
            {/* Right: Hero Image (large screens only) */}
            <div className="hidden lg:flex justify-center items-center">
              <div className="relative">
                <div className="w-[420px] h-[420px] rounded-3xl overflow-hidden shadow-2xl">
                  <img 
                    src="/images/traveler.jpg" 
                    alt="Voyageur avec valise" 
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 bg-success text-white rounded-full px-4 py-2 text-sm font-medium shadow-lg">
                  100% Gratuit
                </div>
                <div className="absolute -bottom-4 -left-4 bg-primary text-white rounded-full px-4 py-2 text-sm font-medium shadow-lg">
                  Monde entier
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What is Kolimeet */}
      <section className="py-20 lg:py-32 px-4 bg-background">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-6 tracking-tight">
            Qu'est-ce que Kolimeet ?
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-3xl mx-auto text-base sm:text-lg md:text-xl">
            Kolimeet est une plateforme collaborative qui connecte les personnes souhaitant 
            envoyer des colis avec des voyageurs ayant de l'espace disponible dans leurs bagages.
          </p>
          
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            <Card className="border-2 border-primary/20 hover:shadow-lg transition-shadow overflow-hidden">
              <div className="h-48 overflow-hidden">
                <img 
                  src="/images/airport-luggage.jpg" 
                  alt="Bagages à l'aéroport" 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <CardContent className="p-8 lg:p-10">
                <h3 className="text-2xl font-semibold mb-6">Pour les expéditeurs</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Vous avez un colis à envoyer ? Publiez votre annonce avec les détails 
                  (poids, dimensions, destination) et trouvez un voyageur de confiance 
                  pour le transporter à moindre coût.
                </p>
                <ul className="mt-6 space-y-3">
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>Publication gratuite d'annonces</span>
                  </li>
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>Négociation du prix directement</span>
                  </li>
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>Suivi des conversations</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-success/20 hover:shadow-lg transition-shadow overflow-hidden">
              <div className="h-48 overflow-hidden">
                <img 
                  src="/images/savings.jpg" 
                  alt="Économies" 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <CardContent className="p-8 lg:p-10">
                <h3 className="text-2xl font-semibold mb-6">Pour les voyageurs</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Vous voyagez et avez de l'espace disponible ? Publiez votre trajet et 
                  rentabilisez votre voyage en transportant des colis pour d'autres utilisateurs.
                </p>
                <ul className="mt-6 space-y-3">
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span>Définissez votre prix par kilo</span>
                  </li>
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span>Choisissez les colis à accepter</span>
                  </li>
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span>Gagnez de l'argent facilement</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative py-20 lg:py-32 px-4 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/package-handover.jpg" 
            alt="" 
            className="w-full h-full object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-secondary/80" />
        </div>
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-16 tracking-tight">
            Comment ça marche ?
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            <div className="text-center group">
              <div className="h-20 w-20 lg:h-24 lg:w-24 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-6 text-3xl lg:text-4xl font-bold group-hover:scale-110 transition-transform shadow-lg">
                1
              </div>
              <h3 className="font-semibold text-lg mb-3">Créez votre compte</h3>
              <p className="text-muted-foreground">
                Inscrivez-vous gratuitement en quelques secondes avec votre email ou Google
              </p>
            </div>
            
            <div className="text-center group">
              <div className="h-20 w-20 lg:h-24 lg:w-24 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-6 text-3xl lg:text-4xl font-bold group-hover:scale-110 transition-transform shadow-lg">
                2
              </div>
              <h3 className="font-semibold text-lg mb-3">Publiez ou explorez</h3>
              <p className="text-muted-foreground">
                Créez une annonce de colis ou de trajet, ou parcourez celles disponibles
              </p>
            </div>
            
            <div className="text-center group">
              <div className="h-20 w-20 lg:h-24 lg:w-24 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-6 text-3xl lg:text-4xl font-bold group-hover:scale-110 transition-transform shadow-lg">
                3
              </div>
              <h3 className="font-semibold text-lg mb-3">Échangez</h3>
              <p className="text-muted-foreground">
                Discutez via notre messagerie sécurisée et négociez les détails
              </p>
            </div>
            
            <div className="text-center group">
              <div className="h-20 w-20 lg:h-24 lg:w-24 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-6 text-3xl lg:text-4xl font-bold group-hover:scale-110 transition-transform shadow-lg">
                4
              </div>
              <h3 className="font-semibold text-lg mb-3">Finalisez</h3>
              <p className="text-muted-foreground">
                Convenez du lieu de rendez-vous et effectuez la remise du colis
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 lg:py-32 px-4 bg-background">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-6 tracking-tight">
            Fonctionnalités de l'application
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto text-base sm:text-lg md:text-xl">
            Tout ce dont vous avez besoin pour envoyer ou transporter des colis en toute sérénité
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-all hover:-translate-y-1">
              <CardContent className="p-8 text-center">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-3">Recherche par destination</h3>
                <p className="text-muted-foreground">
                  Trouvez facilement des trajets ou colis vers votre destination avec notre système de filtres avancés
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-all hover:-translate-y-1">
              <CardContent className="p-8 text-center">
                <div className="h-16 w-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="font-semibold text-lg mb-3">Messagerie intégrée</h3>
                <p className="text-muted-foreground">
                  Communiquez directement et en toute sécurité avec les autres utilisateurs de la plateforme
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-all hover:-translate-y-1">
              <CardContent className="p-8 text-center">
                <div className="h-16 w-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
                  <Star className="h-8 w-8 text-amber-500" />
                </div>
                <h3 className="font-semibold text-lg mb-3">Système d'avis</h3>
                <p className="text-muted-foreground">
                  Consultez les évaluations et avis des autres utilisateurs pour choisir en confiance
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-all hover:-translate-y-1">
              <CardContent className="p-8 text-center">
                <div className="h-16 w-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-6">
                  <Shield className="h-8 w-8 text-success" />
                </div>
                <h3 className="font-semibold text-lg mb-3">Profils vérifiés</h3>
                <p className="text-muted-foreground">
                  Score de confiance calculé automatiquement basé sur l'activité et les avis reçus
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-all hover:-translate-y-1">
              <CardContent className="p-8 text-center">
                <div className="h-16 w-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-6">
                  <Globe className="h-8 w-8 text-purple-500" />
                </div>
                <h3 className="font-semibold text-lg mb-3">International</h3>
                <p className="text-muted-foreground">
                  Envoyez vos colis vers n'importe quelle destination internationale
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-all hover:-translate-y-1">
              <CardContent className="p-8 text-center">
                <div className="h-16 w-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-rose-500" />
                </div>
                <h3 className="font-semibold text-lg mb-3">Communauté active</h3>
                <p className="text-muted-foreground">
                  Rejoignez une communauté grandissante de voyageurs et expéditeurs de confiance
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Trust Us - New section with images */}
      <section className="py-20 lg:py-32 px-4 bg-secondary/30">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-6 tracking-tight">
            Pourquoi nous faire confiance ?
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto text-base sm:text-lg md:text-xl">
            Une communauté basée sur la confiance et la transparence
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group">
              <div className="relative h-64 rounded-2xl overflow-hidden mb-6">
                <img 
                  src="/images/trust-handshake.jpg" 
                  alt="Confiance" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white text-xl font-semibold">Confiance mutuelle</h3>
                </div>
              </div>
              <p className="text-muted-foreground">
                Système d'avis et de notation pour garantir des échanges en toute sérénité entre utilisateurs vérifiés.
              </p>
            </div>
            
            <div className="group">
              <div className="relative h-64 rounded-2xl overflow-hidden mb-6">
                <img 
                  src="/images/community.jpg" 
                  alt="Communauté" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white text-xl font-semibold">Communauté solidaire</h3>
                </div>
              </div>
              <p className="text-muted-foreground">
                Rejoignez une communauté de voyageurs et expéditeurs qui s'entraident au quotidien.
              </p>
            </div>
            
            <div className="group">
              <div className="relative h-64 rounded-2xl overflow-hidden mb-6">
                <img 
                  src="/images/package-handover.jpg" 
                  alt="Remise de colis" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white text-xl font-semibold">Remise sécurisée</h3>
                </div>
              </div>
              <p className="text-muted-foreground">
                Organisez facilement la remise en main propre de vos colis via notre messagerie intégrée.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Data Privacy Section - Required by Google */}
      <section className="py-20 lg:py-32 px-4 bg-background">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-6 tracking-tight">
            Vos données, notre priorité
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto text-base sm:text-lg md:text-xl">
            Nous prenons la protection de vos données très au sérieux
          </p>
          
          <div className="bg-secondary/30 rounded-2xl p-8 lg:p-12 shadow-sm">
            <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
              <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Lock className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-3">Données minimales</h3>
                <p className="text-muted-foreground">
                  Nous collectons uniquement les données nécessaires : email, nom et informations 
                  de vos annonces pour le bon fonctionnement du service.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Mail className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-3">Connexion Google</h3>
                <p className="text-muted-foreground">
                  Avec Google, nous accédons uniquement à votre nom et email. 
                  Aucune autre donnée de votre compte Google n'est collectée.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <CheckCircle className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-3">Vos droits RGPD</h3>
                <p className="text-muted-foreground">
                  Accédez, modifiez ou supprimez vos données à tout moment depuis votre profil. 
                  Conformité totale avec le RGPD.
                </p>
              </div>
            </div>
            
            <div className="mt-12 pt-8 border-t text-center">
              <Button variant="outline" size="lg" asChild>
                <Link to="/confidentialite">
                  Consulter notre politique de confidentialité
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section with background */}
      <section className="relative py-20 lg:py-32 px-4 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-primary" />
        
        <div className="container mx-auto max-w-4xl text-center relative z-10 text-primary-foreground">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 tracking-tight">
            Prêt à rejoindre Kolimeet ?
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl opacity-90 mb-10 max-w-2xl mx-auto">
            Créez votre compte gratuitement et commencez à envoyer ou transporter des colis dès aujourd'hui.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild className="text-lg px-8 py-6">
              <Link to="/auth/register">
                S'inscrire gratuitement
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8 py-6 bg-transparent border-white text-white hover:bg-white/10">
              <Link to="/explorer">
                Explorer sans compte
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default HomePage;
