import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Center, Text } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Feature 3D avec transitions step-based
 * Progress divisé en étapes discrètes avec easing
 */

interface ThreeFeatureProps {
  /**
   * Progress scroll [0,1]
   */
  progress: number;
  /**
   * Index de la feature (0, 1, 2...)
   */
  index: number;
  /**
   * Nombre total de steps
   */
  totalSteps?: number;
  /**
   * Couleur
   */
  color?: string;
  /**
   * Callback quand step devient actif
   */
  onStepActive?: (step: number) => void;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function ThreeFeature({
  progress,
  index,
  totalSteps = 3,
  color = '#1F6FEB',
  onStepActive,
}: ThreeFeatureProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const lastActiveStep = useRef(-1);

  // Calculer le step actuel
  const currentStep = Math.floor(progress * totalSteps);
  const stepProgress = (progress * totalSteps) % 1;
  const isActive = currentStep === index;

  // Callback quand step devient actif
  useEffect(() => {
    if (isActive && lastActiveStep.current !== index) {
      lastActiveStep.current = index;
      onStepActive?.(index);
      console.log(`[ThreeFeature] Step ${index} active`);
    }
  }, [isActive, index, onStepActive]);

  useFrame(() => {
    if (!meshRef.current || !groupRef.current) return;

    // Opacité: fade in/out selon step actif
    const targetOpacity = isActive ? 1 : 0.3;
    if (meshRef.current.material instanceof THREE.Material) {
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      material.opacity += (targetOpacity - material.opacity) * 0.1;
      material.transparent = true;
    }

    // Scale: grossit quand actif
    const targetScale = isActive ? 1.2 : 0.8;
    const currentScale = groupRef.current.scale.x;
    const newScale = currentScale + (targetScale - currentScale) * 0.1;
    groupRef.current.scale.set(newScale, newScale, newScale);

    // Position Y: bounce quand actif
    if (isActive) {
      const bounce = Math.sin(stepProgress * Math.PI) * 0.3;
      groupRef.current.position.y = bounce;
    } else {
      groupRef.current.position.y += (0 - groupRef.current.position.y) * 0.1;
    }

    // Rotation continue subtile
    meshRef.current.rotation.y += isActive ? 0.01 : 0.002;
  });

  // Position horizontale selon index
  const xPosition = (index - (totalSteps - 1) / 2) * 2.5;

  return (
    <group ref={groupRef} position={[xPosition, 0, 0]}>
      <RoundedBox ref={meshRef} args={[1.5, 1.5, 1.5]} radius={0.1} smoothness={4}>
        <meshStandardMaterial
          color={color}
          metalness={0.7}
          roughness={0.3}
          envMapIntensity={1}
        />
      </RoundedBox>

      {/* Numéro gravé en 3D sur la face du cube */}
      <Center position={[0, 0, 0.8]}>
        <Text
          fontSize={0.6}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor={color}
          outlineOpacity={0.8}
        >
          {(index + 1).toString()}
          <meshStandardMaterial
            color="#ffffff"
            emissive={isActive ? "#ffffff" : "#000000"}
            emissiveIntensity={isActive ? 0.3 : 0}
            metalness={0.9}
            roughness={0.1}
          />
        </Text>
      </Center>
    </group>
  );
}

/**
 * Container pour multiple features
 */
interface FeaturesSceneProps {
  progress: number;
  features: Array<{
    color: string;
    label: string;
  }>;
  onStepChange?: (step: number) => void;
}

export function FeaturesScene({ progress, features, onStepChange }: FeaturesSceneProps) {
  return (
    <group>
      {features.map((feature, index) => (
        <ThreeFeature
          key={index}
          progress={progress}
          index={index}
          totalSteps={features.length}
          color={feature.color}
          onStepActive={onStepChange}
        />
      ))}
    </group>
  );
}
