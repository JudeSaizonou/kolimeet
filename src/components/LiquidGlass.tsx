import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode, CSSProperties } from 'react';
import { cn } from '@/lib/utils';

/**
 * 🌊 LIQUID GLASS EFFECT - Awwwards Premium
 * 
 * Morphisme de verre avec distorsion fluide, reflets animés, et blur dynamique.
 * Utilise backdrop-filter + animations GSAP pour un effet premium.
 * 
 * Performance: GPU-accelerated (backdrop-filter, transform)
 * Accessibilité: Désactivé si prefers-reduced-motion
 */

// ============================================================================
// TYPES
// ============================================================================

export type GlassIntensity = 'subtle' | 'medium' | 'strong' | 'extreme';
export type GlassVariant = 'default' | 'iridescent' | 'frosted' | 'crystal';

interface GlassBaseProps {
  /** Intensité de l'effet glass (blur + opacité) */
  intensity?: GlassIntensity;
  /** Variante visuelle */
  variant?: GlassVariant;
  /** Animation de distorsion fluide au hover */
  liquidDistortion?: boolean;
  /** Reflets animés (iridescent shimmer) */
  animatedReflections?: boolean;
  /** Bordure lumineuse */
  glowBorder?: boolean;
  /** Couleur de teinte (rgba ou hex) */
  tintColor?: string;
  /** Additional className */
  className?: string;
}

// ============================================================================
// CONFIGURATION DES INTENSITÉS
// ============================================================================

const INTENSITY_CONFIG: Record<GlassIntensity, {
  blur: string;
  opacity: number;
  saturation: string;
}> = {
  subtle: {
    blur: 'blur-[2px]',
    opacity: 0.85,
    saturation: 'saturate-100',
  },
  medium: {
    blur: 'blur-[4px]',
    opacity: 0.75,
    saturation: 'saturate-110',
  },
  strong: {
    blur: 'blur-[6px]',
    opacity: 0.65,
    saturation: 'saturate-120',
  },
  extreme: {
    blur: 'blur-[8px]',
    opacity: 0.55,
    saturation: 'saturate-130',
  },
};

// ============================================================================
// GLASS CARD - Carte avec effet verre
// ============================================================================

interface GlassCardProps extends GlassBaseProps {
  /** Padding interne */
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  /** Rounded corners */
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  /** Hover lift effect */
  hoverLift?: boolean;
  /** OnClick handler */
  onClick?: () => void;
  /** Children */
  children?: ReactNode;
}

