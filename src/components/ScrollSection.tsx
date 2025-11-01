import { ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Composant Section avec système d'espacement Awwwards
 * Intent-based pour cohérence visuelle
 */

type SectionIntent = 'hero' | 'feature' | 'break' | 'content' | 'footer';

interface ScrollSectionProps {
  children: ReactNode;
  /**
   * Type de section pour espacement automatique
   */
  intent?: SectionIntent;
  /**
   * Classes Tailwind supplémentaires
   */
  className?: string;
  /**
   * ID pour ancres
   */
  id?: string;
  /**
   * Couleur de fond
   */
  background?: 'default' | 'secondary' | 'accent' | 'muted';
  /**
   * Padding vertical custom (override intent)
   */
  py?: string;
  /**
   * Padding horizontal custom
   */
  px?: string;
  /**
   * Max width container
   */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const intentStyles: Record<SectionIntent, string> = {
  // Hero: 100vh min, padding important
  hero: 'min-h-screen py-25 md:py-30 lg:py-35',
  
  // Feature: sections standards
  feature: 'py-17 md:py-22 lg:py-25',
  
  // Break: sections de pause/transition
  break: 'py-12 md:py-15 lg:py-17',
  
  // Content: sections texte/éditorial
  content: 'py-15 md:py-17 lg:py-22',
  
  // Footer
  footer: 'py-12 md:py-15',
};

const backgroundStyles = {
  default: 'bg-background',
  secondary: 'bg-secondary',
  accent: 'bg-accent',
  muted: 'bg-muted',
};

const maxWidthStyles = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  '2xl': 'max-w-[1400px]',
  full: 'max-w-full',
};

export const ScrollSection = forwardRef<HTMLElement, ScrollSectionProps>(
  (
    {
      children,
      intent = 'content',
      className,
      id,
      background = 'default',
      py,
      px,
      maxWidth = 'xl',
    },
    ref
  ) => {
    const spacingClasses = py || intentStyles[intent];
    const paddingX = px || 'px-4 sm:px-6 lg:px-8';

    return (
      <section
        ref={ref}
        id={id}
        className={cn(
          // Base
          'relative w-full',
          
          // Background
          backgroundStyles[background],
          
          // Spacing vertical (baseline grid)
          spacingClasses,
          
          // Classes supplémentaires
          className
        )}
      >
        <div
          className={cn(
            // Container centré
            'mx-auto',
            
            // Max width
            maxWidthStyles[maxWidth],
            
            // Padding horizontal
            paddingX
          )}
        >
          {children}
        </div>
      </section>
    );
  }
);

ScrollSection.displayName = 'ScrollSection';

/**
 * Composant Grid 12 colonnes pour layouts complexes
 */
interface GridProps {
  children: ReactNode;
  className?: string;
  /**
   * Nombre de colonnes
   */
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
  /**
   * Gap entre colonnes (baseline grid)
   */
  gap?: 4 | 6 | 8 | 10 | 12;
}

export function Grid({ children, className, cols = 12, gap = 6 }: GridProps) {
  return (
    <div
      className={cn(
        'grid',
        {
          'grid-cols-1': cols === 1,
          'grid-cols-1 md:grid-cols-2': cols === 2,
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-3': cols === 3,
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-4': cols === 4,
          'grid-cols-1 md:grid-cols-3 lg:grid-cols-6': cols === 6,
          'grid-cols-12': cols === 12,
        },
        `gap-${gap}`,
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Composant Spacer pour espacement vertical cohérent
 */
interface SpacerProps {
  /**
   * Hauteur en unités baseline (4px)
   */
  size: 4 | 6 | 8 | 10 | 12 | 15 | 17 | 22 | 25 | 30;
  /**
   * Responsive: différentes tailles selon breakpoint
   */
  responsive?: {
    md?: number;
    lg?: number;
    xl?: number;
  };
}

export function Spacer({ size, responsive }: SpacerProps) {
  const baseClass = `h-${size}`;
  const mdClass = responsive?.md ? `md:h-${responsive.md}` : '';
  const lgClass = responsive?.lg ? `lg:h-${responsive.lg}` : '';
  const xlClass = responsive?.xl ? `xl:h-${responsive.xl}` : '';

  return <div className={cn(baseClass, mdClass, lgClass, xlClass)} aria-hidden="true" />;
}
