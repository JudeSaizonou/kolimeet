import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

function AnimatedWave({ color, speed, offset }: { color: string, speed: number, offset: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime * speed;
      const geometry = meshRef.current.geometry as THREE.PlaneGeometry;
      const positionAttribute = geometry.attributes.position;
      
      for (let i = 0; i < positionAttribute.count; i++) {
        const x = positionAttribute.getX(i);
        const y = positionAttribute.getY(i);
        const wave = Math.sin(x * 0.5 + time + offset) * Math.cos(y * 0.5 + time + offset) * 0.5;
        positionAttribute.setZ(i, wave);
      }
      
      positionAttribute.needsUpdate = true;
      geometry.computeVertexNormals();
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 4, 0, 0]} position={[0, 0, -5]}>
      <planeGeometry args={[20, 20, 50, 50]} />
      <meshStandardMaterial
        color={color}
        wireframe={false}
        transparent
        opacity={0.3}
        side={THREE.DoubleSide}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
}

export default function WaveBackground() {
  return (
    <div className="absolute inset-0 w-full h-full -z-10 opacity-50">
      <Canvas
        camera={{ position: [0, 2, 8], fov: 60 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <pointLight position={[-5, 5, 5]} intensity={0.5} color="#F59E0B" />
        
        {/* Vagues multiples avec différentes couleurs et vitesses */}
        <AnimatedWave color="#1F6FEB" speed={0.5} offset={0} />
        <AnimatedWave color="#10B981" speed={0.3} offset={Math.PI / 3} />
        <AnimatedWave color="#F59E0B" speed={0.4} offset={Math.PI / 2} />
      </Canvas>
    </div>
  );
}
