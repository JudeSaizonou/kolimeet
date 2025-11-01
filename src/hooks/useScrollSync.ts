import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook de synchronisation scroll ultra-performant
 * Expose progress [0,1] par section avec <8ms de latence
 * Compatible avec Lenis smooth scroll
 */

interface ScrollSyncOptions {
  /**
   * Offset en px avant le début de l'animation (défaut: 0)
   */
  offset?: number;
  /**
   * Easing de la transition (défaut: 'linear')
   */
  easing?: 'linear' | 'easeInOut' | 'easeOut' | 'easeIn';
  /**
   * Active le mode debug (console.log du progress)
   */
  debug?: boolean;
}

interface ScrollProgress {
  /**
   * Progress normalisé [0,1] pour la section
   */
  progress: number;
  /**
   * Progress global de la page [0,1]
   */
  globalProgress: number;
  /**
   * Vélocité du scroll (px/s)
   */
  velocity: number;
  /**
   * Direction du scroll
   */
  direction: 'up' | 'down' | 'idle';
  /**
   * Section visible dans le viewport
   */
  isInView: boolean;
}

const easeInOutQuad = (t: number): number => {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
};

const easeOutQuad = (t: number): number => {
  return t * (2 - t);
};

const easeInQuad = (t: number): number => {
  return t * t;
};

export function useScrollSync(
  ref: React.RefObject<HTMLElement>,
  options: ScrollSyncOptions = {}
): ScrollProgress {
  const { offset = 0, easing = 'linear', debug = false } = options;

  const [progress, setProgress] = useState<ScrollProgress>({
    progress: 0,
    globalProgress: 0,
    velocity: 0,
    direction: 'idle',
    isInView: false,
  });

  const rafId = useRef<number>();
  const lastScrollY = useRef(0);
  const lastTime = useRef(Date.now());
  const velocityRef = useRef(0);

  const applyEasing = useCallback(
    (t: number): number => {
      switch (easing) {
        case 'easeInOut':
          return easeInOutQuad(t);
        case 'easeOut':
          return easeOutQuad(t);
        case 'easeIn':
          return easeInQuad(t);
        default:
          return t;
      }
    },
    [easing]
  );

  const updateProgress = useCallback(() => {
    if (!ref.current) return;

    const element = ref.current;
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const currentScrollY = window.scrollY;
    const currentTime = Date.now();

    // Calcul de la vélocité (px/s)
    const deltaY = currentScrollY - lastScrollY.current;
    const deltaTime = Math.max(currentTime - lastTime.current, 1);
    const currentVelocity = (deltaY / deltaTime) * 1000;
    
    // Smooth velocity avec lerp
    velocityRef.current += (currentVelocity - velocityRef.current) * 0.1;

    // Direction
    const direction: 'up' | 'down' | 'idle' =
      Math.abs(deltaY) < 0.5 ? 'idle' : deltaY > 0 ? 'down' : 'up';

    // Détection si l'élément est dans le viewport
    const isInView = rect.top < windowHeight && rect.bottom > 0;

    // Calcul du progress local [0,1]
    // Start quand le bas de l'élément entre dans le viewport
    // End quand le haut de l'élément sort du viewport
    const elementHeight = element.offsetHeight;
    const start = rect.top - windowHeight + offset;
    const end = rect.top + elementHeight;
    const distance = windowHeight + elementHeight - offset;
    
    let rawProgress = (-start / distance);
    rawProgress = Math.max(0, Math.min(1, rawProgress));
    
    // Appliquer l'easing
    const easedProgress = applyEasing(rawProgress);

    // Progress global de la page
    const documentHeight = document.documentElement.scrollHeight - windowHeight;
    const globalProgress = Math.max(0, Math.min(1, currentScrollY / documentHeight));

    const newProgress: ScrollProgress = {
      progress: easedProgress,
      globalProgress,
      velocity: velocityRef.current,
      direction,
      isInView,
    };

    setProgress(newProgress);

    if (debug) {
      console.log('[useScrollSync]', {
        progress: easedProgress.toFixed(3),
        velocity: velocityRef.current.toFixed(2),
        direction,
      });
    }

    lastScrollY.current = currentScrollY;
    lastTime.current = currentTime;

    // Continue RAF seulement si nécessaire
    if (Math.abs(velocityRef.current) > 0.1 || isInView) {
      rafId.current = requestAnimationFrame(updateProgress);
    }
  }, [ref, offset, applyEasing, debug]);

  useEffect(() => {
    // IntersectionObserver pour optimiser RAF
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Lance RAF quand l'élément approche
          rafId.current = requestAnimationFrame(updateProgress);
        } else {
          // Stop RAF quand l'élément est loin
          if (rafId.current) {
            cancelAnimationFrame(rafId.current);
          }
        }
      },
      {
        // Marge de 20% pour pré-charger
        rootMargin: '20% 0px 20% 0px',
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    // Listener scroll pour relancer RAF si nécessaire
    const handleScroll = () => {
      if (!rafId.current) {
        rafId.current = requestAnimationFrame(updateProgress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [ref, updateProgress]);

  return progress;
}

/**
 * Hook pour détecter prefers-reduced-motion
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook pour détecter les capacités GPU
 */
export function useGPUCapabilities() {
  const [capabilities, setCapabilities] = useState({
    isLowEnd: false,
    hardwareConcurrency: 4,
    deviceMemory: 8,
  });

  useEffect(() => {
    const nav = navigator as any;
    const cores = nav.hardwareConcurrency || 4;
    const memory = nav.deviceMemory || 8;

    // Heuristique : <4 cores ou <4GB = low-end
    const isLowEnd = cores < 4 || memory < 4;

    setCapabilities({
      isLowEnd,
      hardwareConcurrency: cores,
      deviceMemory: memory,
    });
  }, []);

  return capabilities;
}
