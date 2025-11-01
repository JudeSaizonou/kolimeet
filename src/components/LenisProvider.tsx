import { ReactNode, useEffect, useRef } from 'react';
import Lenis from '@studio-freight/lenis';
import { usePrefersReducedMotion } from '@/hooks/useScrollSync';

/**
 * Provider Lenis pour smooth scroll premium
 * Désactivé automatiquement si prefers-reduced-motion
 */

interface LenisProviderProps {
  children: ReactNode;
  /**
   * Options Lenis personnalisées
   */
  options?: {
    duration?: number;
    easing?: (t: number) => number;
    smoothWheel?: boolean;
    smoothTouch?: boolean;
  };
}

export function LenisProvider({ children, options = {} }: LenisProviderProps) {
  const lenisRef = useRef<Lenis | null>(null);
  const rafRef = useRef<number>();
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    // Skip si prefers-reduced-motion
    if (prefersReducedMotion) {
      console.log('[Lenis] Disabled due to prefers-reduced-motion');
      return;
    }

    // Init Lenis
    const lenis = new Lenis({
      duration: options.duration || 1.2,
      easing: options.easing || ((t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: options.smoothWheel !== false,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
    });

    lenisRef.current = lenis;

    // RAF loop
    function raf(time: number) {
      lenis.raf(time);
      rafRef.current = requestAnimationFrame(raf);
    }

    rafRef.current = requestAnimationFrame(raf);

    // Cleanup
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [prefersReducedMotion, options]);

  return <>{children}</>;
}

/**
 * Hook pour accéder à l'instance Lenis
 */
export function useLenis() {
  return useRef<Lenis | null>(null);
}
