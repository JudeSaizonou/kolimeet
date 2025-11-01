import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Hero 3D synchronisé avec scroll progress
 * Rotation et position pilotées par useScrollSync
 */

interface ThreeHeroProps {
  /**
   * Progress scroll [0,1] depuis useScrollSync
   */
  progress: number;
  /**
   * Couleur principale
   */
  color?: string;
  /**
   * Active le mode debug
   */
  debug?: boolean;
}

export function ThreeHero({ 
  progress, 
  color = '#1F6FEB',
  debug = false 
}: ThreeHeroProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const leftSphereRef = useRef<THREE.Mesh>(null);
  const rightSphereRef = useRef<THREE.Mesh>(null);
  const { viewport, pointer } = useThree();
  
  const [isDivided, setIsDivided] = useState(false);
  const [mouseDistance, setMouseDistance] = useState(1);

  // Log debug
  useEffect(() => {
    if (debug) {
      console.log('[ThreeHero] Progress:', progress.toFixed(3));
    }
  }, [progress, debug]);

  // Animation synchronisée avec scroll et souris
  useFrame((state) => {
    if (!meshRef.current || !groupRef.current) return;

    // Position de la sphère dans l'espace
    const spherePosition = new THREE.Vector3(3, -1, 0);
    const mousePos = new THREE.Vector3(
      pointer.x * viewport.width / 2,
      pointer.y * viewport.height / 2,
      0
    );
    const distance = spherePosition.distanceTo(mousePos);
    setMouseDistance(distance);

    // Division si la souris est proche
    const divisionThreshold = 2.5;
    const shouldDivide = distance < divisionThreshold;
    setIsDivided(shouldDivide);

    // Rotation basée sur le temps et le scroll
    const time = state.clock.elapsedTime;
    meshRef.current.rotation.y = time * 0.3 + progress * Math.PI;
    meshRef.current.rotation.x = Math.sin(time * 0.2) * 0.3 + progress * 0.5;

    // Position Y oscillante
    const oscillation = Math.sin(time * 0.5) * 0.3;
    groupRef.current.position.y = oscillation - 1;

    // Scale animé
    const breathe = 1 + Math.sin(time * 0.8) * 0.1;
    groupRef.current.scale.set(breathe, breathe, breathe);

    // Animation de division améliorée
    if (shouldDivide && leftSphereRef.current && rightSphereRef.current) {
      const divisionAmount = Math.max(0, 1 - distance / divisionThreshold);
      const separation = divisionAmount * 2;
      const rotation = divisionAmount * Math.PI;
      
      // Séparation avec rotation
      leftSphereRef.current.position.x = -separation;
      leftSphereRef.current.rotation.z = rotation;
      rightSphereRef.current.position.x = separation;
      rightSphereRef.current.rotation.z = -rotation;
      
      // Réduire l'opacité de la sphère principale
      if (meshRef.current.material instanceof THREE.Material) {
        const material = meshRef.current.material as THREE.MeshStandardMaterial;
        material.opacity = Math.max(0, 1 - divisionAmount * 1.2);
        material.transparent = true;
      }
      
      // Opacité des sphères divisées
      if (leftSphereRef.current.material instanceof THREE.Material) {
        const leftMat = leftSphereRef.current.material as THREE.MeshStandardMaterial;
        leftMat.opacity = divisionAmount;
      }
      if (rightSphereRef.current.material instanceof THREE.Material) {
        const rightMat = rightSphereRef.current.material as THREE.MeshStandardMaterial;
        rightMat.opacity = divisionAmount;
      }
    } else if (leftSphereRef.current && rightSphereRef.current) {
      // Revenir à la position normale avec spring
      leftSphereRef.current.position.x += (0 - leftSphereRef.current.position.x) * 0.2;
      leftSphereRef.current.rotation.z += (0 - leftSphereRef.current.rotation.z) * 0.2;
      rightSphereRef.current.position.x += (0 - rightSphereRef.current.position.x) * 0.2;
      rightSphereRef.current.rotation.z += (0 - rightSphereRef.current.rotation.z) * 0.2;
      
      if (meshRef.current.material instanceof THREE.Material) {
        const material = meshRef.current.material as THREE.MeshStandardMaterial;
        material.opacity += (1 - material.opacity) * 0.2;
      }
      
      if (leftSphereRef.current.material instanceof THREE.Material) {
        const leftMat = leftSphereRef.current.material as THREE.MeshStandardMaterial;
        leftMat.opacity += (0 - leftMat.opacity) * 0.2;
      }
      if (rightSphereRef.current.material instanceof THREE.Material) {
        const rightMat = rightSphereRef.current.material as THREE.MeshStandardMaterial;
        rightMat.opacity += (0 - rightMat.opacity) * 0.2;
      }
    }
  });

  // Couleurs de l'application (nuances de bleu)
  const primaryColor = color; // Couleur passée en paramètre
  const secondaryColor = '#60A5FA'; // Bleu clair pour les divisions

  return (
    <group ref={groupRef} position={[3, -1, 0]}> {/* Décalé en bas à droite */}
      <Float
        speed={2}
        rotationIntensity={0.2}
        floatIntensity={0.3}
        floatingRange={[-0.2, 0.2]}
      >
        {/* Sphère principale - encore plus petite */}
        <Sphere ref={meshRef} args={[0.5, 64, 64]}> {/* Réduit à 0.5 */}
          <MeshDistortMaterial
            color={primaryColor}
            attach="material"
            distort={0.3}
            speed={1.5}
            roughness={0.1}
            metalness={0.9}
            toneMapped={true}
            transparent={true}
            opacity={1}
          />
        </Sphere>

        {/* Sphères de division - gauche */}
        <Sphere ref={leftSphereRef} args={[0.25, 32, 32]} position={[0, 0, 0]}>
          <meshStandardMaterial
            color={secondaryColor}
            metalness={0.9}
            roughness={0.1}
            emissive={secondaryColor}
            emissiveIntensity={0.6}
            transparent={true}
            opacity={0}
          />
        </Sphere>

        {/* Sphères de division - droite */}
        <Sphere ref={rightSphereRef} args={[0.25, 32, 32]} position={[0, 0, 0]}>
          <meshStandardMaterial
            color={secondaryColor}
            metalness={0.9}
            roughness={0.1}
            emissive={secondaryColor}
            emissiveIntensity={0.6}
            transparent={true}
            opacity={0}
          />
        </Sphere>
      </Float>

      {/* Lighting amélioré */}
      <pointLight 
        position={[1, 1, 1]} 
        intensity={0.8} 
        color={primaryColor}
        distance={8}
        decay={2}
      />
      <pointLight 
        position={[-1, -1, -1]} 
        intensity={0.4} 
        color={secondaryColor}
        distance={6}
        decay={2}
      />
    </group>
  );
}

/**
 * Variante: Multiple objets en constellation
 */
export function ThreeHeroConstellation({ progress }: { progress: number }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;

    // Rotation globale du groupe
    groupRef.current.rotation.y = progress * Math.PI * 2;
  });

  return (
    <group ref={groupRef}>
      {/* Sphère centrale */}
      <ThreeHero progress={progress} color="#1F6FEB" />

      {/* Satellites */}
      <group position={[3, 0, 0]}>
        <Sphere args={[0.3, 32, 32]}>
          <meshStandardMaterial color="#F59E0B" metalness={0.8} roughness={0.2} />
        </Sphere>
      </group>

      <group position={[-3, 0, 0]}>
        <Sphere args={[0.3, 32, 32]}>
          <meshStandardMaterial color="#10B981" metalness={0.8} roughness={0.2} />
        </Sphere>
      </group>

      <group position={[0, 2, -2]}>
        <Sphere args={[0.25, 32, 32]}>
          <meshStandardMaterial color="#F59E0B" metalness={0.8} roughness={0.2} />
        </Sphere>
      </group>
    </group>
  );
}
