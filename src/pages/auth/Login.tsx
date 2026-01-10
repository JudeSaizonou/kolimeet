import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect, useRef } from "react";
import { Separator } from "@/components/ui/separator";
import { GlassCard } from "@/components/LiquidGlass";

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

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;

      wavePointsRef.current.push({
        x: e.clientX,
        y: e.clientY,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        intensity: 1,
      });

      if (wavePointsRef.current.length > 30) {
        wavePointsRef.current.shift();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    let animationId: number;
    const animate = () => {
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.15;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.15;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      wavePointsRef.current = wavePointsRef.current.filter(point => {
        point.intensity *= 0.95;
        point.x += point.vx;
        point.y += point.vy;
        return point.intensity > 0.01;
      });

      const gridSize = 40;
      const rows = Math.ceil(canvas.height / gridSize) + 1;
      const cols = Math.ceil(canvas.width / gridSize) + 1;

      ctx.strokeStyle = 'rgba(31, 111, 235, 0.15)';
      ctx.lineWidth = 1.5;

      for (let i = 0; i < rows; i++) {
        ctx.beginPath();
        for (let j = 0; j < cols; j++) {
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

          if (j === 0) {
            ctx.moveTo(finalX, finalY);
          } else {
            ctx.lineTo(finalX, finalY);
          }
        }
        ctx.stroke();
      }

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

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const [isButtonRunning, setIsButtonRunning] = useState(false);
  const { signInWithEmail, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      // Vérifier s'il y a une URL de retour stockée
      const returnTo = localStorage.getItem("returnTo");
      if (returnTo) {
        localStorage.removeItem("returnTo");
        navigate(returnTo);
      } else {
        navigate("/");
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signInWithEmail(email, password);
  };

  const isFormValid = email.trim() !== "" && password.trim() !== "";

  const handleButtonHover = () => {
    if (!isFormValid && !isButtonRunning) {
      setIsButtonRunning(true);
      // Génère une position aléatoire pour faire fuir le bouton
      const randomX = (Math.random() - 0.5) * 200; // -100 à 100
      const randomY = (Math.random() - 0.5) * 100; // -50 à 50
      setButtonPosition({ x: randomX, y: randomY });
      
      // Réinitialise après l'animation
      setTimeout(() => {
        setButtonPosition({ x: 0, y: 0 });
        setIsButtonRunning(false);
      }, 600);
    }
  };

  return (
    <>
      {/* Effet de vague */}
      <MouseWaveEffect />
      
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden pt-20 md:pt-28">
      {/* Image de fond qui remonte pour couvrir la navigation */}
      <div 
        className="absolute w-full h-full"
        style={{
          backgroundImage: 'url(/delivery-person-getting-parcel-out-delivery.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          zIndex: 0,
          top: '-4rem',
          bottom: 0,
          height: 'calc(100% + 4rem)',
        }}
      />
      
      {/* Overlay sombre pour améliorer la lisibilité */}
      <div 
        className="absolute w-full h-full bg-black/30"
        style={{ 
          zIndex: 1,
          top: '-4rem',
          bottom: 0,
          height: 'calc(100% + 4rem)',
        }}
      />

      <GlassCard
        intensity="medium"
        variant="iridescent"
        padding="lg"
        rounded="xl"
        className="w-full max-w-md relative backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl z-10"
      >
        <h1 className="text-2xl font-bold text-center text-foreground mb-2">
          Bon retour !
        </h1>
        <p className="text-center text-muted-foreground mb-6">
          Connectez-vous à votre compte
        </p>

        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={signInWithGoogle}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continuer avec Google
          </Button>
        </div>

        <div className="relative my-6">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
            ou
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Mot de passe</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div 
            onMouseEnter={handleButtonHover}
            className="relative"
            style={{
              transform: `translate(${buttonPosition.x}px, ${buttonPosition.y}px)`,
              transition: isButtonRunning ? 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)' : 'transform 0.3s ease',
            }}
          >
            <Button 
              type="submit" 
              className={`w-full font-semibold ${!isFormValid ? 'cursor-not-allowed' : ''}`}
              disabled={!isFormValid}
            >
              Se connecter
            </Button>
          </div>

          {!isFormValid && (
            <p className="text-xs text-center text-muted-foreground italic">
              Remplissez les champs pour continuer
            </p>
          )}
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link to="/auth/register" className="text-primary font-medium hover:underline">
              S'inscrire
            </Link>
          </p>
        </div>
      </GlassCard>
    </div>
    </>
  );
};

export default Login;
