import { useEffect, useState } from 'react';

export default function ParallaxShapes() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normaliser entre -1 et 1
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Cercle bleu qui suit la souris */}
      <div
        className="absolute w-96 h-96 rounded-full bg-primary/10 blur-3xl transition-transform duration-500 ease-out"
        style={{
          top: '20%',
          left: '20%',
          transform: `translate(${mousePosition.x * 50}px, ${mousePosition.y * 50}px)`,
        }}
      />
      
      {/* Cercle jaune avec effet parallax inversé */}
      <div
        className="absolute w-80 h-80 rounded-full bg-accent/15 blur-3xl transition-transform duration-700 ease-out"
        style={{
          top: '50%',
          right: '20%',
          transform: `translate(${mousePosition.x * -40}px, ${mousePosition.y * -40}px) rotate(${mousePosition.x * 10}deg)`,
        }}
      />
      
      {/* Cercle vert qui suit plus lentement */}
      <div
        className="absolute w-72 h-72 rounded-full bg-success/12 blur-3xl transition-transform duration-1000 ease-out"
        style={{
          bottom: '15%',
          left: '40%',
          transform: `translate(${mousePosition.x * 30}px, ${mousePosition.y * 30}px) scale(${1 + mousePosition.x * 0.1})`,
        }}
      />

      {/* Formes géométriques qui réagissent */}
      <div
        className="absolute w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent blur-2xl transition-all duration-500"
        style={{
          top: '60%',
          right: '35%',
          transform: `translate(${mousePosition.x * -30}px, ${mousePosition.y * 40}px) rotate(${mousePosition.x * 20}deg)`,
          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
        }}
      />
      
      <div
        className="absolute w-56 h-56 bg-gradient-to-tl from-success/20 to-transparent blur-2xl transition-all duration-700"
        style={{
          top: '30%',
          left: '60%',
          transform: `translate(${mousePosition.x * 45}px, ${mousePosition.y * -35}px) rotate(${mousePosition.y * 15}deg)`,
          clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
        }}
      />
    </div>
  );
}
