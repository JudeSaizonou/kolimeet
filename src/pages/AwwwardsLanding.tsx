import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LenisProvider } from '@/components/LenisProvider';
import { ScrollSection, Spacer } from '@/components/ScrollSection';
import { ThreeStage } from '@/components/ThreeStage';
import { ThreeHero } from '@/components/ThreeHero';
import { useScrollSync } from '@/hooks/useScrollSync';
import { Reveal, Stagger, HoverCard, ScrollProgressBar } from '@/components/Reveal';
import {
  GlassCard,
  GlassButton,
  GlassSectionBg,
  GlassText,
} from '@/components/LiquidGlass';
import { Package, Users, Shield, TrendingUp } from 'lucide-react';

/**
 * Effet de déformation en vague qui suit la souris
 */
function MouseWaveEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const wavePointsRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; intensity: number }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Redimensionne le canvas
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Suit le mouvement de la souris avec interpolation
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;

      // Ajoute un nouveau point de vague à la position actuelle
      wavePointsRef.current.push({
        x: e.clientX,
        y: e.clientY,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        intensity: 1,
      });

      // Limite le nombre de points
      if (wavePointsRef.current.length > 30) {
        wavePointsRef.current.shift();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation
    let animationId: number;
    const animate = () => {
      // Interpolation fluide de la souris
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.15;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.15;

      // Efface le canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Mise à jour et dessin des points de vague
      wavePointsRef.current = wavePointsRef.current.filter(point => {
        point.intensity *= 0.95; // Diminue l'intensité
        point.x += point.vx;
        point.y += point.vy;
        return point.intensity > 0.01;
      });

      // Dessine la grille déformée
      const gridSize = 40;
      const rows = Math.ceil(canvas.height / gridSize) + 1;
      const cols = Math.ceil(canvas.width / gridSize) + 1;

      ctx.strokeStyle = 'rgba(31, 111, 235, 0.15)';
      ctx.lineWidth = 1.5;

      // Lignes horizontales avec déformation
      for (let i = 0; i < rows; i++) {
        ctx.beginPath();
        for (let j = 0; j < cols; j++) {
          const x = j * gridSize;
          const y = i * gridSize;

          // Calcule la déformation basée sur la distance à la souris et aux points de vague
          let offsetX = 0;
          let offsetY = 0;

          // Effet de la position actuelle de la souris
          const dx = x - mouseRef.current.x;
          const dy = y - mouseRef.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDistance = 200;

          if (distance < maxDistance) {
            const influence = (1 - distance / maxDistance) * 30;
            const angle = Math.atan2(dy, dx);
            offsetX = Math.cos(angle + Math.PI / 2) * influence * Math.sin(Date.now() / 500);
            offsetY = Math.sin(angle + Math.PI / 2) * influence * Math.sin(Date.now() / 500);
          }

          // Effet des points de vague
          wavePointsRef.current.forEach(point => {
            const pdx = x - point.x;
            const pdy = y - point.y;
            const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
            const pmax = 150;

            if (pdist < pmax) {
              const pinfluence = (1 - pdist / pmax) * 20 * point.intensity;
              const pangle = Math.atan2(pdy, pdx);
              offsetX += Math.cos(pangle) * pinfluence;
              offsetY += Math.sin(pangle) * pinfluence;
            }
          });

          const finalX = x + offsetX;
          const finalY = y + offsetY;

          if (j === 0) {
            ctx.moveTo(finalX, finalY);
          } else {
            ctx.lineTo(finalX, finalY);
          }
        }
        ctx.stroke();
      }

      // Lignes verticales avec déformation
      for (let j = 0; j < cols; j++) {
        ctx.beginPath();
        for (let i = 0; i < rows; i++) {
          const x = j * gridSize;
          const y = i * gridSize;

          let offsetX = 0;
          let offsetY = 0;

          const dx = x - mouseRef.current.x;
          const dy = y - mouseRef.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDistance = 200;

          if (distance < maxDistance) {
            const influence = (1 - distance / maxDistance) * 30;
            const angle = Math.atan2(dy, dx);
            offsetX = Math.cos(angle + Math.PI / 2) * influence * Math.sin(Date.now() / 500);
            offsetY = Math.sin(angle + Math.PI / 2) * influence * Math.sin(Date.now() / 500);
          }

          wavePointsRef.current.forEach(point => {
            const pdx = x - point.x;
            const pdy = y - point.y;
            const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
            const pmax = 150;

            if (pdist < pmax) {
              const pinfluence = (1 - pdist / pmax) * 20 * point.intensity;
              const pangle = Math.atan2(pdy, pdx);
              offsetX += Math.cos(pangle) * pinfluence;
              offsetY += Math.sin(pangle) * pinfluence;
            }
          });

          const finalX = x + offsetX;
          const finalY = y + offsetY;

          if (i === 0) {
            ctx.moveTo(finalX, finalY);
          } else {
            ctx.lineTo(finalX, finalY);
          }
        }
        ctx.stroke();
      }

      // Dessine un cercle lumineux à la position de la souris
      const gradient = ctx.createRadialGradient(
        mouseRef.current.x, mouseRef.current.y, 0,
        mouseRef.current.x, mouseRef.current.y, 100
      );
      gradient.addColorStop(0, 'rgba(31, 111, 235, 0.3)');
      gradient.addColorStop(0.5, 'rgba(31, 111, 235, 0.1)');
      gradient.addColorStop(1, 'rgba(31, 111, 235, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(mouseRef.current.x, mouseRef.current.y, 100, 0, Math.PI * 2);
      ctx.fill();

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}

/**
 * Landing Page Awwwards-level avec effet Liquid Glass
 * Démo avec 3 sections: Hero 3D, Features, Editorial
 */

function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const { progress } = useScrollSync(ref, { easing: 'easeInOut', debug: true });

  console.log('🎯 HERO SCROLL:', {
    progress: progress.toFixed(3),
    percentage: `${(progress * 100).toFixed(1)}%`,
    phase: progress < 0.33 ? '🚀 START' : progress < 0.66 ? '⚡ MID' : '🎆 END'
  });

  return (
    <ScrollSection ref={ref} intent="hero" className="relative overflow-hidden bg-transparent -mt-20">
      {/* Image de fond pour toute la section - couvre tout incluant les paddings */}
      <div 
        className="absolute -top-20 left-0 right-0 bottom-0 w-full"
        style={{
          backgroundImage: 'url(/delivery-person-getting-parcel-out-delivery.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          zIndex: 0,
          height: 'calc(100% + 5rem)',
        }}
      />
      
      {/* Overlay sombre pour améliorer la lisibilité */}
      <div 
        className="absolute -top-20 left-0 right-0 bottom-0 w-full bg-black/30"
        style={{ 
          zIndex: 1,
          height: 'calc(100% + 5rem)',
        }}
      />

      {/* Glass background avec distorsion animée */}
      <div className="relative" style={{ zIndex: 2 }}>
        <GlassSectionBg
          intensity="subtle"
          variant="iridescent"
          liquidDistortion={true}
          animatedReflections={true}
          pattern="dots"
          tintColor="rgba(31, 111, 235, 0.05)"
        />
      </div>

      {/* Canvas 3D en arrière-plan avec plusieurs sphères */}
      <div className="absolute inset-0" style={{ zIndex: 3 }}>
        <ThreeStage
          backgroundColor="transparent"
          alwaysRender={true}
          cameraPosition={[0, 0, 8]}
          className="w-full h-full"
        >
          {/* Sphère principale en bas à droite */}
          <ThreeHero progress={progress} color="#1F6FEB" debug={false} />
          
          {/* Sphères supplémentaires à différentes positions */}
          <group position={[-3, 1, 0]}>
            <ThreeHero progress={progress * 0.8} color="#3B82F6" debug={false} />
          </group>
          
          <group position={[0, -2, -1]}>
            <ThreeHero progress={progress * 1.2} color="#0EA5E9" debug={false} />
          </group>
          
          <group position={[-1, 2.5, 0]}>
            <ThreeHero progress={progress * 0.6} color="#1F6FEB" debug={false} />
          </group>
        </ThreeStage>
      </div>

      {/* Contenu texte avec Glass Cards */}
      <div 
        className="relative flex flex-col items-center justify-center min-h-screen text-center px-4"
        style={{
          transform: `translateY(${progress * -50}px) scale(${1 + progress * 0.1})`,
          opacity: 1 - progress * 0.3,
          zIndex: 10,
        }}
      >
        <Reveal variant="fadeUp" delay={0.2}>
          <div
            style={{
              transform: `rotate(${progress * -2}deg)`,
            }}
          >
            <GlassCard
              intensity="subtle"
              variant="default"
              liquidDistortion={false}
              animatedReflections={false}
              glowBorder={true}
              padding="xl"
              rounded="3xl"
              hoverLift={true}
              className="mb-10 bg-white/5 backdrop-blur-md"
            >
              <h1 
                className="text-fluid-6xl font-bold mb-6 text-foreground"
                style={{
                  transform: `translateX(${Math.sin(progress * Math.PI * 2) * 10}px)`,
                }}
              >
                Envoyer ou transporter
                <br />
                un colis facilement
              </h1>
              <p 
                className="text-fluid-xl text-muted-foreground max-w-2xl"
                style={{
                  transform: `translateX(${Math.sin(progress * Math.PI * 2 + Math.PI) * 10}px)`,
                }}
              >
                kilomeet met en relation les voyageurs avec les expéditeurs pour un
                transport de colis sécurisé et économique.
              </p>
            </GlassCard>
          </div>
        </Reveal>

        <Reveal variant="fadeUp" delay={0.6}>
          <div 
            className="flex flex-wrap gap-4 justify-center"
            style={{
              transform: `scale(${1 - progress * 0.2})`,
            }}
          >
            <GlassButton
              intensity="medium"
              variant="default"
              liquidDistortion={false}
              glowBorder={true}
              size="lg"
              buttonVariant="primary"
              onClick={() => navigate('/explorer')}
            >
              Explorer les annonces
            </GlassButton>
            <GlassButton
              intensity="medium"
              variant="default"
              liquidDistortion={false}
              glowBorder={true}
              size="lg"
              buttonVariant="secondary"
              onClick={() => navigate('/auth/register')}
            >
              Créer un compte
            </GlassButton>
          </div>
        </Reveal>

        {/* Scroll indicator avec Glass effect */}
        <Reveal variant="fadeUp" delay={0.8}>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
            <GlassCard
              intensity="subtle"
              variant="frosted"
              liquidDistortion={false}
              glowBorder={true}
              padding="sm"
              rounded="3xl"
              hoverLift={false}
              className="w-6 h-10 flex items-start justify-center bg-white/70"
            >
              <div className="w-1 h-2 bg-foreground/80 rounded-full animate-bounce" />
            </GlassCard>
          </div>
        </Reveal>
      </div>
    </ScrollSection>
  );
}

function FeaturesSection() {
  const ref = useRef<HTMLElement>(null);
  const { progress } = useScrollSync(ref, { easing: 'linear', debug: false });

  const features = [
    {
      color: '#1F6FEB',
      icon: Package,
      label: 'Publiez',
      title: 'Publiez votre annonce',
      description: 'Que vous soyez voyageur ou expéditeur, créez votre annonce en quelques clics.',
    },
    {
      color: '#10B981',
      icon: Users,
      label: 'Trouvez',
      title: 'Trouvez votre match',
      description: 'Parcourez les annonces et contactez les personnes qui correspondent.',
    },
    {
      color: '#F59E0B',
      icon: Shield,
      label: 'Échangez',
      title: 'Échangez en sécurité',
      description: 'Communiquez via notre plateforme sécurisée avec système de paiement escrow.',
    },
  ];

  const currentStep = Math.floor(progress * features.length);

  return (
    <ScrollSection ref={ref} intent="feature" background="default" className="relative">
      {/* Glass background avec effet waves */}
      <GlassSectionBg
        intensity="subtle"
        variant="frosted"
        liquidDistortion={true}
        animatedReflections={false}
        pattern="waves"
        tintColor="rgba(16, 185, 129, 0.03)"
      />

      <div className="max-w-7xl mx-auto px-4">
        {/* Titre */}
        <Reveal variant="fadeUp">
          <GlassCard
            intensity="subtle"
            variant="default"
            liquidDistortion={false}
            animatedReflections={false}
            glowBorder={true}
            padding="lg"
            rounded="2xl"
            hoverLift={false}
            className="text-center bg-white/80 mb-12"
          >
            <h2 className="text-fluid-4xl font-bold text-foreground">
              Comment ça marche ?
            </h2>
          </GlassCard>
        </Reveal>

        {/* Cards avec animations synchronisées au scroll */}
        <Stagger staggerDelay={0.15}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isActive = currentStep === index;
              const cardProgress = Math.max(0, Math.min(1, (progress * features.length) - index));
              
              return (
                <Reveal key={index} variant="fadeUp">
                  <div
                    style={{
                      transform: `scale(${1 + cardProgress * 0.05}) translateY(${-cardProgress * 10}px)`,
                      opacity: 0.5 + cardProgress * 0.5,
                      transition: 'all 0.3s ease-out',
                    }}
                  >
                    <GlassCard
                      intensity={isActive ? 'medium' : 'subtle'}
                      variant={isActive ? 'default' : 'frosted'}
                      liquidDistortion={false}
                      animatedReflections={false}
                      glowBorder={isActive}
                      padding="lg"
                      rounded="xl"
                      hoverLift={true}
                      className="bg-white/80"
                    >
                    {/* Icône avec animation */}
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center mb-4 mx-auto backdrop-blur-sm"
                      style={{ 
                        backgroundColor: `${feature.color}${isActive ? 'DD' : '99'}`,
                        transform: `rotate(${cardProgress * 360}deg) scale(${1 + cardProgress * 0.2})`,
                        transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      }}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    {/* Numéro */}
                    <div className="text-center mb-3">
                      <span 
                        className="text-4xl font-bold"
                        style={{ 
                          color: feature.color,
                          opacity: 0.3 + cardProgress * 0.7,
                        }}
                      >
                        {index + 1}
                      </span>
                    </div>

                    {/* Texte */}
                    <h3 
                      className="text-fluid-2xl font-semibold mb-3 text-foreground text-center"
                      style={{
                        transform: `translateX(${Math.sin(cardProgress * Math.PI) * 5}px)`,
                      }}
                    >
                      {feature.title}
                    </h3>
                    <p 
                      className="text-fluid-base text-muted-foreground text-center"
                      style={{
                        opacity: 0.6 + cardProgress * 0.4,
                      }}
                    >
                      {feature.description}
                    </p>

                    {/* Barre de progression */}
                    <div className="mt-4 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${cardProgress * 100}%`,
                          backgroundColor: feature.color,
                        }}
                      />
                    </div>
                  </GlassCard>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </Stagger>
      </div>
    </ScrollSection>
  );
}

