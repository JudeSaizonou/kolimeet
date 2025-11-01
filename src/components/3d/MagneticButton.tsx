import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  magnetStrength?: number;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export default function MagneticButton({
  children,
  className = '',
  onClick,
  magnetStrength = 0.3,
  size,
  variant,
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;

    const button = buttonRef.current;
    const rect = button.getBoundingClientRect();
    
    // Position de la souris relative au centre du bouton
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;
    
    // Distance de la souris au centre
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = rect.width; // Distance maximale d'attraction
    
    if (distance < maxDistance) {
      // Appliquer l'effet magnétique
      const strength = (1 - distance / maxDistance) * magnetStrength;
      setPosition({
        x: deltaX * strength,
        y: deltaY * strength,
      });
    } else {
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <Button
      ref={buttonRef}
      className={`transition-all duration-200 ease-out ${className}`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px) scale(${position.x || position.y ? 1.05 : 1})`,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      size={size}
      variant={variant}
    >
      {children}
    </Button>
  );
}
