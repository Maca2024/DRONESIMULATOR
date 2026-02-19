import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface WindParticlesProps {
  windDirection: { x: number; y: number; z: number };
  windSpeed: number;
  dronePosition: THREE.Vector3;
}

const PARTICLE_COUNT = 200;

export const WindParticles: React.FC<WindParticlesProps> = ({
  windDirection,
  windSpeed,
  dronePosition,
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Particle positions relative to drone
  const particles = useMemo(() => {
    const data = new Float32Array(PARTICLE_COUNT * 4); // x, y, z, life
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      data[i * 4] = (Math.random() - 0.5) * 30;
      data[i * 4 + 1] = Math.random() * 15;
      data[i * 4 + 2] = (Math.random() - 0.5) * 30;
      data[i * 4 + 3] = Math.random(); // life 0-1
    }
    return data;
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current || windSpeed < 1) return;

    const speed = windSpeed * delta;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Move with wind
      particles[i * 4] += windDirection.x * speed * 2;
      particles[i * 4 + 1] += windDirection.y * speed * 0.5 + Math.sin(particles[i * 4 + 3] * 10 + Date.now() * 0.001) * delta * 0.5;
      particles[i * 4 + 2] += windDirection.z * speed * 2;
      particles[i * 4 + 3] -= delta * 0.3; // Decay life

      // Reset when life depleted or too far from drone
      const dx = particles[i * 4] - dronePosition.x;
      const dz = particles[i * 4 + 2] - dronePosition.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (particles[i * 4 + 3] <= 0 || dist > 25) {
        particles[i * 4] = dronePosition.x + (Math.random() - 0.5) * 20 - windDirection.x * 10;
        particles[i * 4 + 1] = dronePosition.y + (Math.random() - 0.5) * 10;
        particles[i * 4 + 2] = dronePosition.z + (Math.random() - 0.5) * 20 - windDirection.z * 10;
        particles[i * 4 + 3] = 0.8 + Math.random() * 0.2;
      }

      // Fade based on distance from drone
      const distFade = Math.max(0, 1 - dist / 20);
      const lifeFade = particles[i * 4 + 3];
      const scale = distFade * lifeFade * (windSpeed / 10) * 0.5;

      dummy.position.set(particles[i * 4], particles[i * 4 + 1], particles[i * 4 + 2]);
      dummy.scale.setScalar(Math.max(0.01, scale));
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (windSpeed < 1) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]} frustumCulled={false}>
      <sphereGeometry args={[0.03, 4, 4]} />
      <meshBasicMaterial
        color="#ffffff"
        transparent
        opacity={0.3}
      />
    </instancedMesh>
  );
};
