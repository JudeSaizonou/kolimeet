import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Package, Users, Shield, ArrowRight } from "lucide-react";
import FloatingShapes from "@/components/3d/FloatingShapes";
import ParticleField from "@/components/3d/ParticleField";
import AnimatedGradient from "@/components/3d/AnimatedGradient";
import ParallaxShapes from "@/components/3d/ParallaxShapes";
import InteractiveParticles from "@/components/3d/InteractiveParticles";
import TiltCard from "@/components/3d/TiltCard";
import MagneticButton from "@/components/3d/MagneticButton";
import CursorGlow from "@/components/3d/CursorGlow";

const Home = () => {
  return (
    <>
      {/* Lueur du curseur sur toute la page */}
      <CursorGlow />
      
      {/* Hero Section */}
      <section className="relative container mx-auto px-4 py-16 md:py-24 overflow-hidden">
        {/* Fond 3D animé */}
        <AnimatedGradient />
        <ParallaxShapes />
        <FloatingShapes />
        <InteractiveParticles />
        
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 animate-fade-in">
            Envoyer ou transporter un colis facilement entre plusieurs destinations
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Kolimeet met en relation les voyageurs avec les expéditeurs pour un transport de colis sécurisé et économique.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Link to="/explorer">
              <MagneticButton size="lg" className="w-full sm:w-auto font-semibold" magnetStrength={0.4}>
                Explorer les annonces
                <ArrowRight className="ml-2 h-5 w-5" />
              </MagneticButton>
            </Link>
            <Link to="/auth/register">
              <MagneticButton size="lg" variant="outline" className="w-full sm:w-auto font-semibold" magnetStrength={0.4}>
                Créer un compte
              </MagneticButton>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-secondary py-16 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Comment ça marche ?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <TiltCard className="p-6 border-2" tiltAmount={10}>
              <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center mb-4 hover:rotate-12 transition-transform duration-300">
                <Package className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">
                Publiez votre annonce
              </h3>
              <p className="text-muted-foreground">
                Que vous soyez voyageur ou expéditeur, créez votre annonce en quelques clics.
              </p>
            </TiltCard>

            <TiltCard className="p-6 border-2" tiltAmount={10}>
              <div className="h-12 w-12 rounded-lg bg-success flex items-center justify-center mb-4 hover:rotate-12 transition-transform duration-300">
                <Users className="h-6 w-6 text-success-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">
                Trouvez votre match
              </h3>
              <p className="text-muted-foreground">
                Parcourez les annonces et contactez les personnes qui correspondent à vos besoins.
              </p>
            </TiltCard>

            <TiltCard className="p-6 border-2" tiltAmount={10}>
              <div className="h-12 w-12 rounded-lg bg-accent flex items-center justify-center mb-4 hover:rotate-12 transition-transform duration-300">
                <Shield className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">
                Échangez en toute sécurité
              </h3>
              <p className="text-muted-foreground">
                Communiquez directement avec les autres utilisateurs via notre plateforme sécurisée.
              </p>
            </TiltCard>
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
            Rejoignez Kolimeet aujourd'hui et découvrez une nouvelle façon d'envoyer vos colis.
          </p>
          <Link to="/auth/register">
            <MagneticButton size="lg" className="font-semibold shadow-lg hover:shadow-xl" magnetStrength={0.5}>
              S'inscrire gratuitement
            </MagneticButton>
          </Link>
        </div>
      </section>
    </>
  );
};

export default Home;
