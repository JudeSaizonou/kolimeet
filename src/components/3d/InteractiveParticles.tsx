import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import { useRef, useMemo, useState } from 'react';
import * as THREE from 'three';

function MouseAwareParticles({ mousePosition }: { mousePosition: { x: number; y: number } }) {
  const particlesRef = useRef<THREE.Points>(null);
  const { viewport } = useThree();
  
  // Générer des positions aléatoires pour les particules
  const [positions, velocities] = useMemo(() => {
    const positions = new Float32Array(2000 * 3);
    const velocities = new Float32Array(2000 * 3);
    
    for (let i = 0; i < 2000; i++) {
      const x = (Math.random() - 0.5) * 20;
      const y = (Math.random() - 0.5) * 20;
      const z = (Math.random() - 0.5) * 10;
      positions.set([x, y, z], i * 3);
      
      // Vélocités aléatoires
      velocities.set([
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
      ], i * 3);
    }
    return [positions, velocities];
  }, []);

  useFrame(() => {
    if (particlesRef.current) {
      const positionAttribute = particlesRef.current.geometry.attributes.position;
      const mouseX = (mousePosition.x / window.innerWidth - 0.5) * viewport.width;
      const mouseY = -(mousePosition.y / window.innerHeight - 0.5) * viewport.height;
      
      for (let i = 0; i < 2000; i++) {
        const i3 = i * 3;
        
        // Position actuelle
        let x = positionAttribute.getX(i);
        let y = positionAttribute.getY(i);
        let z = positionAttribute.getZ(i);
        
        // Distance à la souris
        const dx = mouseX - x;
        const dy = mouseY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Repousser les particules près de la souris
        if (distance < 3) {
          const force = (3 - distance) * 0.1;
          x -= (dx / distance) * force;
          y -= (dy / distance) * force;
        }
        
        // Appliquer les vélocités
        x += velocities[i3];
        y += velocities[i3 + 1];
        z += velocities[i3 + 2];
        
        // Rebondir sur les bords
        if (Math.abs(x) > 10) velocities[i3] *= -1;
        if (Math.abs(y) > 10) velocities[i3 + 1] *= -1;
        if (Math.abs(z) > 5) velocities[i3 + 2] *= -1;
        
        positionAttribute.setXYZ(i, x, y, z);
      }
      
      positionAttribute.needsUpdate = true;
      particlesRef.current.rotation.y += 0.001;
    }
  });

  return (
    <Points ref={particlesRef} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color="#10B981"
        size={0.04}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.7}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

export default function InteractiveParticles() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (event: React.MouseEvent) => {
    setMousePosition({
      x: event.clientX,
      y: event.clientY,
    });
  };

  return (
    <div
      className="absolute inset-0 w-full h-full -z-10 opacity-40"
      onMouseMove={handleMouseMove}
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 75 }}
        style={{ background: 'transparent' }}
      >
        <MouseAwareParticles mousePosition={mousePosition} />
      </Canvas>
    </div>
  );
}
