import { motion, useInView, Variants } from 'framer-motion';
import { useRef, ReactNode, useState, useEffect } from 'react';
import { usePrefersReducedMotion } from '@/hooks/useScrollSync';

/**
 * Composants de révélation premium avec Framer Motion
 * GPU-friendly, respect prefers-reduced-motion
 */

interface RevealProps {
  children: ReactNode;
  /**
   * Type d'animation
   */
  variant?: 'fadeUp' | 'fadeDown' | 'fadeLeft' | 'fadeRight' | 'scale' | 'clip';
  /**
   * Délai avant démarrage (s)
   */
  delay?: number;
  /**
   * Durée de l'animation (s)
   */
  duration?: number;
  /**
   * Classes CSS
   */
  className?: string;
  /**
   * Trigger une seule fois
   */
  once?: boolean;
  /**
   * Threshold IntersectionObserver
   */
  threshold?: number;
}

const variants: Record<string, Variants> = {
  fadeUp: {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  },
  fadeDown: {
    hidden: { opacity: 0, y: -40 },
    visible: { opacity: 1, y: 0 },
  },
  fadeLeft: {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0 },
  },
  fadeRight: {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  },
  clip: {
    hidden: { clipPath: 'inset(0 100% 0 0)' },
    visible: { clipPath: 'inset(0 0% 0 0)' },
  },
};

export function Reveal({
  children,
  variant = 'fadeUp',
  delay = 0,
  duration = 0.6,
  className,
  once = true,
  threshold = 0.1,
}: RevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount: threshold });
  const prefersReducedMotion = usePrefersReducedMotion();

  // Pas d'animation si prefers-reduced-motion
  if (prefersReducedMotion) {
    return <div ref={ref} className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={variants[variant]}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1], // easeInOut premium
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger children révélation
 */
interface StaggerProps {
  children: ReactNode;
  /**
   * Délai entre chaque enfant (s)
   */
  staggerDelay?: number;
  /**
   * Variant pour enfants
   */
  variant?: 'fadeUp' | 'fadeDown' | 'fadeLeft' | 'fadeRight' | 'scale';
  className?: string;
}

export function Stagger({
  children,
  staggerDelay = 0.1,
  variant = 'fadeUp',
  className,
}: StaggerProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion) {
    return <div ref={ref} className={className}>{children}</div>;
  }

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={containerVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Scroll progress bar
 */
export function ScrollProgressBar() {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-0.5 bg-primary z-50 origin-left"
      style={{ scaleX: 0 }}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: false, amount: 'all' }}
      transition={{ duration: 0.2, ease: 'linear' }}
    />
  );
}

/**
 * Hover premium pour cartes
 */
interface HoverCardProps {
  children: ReactNode;
  className?: string;
  /**
   * Intensité du lift (px)
   */
  liftAmount?: number;
}

export function HoverCard({ children, className, liftAmount = 8 }: HoverCardProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      whileHover={{
        y: -liftAmount,
        transition: {
          duration: 0.3,
          ease: [0.25, 0.1, 0.25, 1],
        },
      }}
      style={{
        transformStyle: 'preserve-3d',
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Counter animé
 */
interface AnimatedCounterProps {
  from: number;
  to: number;
  duration?: number;
  /**
   * Formatter (ex: pour ajouter %, €, etc.)
   */
  format?: (value: number) => string;
  className?: string;
}

export function AnimatedCounter({
  from,
  to,
  duration = 2,
  format = (v) => Math.round(v).toString(),
  className,
}: AnimatedCounterProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 1 });
  const prefersReducedMotion = usePrefersReducedMotion();
  
  const [count, setCount] = useState(from);

  useEffect(() => {
    if (!isInView || prefersReducedMotion) {
      setCount(to);
      return;
    }

    const startTime = Date.now();
    const range = to - from;

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOut
      
      setCount(from + range * eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, from, to, duration, prefersReducedMotion]);

  return (
    <span ref={ref} className={className}>
      {format(count)}
    </span>
  );
}
