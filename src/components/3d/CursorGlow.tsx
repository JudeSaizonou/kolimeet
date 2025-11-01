import { useEffect, useState } from 'react';

export default function CursorGlow() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.body.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <>
      {/* Lueur principale qui suit le curseur */}
      <div
        className="fixed pointer-events-none z-50 mix-blend-screen"
        style={{
          left: mousePosition.x,
          top: mousePosition.y,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div className="w-32 h-32 rounded-full bg-primary/30 blur-3xl animate-pulse" />
      </div>

      {/* Deuxième lueur avec délai pour effet de traînée */}
      <div
        className="fixed pointer-events-none z-40 mix-blend-screen transition-all duration-300 ease-out"
        style={{
          left: mousePosition.x,
          top: mousePosition.y,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div className="w-24 h-24 rounded-full bg-accent/20 blur-2xl" />
      </div>

      {/* Troisième lueur encore plus lente */}
      <div
        className="fixed pointer-events-none z-30 mix-blend-screen transition-all duration-700 ease-out"
        style={{
          left: mousePosition.x,
          top: mousePosition.y,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div className="w-40 h-40 rounded-full bg-success/15 blur-3xl" />
      </div>
    </>
  );
}
