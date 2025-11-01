import { useRef, useState } from 'react';
import { Card } from '@/components/ui/card';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  tiltAmount?: number;
}

export default function TiltCard({ children, className = '', tiltAmount = 15 }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    
    // Position de la souris relative au centre de la carte
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convertir en pourcentage (-1 à 1)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * tiltAmount;
    const rotateY = ((centerX - x) / centerX) * tiltAmount;
    
    // Ajouter un effet de brillance qui suit la souris
    const glowX = (x / rect.width) * 100;
    const glowY = (y / rect.height) * 100;
    
    setTransform(
      `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`
    );
    
    // Appliquer le gradient de brillance
    card.style.background = `
      radial-gradient(circle at ${glowX}% ${glowY}%, rgba(31, 111, 235, 0.2), transparent 50%),
      hsl(var(--card))
    `;
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    if (cardRef.current) {
      cardRef.current.style.background = 'hsl(var(--card))';
    }
  };

  return (
    <div className="group relative">
      <Card
        ref={cardRef}
        className={`transition-all duration-200 ease-out ${className}`}
        style={{
          transform,
          transformStyle: 'preserve-3d',
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div style={{ transform: 'translateZ(50px)' }}>
          {children}
        </div>
      </Card>
      
      {/* Ombre qui s'adapte à l'inclinaison */}
      <div
        className="absolute inset-0 -z-10 rounded-lg bg-black/20 blur-xl transition-all duration-200"
        style={{
          transform: transform.replace('scale3d(1.02, 1.02, 1.02)', 'scale3d(0.95, 0.95, 0.95) translateZ(-50px)'),
          opacity: transform.includes('rotateX') ? 0.3 : 0,
        }}
      />
    </div>
  );
}
