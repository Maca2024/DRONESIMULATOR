import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useSettingsStore } from '../store/settingsStore';

interface WaterProps {
  size?: number;
  waterLevel?: number;
}

export const Water: React.FC<WaterProps> = ({
  size = 200,
  waterLevel = -0.5,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const quality = useSettingsStore((state) => state.settings.graphics.quality);

  // Skip water on low quality (reflections are expensive)
  if (quality === 'low') return null;

  // Animate subtle wave movement via position offset
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = waterLevel + Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[0, waterLevel, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[size, size]} />
      <MeshReflectorMaterial
        mirror={quality === 'ultra' ? 0.6 : 0.4}
        resolution={quality === 'ultra' ? 1024 : 512}
        mixBlur={1}
        mixStrength={0.8}
        roughness={1}
        depthScale={1.2}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#001122"
        metalness={0.5}
      />
    </mesh>
  );
};
