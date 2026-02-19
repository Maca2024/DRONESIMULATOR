import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface RainEffectProps {
  intensity: number; // 0-1
  windDirection?: { x: number; y: number; z: number };
  dronePosition: THREE.Vector3;
}

const RAIN_COUNT = 3000;

export const RainEffect: React.FC<RainEffectProps> = ({
  intensity,
  windDirection = { x: 0, y: 0, z: 0 },
  dronePosition,
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Initialize rain positions
  const positions = useMemo(() => {
    const pos = new Float32Array(RAIN_COUNT * 3);
    for (let i = 0; i < RAIN_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 1] = Math.random() * 60;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }
    return pos;
  }, []);

  // Velocities for each drop
  const velocities = useMemo(() => {
    const vel = new Float32Array(RAIN_COUNT);
    for (let i = 0; i < RAIN_COUNT; i++) {
      vel[i] = 15 + Math.random() * 10; // Fall speed
    }
    return vel;
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current || intensity <= 0) return;

    const visibleCount = Math.floor(RAIN_COUNT * intensity);

    for (let i = 0; i < RAIN_COUNT; i++) {
      // Update position
      positions[i * 3] += windDirection.x * delta * 3;
      positions[i * 3 + 1] -= velocities[i] * delta;
      positions[i * 3 + 2] += windDirection.z * delta * 3;

      // Reset when below ground
      if (positions[i * 3 + 1] < -2) {
        positions[i * 3] = dronePosition.x + (Math.random() - 0.5) * 80;
        positions[i * 3 + 1] = dronePosition.y + 30 + Math.random() * 30;
        positions[i * 3 + 2] = dronePosition.z + (Math.random() - 0.5) * 80;
      }

      // Set transform
      dummy.position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);

      // Tilt based on wind
      const windAngle = Math.atan2(windDirection.z, windDirection.x);
      dummy.rotation.set(0, 0, windAngle * 0.3);

      dummy.scale.set(i < visibleCount ? 1 : 0, i < visibleCount ? 1 : 0, i < visibleCount ? 1 : 0);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (intensity <= 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, RAIN_COUNT]} frustumCulled={false}>
      <cylinderGeometry args={[0.005, 0.005, 0.4, 3]} />
      <meshBasicMaterial
        color="#aabbcc"
        transparent
        opacity={0.4 * intensity}
      />
    </instancedMesh>
  );
};