function StatsSection() {
  const ref = useRef<HTMLElement>(null);
  const { progress } = useScrollSync(ref, { easing: 'easeOut', debug: false });

  const stats = [
    { 
      icon: Users, 
      value: 2500, 
      label: 'Utilisateurs actifs',
      suffix: '+',
      color: '#1F6FEB'
    },
    { 
      icon: Package, 
      value: 1200, 
      label: 'Colis transportés',
      suffix: '+',
      color: '#10B981'
    },
    { 
      icon: TrendingUp, 
      value: 98, 
      label: 'Taux de satisfaction',
      suffix: '%',
      color: '#F59E0B'
    },
    { 
      icon: Shield, 
      value: 100, 
      label: 'Transactions sécurisées',
      suffix: '%',
      color: '#8B5CF6'
    },
  ];

  return (
    <ScrollSection ref={ref} intent="feature" background="secondary" className="relative">
      {/* Glass background avec dots pattern */}
      <GlassSectionBg
        intensity="subtle"
        variant="iridescent"
        liquidDistortion={true}
        animatedReflections={true}
        pattern="dots"
        tintColor="rgba(139, 92, 246, 0.03)"
      />

      <div className="max-w-7xl mx-auto px-4">
        {/* Titre */}
        <Reveal variant="fadeUp">
          <div className="text-center mb-16">
            <h2 
              className="text-fluid-5xl font-bold text-foreground mb-4"
              style={{
                transform: `translateY(${-progress * 20}px)`,
                opacity: 1 - progress * 0.3,
              }}
            >
              kilomeet en chiffres
            </h2>
            <p 
              className="text-fluid-xl text-muted-foreground"
              style={{
                transform: `translateY(${-progress * 15}px)`,
                opacity: 1 - progress * 0.4,
              }}
            >
              Une communauté qui grandit chaque jour
            </p>
          </div>
        </Reveal>

        {/* Stats grid avec animations */}
        <Stagger staggerDelay={0.1}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              const statProgress = Math.max(0, Math.min(1, progress * 2));
              const animatedValue = Math.floor(stat.value * statProgress);
              const rotation = Math.sin(progress * Math.PI * 2 + index) * 5;
              
              return (
                <Reveal key={index} variant="fadeUp">
                  <div
                    style={{
                      transform: `rotate(${rotation}deg) scale(${0.95 + statProgress * 0.05})`,
                      transition: 'transform 0.3s ease-out',
                    }}
                  >
                    <GlassCard
                      intensity="medium"
                      variant="default"
                      liquidDistortion={false}
                      animatedReflections={false}
                      glowBorder={true}
                      padding="lg"
                      rounded="2xl"
                      hoverLift={true}
                      className="bg-white/90 text-center"
                    >
                      {/* Icône animée */}
                      <div 
                        className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: `${stat.color}15`,
                          transform: `scale(${1 + Math.sin(progress * Math.PI * 4 + index) * 0.1})`,
                        }}
                      >
                        <Icon 
                          className="w-8 h-8"
                          style={{ 
                            color: stat.color,
                            transform: `rotate(${progress * 360}deg)`,
                            transition: 'transform 0.5s ease-out',
                          }}
                        />
                      </div>

                      {/* Valeur animée */}
                      <div 
                        className="text-fluid-5xl font-bold mb-2"
                        style={{ 
                          color: stat.color,
                          transform: `scale(${1 + statProgress * 0.1})`,
                        }}
                      >
                        {animatedValue}{stat.suffix}
                      </div>

                      {/* Label */}
                      <p 
                        className="text-fluid-base text-muted-foreground font-medium"
                        style={{
                          opacity: 0.6 + statProgress * 0.4,
                        }}
                      >
                        {stat.label}
                      </p>

                      {/* Barre de progression circulaire */}
                      <div className="mt-4">
                        <div 
                          className="h-1 rounded-full overflow-hidden"
                          style={{ backgroundColor: `${stat.color}20` }}
                        >
                          <div
                            className="h-full transition-all duration-1000 ease-out"
                            style={{
                              width: `${statProgress * 100}%`,
                              backgroundColor: stat.color,
                            }}
                          />
                        </div>
                      </div>
                    </GlassCard>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </Stagger>

        {/* CTA avec animation */}
        <Reveal variant="fadeUp" delay={0.4}>
          <div 
            className="text-center mt-16"
            style={{
              transform: `translateY(${progress * 30}px)`,
              opacity: 1 - progress * 0.5,
            }}
          >
            <GlassButton
              intensity="strong"
              variant="iridescent"
              liquidDistortion={true}
              glowBorder={true}
              size="lg"
              buttonVariant="primary"
              onClick={() => window.location.href = '/auth/register'}
            >
              Rejoindre la communauté
            </GlassButton>
          </div>
        </Reveal>
      </div>
    </ScrollSection>
  );
}

