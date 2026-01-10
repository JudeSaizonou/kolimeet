import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
import { useRef, useState } from 'react';
import * as THREE from 'three';

function InteractiveSphere({ mousePosition }: { mousePosition: { x: number; y: number } }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();
  
  useFrame(() => {
    if (meshRef.current) {
      // Suivre la souris avec un effet de retard (lerp)
      const targetX = (mousePosition.x / window.innerWidth) * viewport.width - viewport.width / 2;
      const targetY = -(mousePosition.y / window.innerHeight) * viewport.height + viewport.height / 2;
      
      meshRef.current.position.x += (targetX - meshRef.current.position.x) * 0.05;
      meshRef.current.position.y += (targetY - meshRef.current.position.y) * 0.05;
      
      // Rotation basée sur la position de la souris
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <Sphere ref={meshRef} args={[1.5, 64, 64]} position={[0, 0, 0]}>
      <MeshDistortMaterial
        color="#8A38F5"
        attach="material"
        distort={0.4}
        speed={3}
        roughness={0.1}
        metalness={0.9}
      />
    </Sphere>
  );
}

export default function MouseFollower() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (event: React.MouseEvent) => {
    setMousePosition({
      x: event.clientX,
      y: event.clientY,
    });
  };

  return (
    <div
      className="absolute inset-0 w-full h-full -z-10 opacity-50"
      onMouseMove={handleMouseMove}
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.8} color="#F59E0B" />
        
        <InteractiveSphere mousePosition={mousePosition} />
      </Canvas>
    </div>
  );
}
