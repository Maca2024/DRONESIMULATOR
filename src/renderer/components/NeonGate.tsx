import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface NeonGateProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
  index?: number;
  passed?: boolean;
}

export const NeonGate: React.FC<NeonGateProps> = ({
  position,
  rotation = [0, 0, 0],
  color = '#00ffff',
  index = 0,
  passed = false,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (lightRef.current) {
      // Pulsing animation
      const intensity = passed
        ? 0.3
        : 2 + Math.sin(state.clock.elapsedTime * 2 + index) * 0.5;
      lightRef.current.intensity = intensity;
    }
  });

  const emissiveIntensity = passed ? 0.3 : 4;

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Torus gate */}
      <mesh>
        <torusGeometry args={[3, 0.15, 16, 48]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
          toneMapped={false}
        />
      </mesh>

      {/* Inner translucent disc */}
      <mesh>
        <circleGeometry args={[2.85, 48]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={passed ? 0.02 : 0.08}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Gate point light */}
      <pointLight
        ref={lightRef}
        color={color}
        intensity={passed ? 0.5 : 3}
        distance={15}
      />
    </group>
  );
};