function EditorialSection() {
  return (
    <ScrollSection intent="content" maxWidth="lg" className="relative">
      {/* Glass background avec grid pattern */}
      <GlassSectionBg
        intensity="subtle"
        variant="crystal"
        liquidDistortion={true}
        animatedReflections={false}
        pattern="grid"
        tintColor="rgba(245, 158, 11, 0.03)"
      />

      <div className="relative z-10 px-4">
        <Reveal variant="fadeUp">
          <GlassCard
            intensity="subtle"
            variant="default"
            liquidDistortion={false}
            animatedReflections={false}
            glowBorder={true}
            padding="lg"
            rounded="2xl"
            hoverLift={false}
            className="mb-12 text-center bg-white/80"
          >
            <h2 className="text-fluid-4xl font-bold text-foreground">
              Une plateforme de confiance
            </h2>
          </GlassCard>
        </Reveal>

        <Spacer size={10} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <Reveal variant="fadeLeft">
            <GlassCard
              intensity="subtle"
              variant="frosted"
              liquidDistortion={false}
              animatedReflections={false}
              glowBorder={true}
              padding="xl"
              rounded="2xl"
              hoverLift={true}
              className="bg-white/80"
            >
              <h3 className="text-fluid-3xl font-semibold mb-6 text-foreground">
                Paiement sécurisé avec escrow (En cours de développement)
              </h3>
              <p className="text-fluid-lg text-muted-foreground leading-relaxed mb-6">
                Les fonds sont bloqués jusqu'à la confirmation de livraison. Le voyageur
                ne reçoit son paiement qu'une fois le colis remis au destinataire.
              </p>
              <p className="text-fluid-lg text-muted-foreground leading-relaxed">
                Commission transparente sur chaque transaction, avec support pour
                les paiements carte (Europe) et mobile money (Afrique).
              </p>
            </GlassCard>
          </Reveal>

          <Reveal variant="fadeRight">
            <GlassCard
              intensity="subtle"
              variant="default"
              liquidDistortion={false}
              animatedReflections={false}
              glowBorder={true}
              padding="xl"
              rounded="2xl"
              hoverLift={true}
              className="bg-white/80"
            >
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="p-6 rounded-xl bg-primary/5">
                    <div className="text-fluid-5xl font-bold mb-2 text-primary">
                      %
                    </div>
                    <div className="text-fluid-base text-muted-foreground">
                      Commission plateforme
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="p-6 rounded-xl bg-success/5">
                    <div className="text-fluid-5xl font-bold mb-2 text-success">
                      100%
                    </div>
                    <div className="text-fluid-base text-muted-foreground">
                      Sécurisé
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </Reveal>
        </div>

        <Spacer size={17} />

        <Reveal variant="fadeUp">
          <div className="text-center">
            <GlassButton
              intensity="medium"
              variant="default"
              liquidDistortion={false}
              glowBorder={true}
              size="xl"
              buttonVariant="primary"
              onClick={() => window.location.href = '/auth/register'}
            >
              S'inscrire gratuitement
            </GlassButton>
          </div>
        </Reveal>
      </div>
    </ScrollSection>
  );
}

export default function AwwwardsLanding() {
  return (
    <LenisProvider>
      {/* Mouse wave effect */}
      <MouseWaveEffect />
      
      {/* Scroll progress bar */}
      <ScrollProgressBar />

      {/* Sections */}
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <EditorialSection />
    </LenisProvider>
  );
}
