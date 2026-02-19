import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { GhostFrame } from '@shared/types';

interface GhostDroneProps {
  getFrame: (time: number) => GhostFrame | null;
}

export const GhostDrone: React.FC<GhostDroneProps> = ({ getFrame }) => {
  const groupRef = useRef<THREE.Group>(null);
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    elapsed.current += delta;
    const frame = getFrame(elapsed.current);

    if (frame) {
      groupRef.current.position.set(frame.position.x, frame.position.y, frame.position.z);
      groupRef.current.rotation.set(
        frame.rotation.pitch * (Math.PI / 180),
        frame.rotation.yaw * (Math.PI / 180),
        frame.rotation.roll * (Math.PI / 180)
      );
      groupRef.current.visible = true;
    } else {
      groupRef.current.visible = false;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Simplified ghost drone mesh */}
      <mesh>
        <boxGeometry args={[0.3, 0.05, 0.3]} />
        <meshStandardMaterial
          color="#00ffff"
          emissive="#00ffff"
          emissiveIntensity={1}
          transparent
          opacity={0.3}
          toneMapped={false}
        />
      </mesh>
      {/* Motor positions */}
      {[
        [0.12, 0.02, 0.12],
        [-0.12, 0.02, 0.12],
        [-0.12, 0.02, -0.12],
        [0.12, 0.02, -0.12],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial
            color="#00ffff"
            emissive="#00ffff"
            emissiveIntensity={0.8}
            transparent
            opacity={0.25}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
};
