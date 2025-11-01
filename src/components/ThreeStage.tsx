import { Suspense, ReactNode, useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { 
  PerspectiveCamera, 
  Environment,
  AdaptiveDpr,
  AdaptiveEvents,
  PerformanceMonitor,
} from '@react-three/drei';
import { useGPUCapabilities, usePrefersReducedMotion } from '@/hooks/useScrollSync';

/**
 * Canvas 3D ultra-performant avec optimisations Awwwards
 * - frameloop demand par défaut
 * - dpr adaptatif
 * - Preload DRACO/KTX2
 * - Fallback 2D si prefers-reduced-motion
 */

interface ThreeStageProps {
  children: ReactNode;
  /**
   * Couleur de fond (RGB hex)
   */
  backgroundColor?: string;
  /**
   * Active le frameloop constant (sinon demand)
   */
  alwaysRender?: boolean;
  /**
   * Callback perf (dégradation détectée)
   */
  onDegraded?: () => void;
  /**
   * Image de fallback si 3D désactivé
   */
  fallbackImage?: string;
  /**
   * Classes CSS
   */
  className?: string;
  /**
   * Caméra FOV
   */
  cameraFov?: number;
  /**
   * Position caméra [x, y, z]
   */
  cameraPosition?: [number, number, number];
}

export function ThreeStage({
  children,
  backgroundColor = '#FFFFFF',
  alwaysRender = false,
  onDegraded,
  fallbackImage,
  className = '',
  cameraFov = 50,
  cameraPosition = [0, 0, 5],
}: ThreeStageProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { isLowEnd } = useGPUCapabilities();
  const [dpr, setDpr] = useState<[number, number]>([1, 2]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Ajuste DPR selon capacités
  useEffect(() => {
    if (isLowEnd) {
      setDpr([1, 1]);
    } else {
      setDpr([1, 1.75]);
    }
  }, [isLowEnd]);

  // Mode fallback si prefers-reduced-motion
  if (prefersReducedMotion) {
    return fallbackImage ? (
      <div className={className}>
        <img
          src={fallbackImage}
          alt="Scene 3D"
          className="w-full h-full object-cover"
          loading="eager"
        />
      </div>
    ) : (
      <div className={className} style={{ backgroundColor }} />
    );
  }

  return (
    <div className={className}>
      <Canvas
        ref={canvasRef}
        dpr={dpr}
        frameloop={alwaysRender ? 'always' : 'demand'}
        gl={{
          antialias: !isLowEnd,
          alpha: backgroundColor === 'transparent',
          stencil: false,
          depth: true,
          powerPreference: 'high-performance',
        }}
        style={{
          background: backgroundColor === 'transparent' ? 'transparent' : backgroundColor,
          width: '100%',
          height: '100%',
          touchAction: 'none',
        }}
      >
        {/* Performance monitoring */}
        <PerformanceMonitor
          onDecline={() => {
            console.warn('[ThreeStage] Performance decline detected');
            onDegraded?.();
          }}
        >
          {/* Adaptive DPR & Events */}
          <AdaptiveDpr pixelated />
          <AdaptiveEvents />

          {/* Camera */}
          <PerspectiveCamera
            makeDefault
            position={cameraPosition}
            fov={cameraFov}
            near={0.1}
            far={1000}
          />

          {/* Lighting setup optimisé */}
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={0.8}
            castShadow={!isLowEnd}
            shadow-mapSize={isLowEnd ? 512 : 1024}
          />

          {/* Environment map pour réflexions (preset léger) */}
          <Environment preset="city" />

          {/* Scene content avec Suspense */}
          <Suspense fallback={null}>
            {children}
          </Suspense>
        </PerformanceMonitor>
      </Canvas>
    </div>
  );
}

/**
 * Placeholder pendant chargement 3D
 */
export function SceneLoader() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#cccccc" />
    </mesh>
  );
}
