import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, Torus, Box } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

// Couleurs du thème en format hex
const COLORS = {
  primary: '#8A38F5',    // Violet
  accent: '#F59E0B',     // Jaune
  success: '#10B981',    // Vert
};

function AnimatedSphere({ position, color }: { position: [number, number, number], color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.3;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <Float
      speed={2}
      rotationIntensity={1.5}
      floatIntensity={2}
    >
      <Sphere ref={meshRef} args={[1, 64, 64]} position={position} scale={1.2}>
        <MeshDistortMaterial
          color={color}
          attach="material"
          distort={0.3}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  );
}

function AnimatedTorus({ position, color }: { position: [number, number, number], color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.4;
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <Float
      speed={1.5}
      rotationIntensity={2}
      floatIntensity={1.5}
    >
      <Torus ref={meshRef} args={[1, 0.4, 32, 100]} position={position}>
        <MeshDistortMaterial
          color={color}
          attach="material"
          distort={0.2}
          speed={1.5}
          roughness={0.3}
          metalness={0.7}
        />
      </Torus>
    </Float>
  );
}

function AnimatedBox({ position, color }: { position: [number, number, number], color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.5;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.4;
    }
  });

  return (
    <Float
      speed={1.8}
      rotationIntensity={1.2}
      floatIntensity={1.8}
    >
      <Box ref={meshRef} args={[1.5, 1.5, 1.5]} position={position}>
        <MeshDistortMaterial
          color={color}
          attach="material"
          distort={0.25}
          speed={1.8}
          roughness={0.25}
          metalness={0.75}
        />
      </Box>
    </Float>
  );
}

export default function FloatingShapes() {
  return (
    <div className="absolute inset-0 w-full h-full -z-10 opacity-40">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color={COLORS.accent} />
        <pointLight position={[10, 5, 5]} intensity={0.5} color={COLORS.primary} />
        
        {/* Sphère bleue à gauche */}
        <AnimatedSphere position={[-4, 2, 0]} color={COLORS.primary} />
        
        {/* Torus jaune à droite */}
        <AnimatedTorus position={[4, -1, -2]} color={COLORS.accent} />
        
        {/* Box verte en bas à gauche */}
        <AnimatedBox position={[-3, -3, -1]} color={COLORS.success} />
        
        {/* Sphère verte en haut à droite */}
        <AnimatedSphere position={[5, 3, -1]} color={COLORS.success} />
        
        {/* Torus bleu en bas à droite */}
        <AnimatedTorus position={[3, -2, 1]} color={COLORS.primary} />
      </Canvas>
    </div>
  );
}