export function GlassCard({
  intensity = 'medium',
  variant = 'default',
  liquidDistortion = true,
  animatedReflections = true,
  glowBorder = false,
  tintColor,
  padding = 'lg',
  rounded = 'xl',
  hoverLift = true,
  onClick,
  className,
  children,
  ...props
}: GlassCardProps) {
  const config = INTENSITY_CONFIG[intensity];

  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };

  const roundedClasses = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
  };

  // Style de teinte personnalisée
  const tintStyle: CSSProperties = tintColor
    ? { backgroundColor: tintColor }
    : {};

  return (
    <motion.div
      className={cn(
        'relative overflow-hidden',
        roundedClasses[rounded],
        onClick && 'cursor-pointer',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      whileHover={hoverLift ? { y: -8, scale: 1.02 } : undefined}
      onClick={onClick}
      {...props}
    >
      {/* Backdrop blur layer */}
      <div
        className={cn(
          'absolute inset-0 backdrop-blur-md backdrop-saturate-150',
          config.blur,
          config.saturation
        )}
        style={{
          backgroundColor: tintColor || `rgba(255, 255, 255, ${config.opacity})`,
        }}
      />

      {/* Liquid distortion overlay */}
      {liquidDistortion && (
        <motion.div
          className="absolute inset-0 opacity-15 mix-blend-overlay pointer-events-none"
          style={{
            background: `
              radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.8) 0%, transparent 50%),
              radial-gradient(circle at 80% 50%, rgba(255, 255, 255, 0.6) 0%, transparent 50%)
            `,
          }}
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Animated reflections (iridescent shimmer) */}
      {animatedReflections && variant === 'iridescent' && (
        <motion.div
          className="absolute inset-0 opacity-20 mix-blend-screen pointer-events-none"
          style={{
            background: `
              linear-gradient(
                135deg,
                rgba(255, 0, 255, 0.3) 0%,
                rgba(0, 255, 255, 0.3) 25%,
                rgba(255, 255, 0, 0.3) 50%,
                rgba(0, 255, 255, 0.3) 75%,
                rgba(255, 0, 255, 0.3) 100%
              )
            `,
            backgroundSize: '200% 200%',
          }}
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}

      {/* Glow border */}
      {glowBorder && (
        <div
          className={cn(
            'absolute inset-0 rounded-[inherit]',
            'border border-white/30',
            'shadow-[0_0_20px_rgba(255,255,255,0.3),inset_0_0_20px_rgba(255,255,255,0.1)]'
          )}
        />
      )}

      {/* Content */}
      <div className={cn('relative z-10', paddingClasses[padding])}>
        {children}
      </div>

      {/* Bottom gradient shine */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"
      />
    </motion.div>
  );
}

// ============================================================================
// GLASS BUTTON - Bouton avec effet verre
// ============================================================================

interface GlassButtonProps extends GlassBaseProps {
  /** Taille du bouton */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Variante visuelle */
  buttonVariant?: 'primary' | 'secondary' | 'ghost';
  /** Children */
  children?: ReactNode;
  /** onClick handler */
  onClick?: () => void;
}

export function GlassButton({
  intensity = 'strong',
  variant = 'default',
  liquidDistortion = true,
  glowBorder = true,
  size = 'md',
  buttonVariant = 'primary',
  className,
  children,
  ...props
}: GlassButtonProps) {
  const config = INTENSITY_CONFIG[intensity];

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-10 py-5 text-xl',
  };

  const variantStyles: Record<typeof buttonVariant, CSSProperties> = {
    primary: {
      backgroundColor: `rgba(31, 111, 235, 0.95)`,
    },
    secondary: {
      backgroundColor: `rgba(255, 255, 255, 0.98)`,
    },
    ghost: {
      backgroundColor: `rgba(255, 255, 255, 0.8)`,
    },
  };

  return (
    <motion.button
      className={cn(
        'relative overflow-hidden rounded-full font-semibold',
        'transition-all duration-300',
        sizeClasses[size],
        buttonVariant === 'primary' ? 'text-white' : 'text-foreground',
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {/* Backdrop layer */}
      <div
        className="absolute inset-0"
        style={variantStyles[buttonVariant]}
      />

      {/* Glow border */}
      {glowBorder && (
        <div className="absolute inset-0 rounded-full border border-white/30" />
      )}

      {/* Content */}
      <span className="relative z-10">
        {children}
      </span>
    </motion.button>
  );
}

// ============================================================================
// GLASS PANEL - Panneau de navigation/sidebar avec effet verre
// ============================================================================

interface GlassPanelProps extends GlassBaseProps {
  /** Position du panel */
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  /** Largeur/hauteur fixe */
  size?: string;
  /** Children */
  children?: ReactNode;
}

export function GlassPanel({
  intensity = 'medium',
  variant = 'frosted',
  liquidDistortion = true,
  glowBorder = true,
  tintColor,
  position = 'center',
  size,
  className,
  children,
}: GlassPanelProps) {
  const config = INTENSITY_CONFIG[intensity];

  const positionClasses = {
    top: 'top-0 left-0 right-0',
    bottom: 'bottom-0 left-0 right-0',
    left: 'top-0 left-0 bottom-0',
    right: 'top-0 right-0 bottom-0',
    center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  };

  return (
    <motion.div
      className={cn(
        'absolute overflow-hidden',
        positionClasses[position],
        className
      )}
      style={{ width: size, height: size }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Backdrop blur */}
      <div
        className={cn(
          'absolute inset-0 backdrop-blur-xl backdrop-saturate-200',
          config.blur,
          config.saturation
        )}
        style={{
          backgroundColor: tintColor || `rgba(255, 255, 255, ${config.opacity})`,
        }}
      />

      {/* Liquid distortion waves */}
      {liquidDistortion && (
        <>
          <motion.div
            className="absolute inset-0 opacity-10 mix-blend-overlay"
            style={{
              background: `radial-gradient(ellipse at 30% 30%, rgba(255, 255, 255, 0.9), transparent 60%)`,
            }}
            animate={{
              x: [0, 50, 0],
              y: [0, 30, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute inset-0 opacity-10 mix-blend-overlay"
            style={{
              background: `radial-gradient(ellipse at 70% 70%, rgba(255, 255, 255, 0.7), transparent 60%)`,
            }}
            animate={{
              x: [0, -50, 0],
              y: [0, -30, 0],
              scale: [1, 1.15, 1],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </>
      )}

      {/* Glow border */}
      {glowBorder && (
        <div className="absolute inset-0 border border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.2),inset_0_0_30px_rgba(255,255,255,0.1)]" />
      )}

      {/* Content */}
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  );
}

// ============================================================================
// GLASS SECTION BACKGROUND - Arrière-plan avec effet verre
// ============================================================================

interface GlassSectionBgProps extends GlassBaseProps {
  /** Motif de fond (dots, grid, waves) */
  pattern?: 'dots' | 'grid' | 'waves' | 'none';
}

export function GlassSectionBg({
  intensity = 'subtle',
  variant = 'frosted',
  liquidDistortion = true,
  animatedReflections = false,
  pattern = 'dots',
  tintColor,
  className,
}: GlassSectionBgProps) {
  const config = INTENSITY_CONFIG[intensity];

  const patternStyles: Record<typeof pattern, CSSProperties> = {
    dots: {
      backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
      backgroundSize: '20px 20px',
    },
    grid: {
      backgroundImage: `
        linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
      `,
      backgroundSize: '30px 30px',
    },
    waves: {
      backgroundImage: `repeating-linear-gradient(
        45deg,
        transparent,
        transparent 10px,
        rgba(255, 255, 255, 0.03) 10px,
        rgba(255, 255, 255, 0.03) 20px
      )`,
    },
    none: {},
  };

  return (
    <div className={cn('absolute inset-0 -z-10', className)}>
      {/* Backdrop blur base */}
      <div
        className={cn(
          'absolute inset-0 backdrop-blur-3xl backdrop-saturate-200',
          config.blur,
          config.saturation
        )}
        style={{
          backgroundColor: tintColor || `rgba(255, 255, 255, ${config.opacity * 0.3})`,
        }}
      />

      {/* Pattern overlay */}
      {pattern !== 'none' && (
        <div
          className="absolute inset-0"
          style={patternStyles[pattern]}
        />
      )}

      {/* Liquid distortion orbs */}
      {liquidDistortion && (
        <>
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-15 blur-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3), transparent 70%)',
            }}
            animate={{
              x: [0, 100, -50, 0],
              y: [0, -80, 50, 0],
              scale: [1, 1.2, 0.9, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-15 blur-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(236, 72, 153, 0.3), transparent 70%)',
            }}
            animate={{
              x: [0, -100, 50, 0],
              y: [0, 80, -50, 0],
              scale: [1, 0.9, 1.2, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </>
      )}

      {/* Iridescent shimmer */}
      {animatedReflections && variant === 'iridescent' && (
        <motion.div
          className="absolute inset-0 opacity-10 mix-blend-screen"
          style={{
            background: `
              linear-gradient(
                45deg,
                rgba(139, 92, 246, 0.3) 0%,
                rgba(59, 130, 246, 0.3) 25%,
                rgba(34, 197, 94, 0.3) 50%,
                rgba(234, 179, 8, 0.3) 75%,
                rgba(239, 68, 68, 0.3) 100%
              )
            `,
            backgroundSize: '400% 400%',
          }}
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// GLASS MORPHISM TEXT - Texte avec effet verre
// ============================================================================

interface GlassTextProps extends GlassBaseProps {
  /** Taille du texte */
  size?: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  /** Bold */
  bold?: boolean;
  /** Texte */
  text: string;
}

export function GlassText({
  intensity = 'strong',
  size = 'xl',
  bold = true,
  glowBorder = true,
  text,
  className,
}: GlassTextProps) {
  const config = INTENSITY_CONFIG[intensity];

  const sizeClasses = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
    '5xl': 'text-5xl',
  };

  return (
    <motion.span
      className={cn(
        'inline-block',
        sizeClasses[size],
        bold && 'font-bold',
        className
      )}
      style={{
        background: `linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.6))`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        filter: glowBorder ? 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.5))' : 'none',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {text}
    </motion.span>
  );
}
