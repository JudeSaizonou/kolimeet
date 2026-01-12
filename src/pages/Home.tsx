import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Star } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

const Home = () => {
  return (
    <div className="overflow-hidden">
      <SEOHead
        title="Kolimeet - Transport collaboratif de colis entre villes"
        description="Envoyez ou transportez des colis entre villes en toute sécurité. Kolimeet connecte voyageurs et expéditeurs pour un transport collaboratif économique et écologique."
        keywords="transport colis, covoiturage colis, envoi colis, livraison collaborative, transport entre villes, économie collaborative"
      />
      {/* Hero Section - Split layout avec image */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background image subtil */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <img 
            src="/images/hero-bg.webp"
            alt=""
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>
        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Texte */}
            <div className="order-2 lg:order-1">
              <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
                Transport de colis entre particuliers
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                Envoyez vos colis <span className="text-primary">partout dans le monde</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                Kolimeet connecte les voyageurs et les expéditeurs pour un transport de colis économique, écologique et humain.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link to="/explorer">
                  <Button size="lg" className="w-full sm:w-auto font-semibold text-base px-8">
                    Explorer les annonces
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/auth/register">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto font-semibold text-base px-8">
                    Créer un compte gratuit
                  </Button>
                </Link>
              </div>
              {/* Trust badges */}
              <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span>100% gratuit</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span>Sans commission</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span>Paiement sécurisé</span>
                </div>
              </div>
            </div>
            
            {/* Images collage */}
            <div className="order-1 lg:order-2 relative">
              <div className="relative h-[400px] md:h-[500px] lg:h-[600px]">
                {/* Image principale */}
                <div className="absolute top-0 right-0 w-[75%] h-[70%] rounded-3xl overflow-hidden shadow-2xl">
                  <img 
                    srcSet="/images/airport-luggage-320w.webp 320w, /images/airport-luggage-640w.webp 640w, /images/airport-luggage-1024w.webp 1024w, /images/airport-luggage-1920w.webp 1920w"
                    sizes="(max-width: 640px) 75vw, (max-width: 1024px) 50vw, 40vw"
                    src="/images/airport-luggage.webp" 
                    alt="Bagage à l'aéroport"
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                </div>
                {/* Image secondaire */}
                <div className="absolute bottom-0 left-0 w-[60%] h-[50%] rounded-3xl overflow-hidden shadow-2xl border-4 border-background">
                  <img 
                    srcSet="/images/package-handover-320w.webp 320w, /images/package-handover-640w.webp 640w, /images/package-handover-1024w.webp 1024w"
                    sizes="(max-width: 640px) 60vw, 30vw"
                    src="/images/package-handover.webp" 
                    alt="Remise de colis en main propre"
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                </div>
                {/* Badge flottant */}
                <div className="absolute bottom-20 right-0 bg-background rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80" alt="" className="w-10 h-10 rounded-full border-2 border-background object-cover" />
                      <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80" alt="" className="w-10 h-10 rounded-full border-2 border-background object-cover" />
                      <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80" alt="" className="w-10 h-10 rounded-full border-2 border-background object-cover" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">+2000 membres</p>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-muted-foreground">4.9/5</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comment ça marche - Alternating layout */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Trois étapes simples pour envoyer ou transporter un colis
            </p>
          </div>
          
          {/* Étape 1 */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="rounded-3xl overflow-hidden shadow-xl">
              <img 
                srcSet="/images/savings-320w.webp 320w, /images/savings-640w.webp 640w, /images/savings-1024w.webp 1024w"
                sizes="(max-width: 1024px) 100vw, 50vw"
                src="/images/savings.webp" 
                alt="Économies sur l'envoi de colis"
                className="w-full h-[350px] object-cover"
                loading="lazy"
              />
            </div>
            <div>
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-xl mb-6">1</span>
              <h3 className="text-2xl md:text-3xl font-bold mb-4">Publiez votre annonce</h3>
              <p className="text-muted-foreground text-lg mb-6">
                Vous avez un colis à envoyer ? Créez une annonce détaillée en quelques minutes. 
                Vous voyagez bientôt ? Proposez vos kilos disponibles et rentabilisez votre trajet.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Création rapide en moins de 2 minutes</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Photos et description détaillée</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Étape 2 - Inversé */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 lg:order-1">
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-xl mb-6">2</span>
              <h3 className="text-2xl md:text-3xl font-bold mb-4">Trouvez votre match</h3>
              <p className="text-muted-foreground text-lg mb-6">
                Parcourez les annonces disponibles et trouvez le voyageur ou l'expéditeur idéal. 
                Filtrez par destination, date et prix pour trouver l'offre parfaite.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Profils vérifiés et avis authentiques</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Messagerie intégrée sécurisée</span>
                </li>
              </ul>
            </div>
            <div className="order-1 lg:order-2 rounded-3xl overflow-hidden shadow-xl">
              <img 
                srcSet="/images/community-320w.webp 320w, /images/community-640w.webp 640w, /images/community-1024w.webp 1024w"
                sizes="(max-width: 1024px) 100vw, 50vw"
                src="/images/community.webp" 
                alt="Communauté Kolimeet"
                className="w-full h-[350px] object-cover"
                loading="lazy"
              />
            </div>
          </div>

          {/* Étape 3 */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="rounded-3xl overflow-hidden shadow-xl">
              <img 
                srcSet="/images/trust-handshake-320w.webp 320w, /images/trust-handshake-640w.webp 640w, /images/trust-handshake-1024w.webp 1024w"
                sizes="(max-width: 1024px) 100vw, 50vw"
                src="/images/trust-handshake.webp" 
                alt="Confiance et poignée de main"
                className="w-full h-[350px] object-cover"
                loading="lazy"
              />
            </div>
            <div>
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-xl mb-6">3</span>
              <h3 className="text-2xl md:text-3xl font-bold mb-4">Échangez en toute confiance</h3>
              <p className="text-muted-foreground text-lg mb-6">
                Convenez des modalités de remise et d'un prix équitable. 
                Effectuez la transaction en toute sécurité et laissez un avis après livraison.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Système d'avis et de notation</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Support client disponible</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section Pourquoi Kolimeet avec image traveler */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div className="rounded-3xl overflow-hidden shadow-xl">
              <img 
                srcSet="/images/traveler-320w.webp 320w, /images/traveler-640w.webp 640w, /images/traveler-1024w.webp 1024w, /images/traveler-1920w.webp 1920w"
                sizes="(max-width: 1024px) 100vw, 50vw"
                src="/images/traveler.webp" 
                alt="Voyageur avec valise"
                className="w-full h-[400px] object-cover"
                loading="lazy"
              />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Pourquoi choisir Kolimeet ?
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                    Économique
                  </h3>
                  <p className="text-muted-foreground ml-8">
                    Jusqu'à 70% moins cher que les transporteurs traditionnels. Pas de frais cachés, pas de commission.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                    Écologique
                  </h3>
                  <p className="text-muted-foreground ml-8">
                    Optimisez l'espace disponible dans les bagages des voyageurs. Réduisez l'empreinte carbone.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                    Humain
                  </h3>
                  <p className="text-muted-foreground ml-8">
                    Créez du lien entre voyageurs et expéditeurs. Une communauté solidaire et bienveillante.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Témoignages */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ils nous font confiance
            </h2>
            <p className="text-lg text-muted-foreground">
              Découvrez les retours de notre communauté
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Témoignage 1 */}
            <div className="bg-card rounded-2xl p-6 shadow-lg border">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-muted-foreground mb-6">
                "J'ai pu envoyer un cadeau d'anniversaire à ma mère au Sénégal pour une fraction du prix habituel. Service au top !"
              </p>
              <div className="flex items-center gap-3">
                <img 
                  src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100&q=80" 
                  alt="Aminata"
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold">Aminata D.</p>
                  <p className="text-sm text-muted-foreground">Paris → Dakar</p>
                </div>
              </div>
            </div>

            {/* Témoignage 2 */}
            <div className="bg-card rounded-2xl p-6 shadow-lg border">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-muted-foreground mb-6">
                "En tant que voyageur fréquent, Kolimeet me permet de rentabiliser mes trajets tout en rendant service. Excellent concept !"
              </p>
              <div className="flex items-center gap-3">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80" 
                  alt="Thomas"
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold">Thomas L.</p>
                  <p className="text-sm text-muted-foreground">Voyageur régulier</p>
                </div>
              </div>
            </div>

            {/* Témoignage 3 */}
            <div className="bg-card rounded-2xl p-6 shadow-lg border">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-muted-foreground mb-6">
                "Simple, rapide et économique. J'ai trouvé quelqu'un pour transporter mon colis en moins de 24h. Je recommande !"
              </p>
              <div className="flex items-center gap-3">
                <img 
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80" 
                  alt="Sophie"
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold">Sophie M.</p>
                  <p className="text-sm text-muted-foreground">Lyon → Casablanca</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Prêt à envoyer votre premier colis ?
            </h2>
            <p className="text-lg opacity-90 mb-8">
              Rejoignez des milliers d'utilisateurs qui font confiance à Kolimeet pour leurs envois de colis.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth/register">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto font-semibold text-base px-8">
                  Créer un compte gratuit
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/explorer">
                <Button size="lg" variant="outline" className="w-full sm:w-auto font-semibold text-base px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  Voir les annonces
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section Conformité / À propos */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">À propos de Kolimeet</h2>
            <div className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground">
              <p>
                <strong>Kolimeet</strong> est une plateforme de mise en relation entre voyageurs et expéditeurs. 
                Notre mission est de faciliter l'envoi de colis entre particuliers de manière économique, écologique et sécurisée.
              </p>
              <p>
                La plateforme permet aux utilisateurs de publier des annonces de trajets (pour les voyageurs) 
                ou de colis à envoyer (pour les expéditeurs). Les utilisateurs peuvent ensuite entrer en contact 
                via notre messagerie sécurisée pour convenir des modalités de transport.
              </p>
              <p>
                <strong>Données utilisateur :</strong> Kolimeet collecte uniquement les informations nécessaires 
                au bon fonctionnement du service (nom, email, numéro de téléphone optionnel). Ces données sont 
                utilisées pour permettre la mise en relation entre utilisateurs et ne sont jamais vendues à des tiers.
              </p>
              <p className="text-sm">
                Pour plus d'informations, consultez notre{" "}
                <Link to="/privacy" className="text-primary hover:underline">
                  Politique de Confidentialité
                </Link>{" "}
                et nos{" "}
                <Link to="/cgu" className="text-primary hover:underline">
                  Conditions Générales d'Utilisation
                </Link>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
