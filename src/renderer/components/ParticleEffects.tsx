import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleSystemProps {
  position: THREE.Vector3;
  motorRPM: [number, number, number, number];
  velocity: THREE.Vector3;
  altitude: number;
  armed: boolean;
}

// Dust particles when close to ground
const DustParticles: React.FC<{ position: THREE.Vector3; intensity: number; spread: number }> = ({
  position,
  intensity,
  spread
}) => {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 200;

  const { positions, velocities, lifetimes, initialLifetimes } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const lifetimes = new Float32Array(particleCount);
    const initialLifetimes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = -1000; // Start off-screen
      positions[i * 3 + 2] = 0;
      velocities[i * 3] = 0;
      velocities[i * 3 + 1] = 0;
      velocities[i * 3 + 2] = 0;
      lifetimes[i] = 0;
      initialLifetimes[i] = 0;
    }

    return { positions, velocities, lifetimes, initialLifetimes };
  }, []);

  useFrame((_, delta) => {
    if (!particlesRef.current) return;

    const positionAttr = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const posArray = positionAttr.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      // Update lifetime
      lifetimes[i] -= delta;

      if (lifetimes[i] <= 0 && intensity > 0.1) {
        // Respawn particle
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * spread;

        posArray[i * 3] = position.x + Math.cos(angle) * radius;
        posArray[i * 3 + 1] = 0.05;
        posArray[i * 3 + 2] = position.z + Math.sin(angle) * radius;

        velocities[i * 3] = (Math.random() - 0.5) * 2 * intensity;
        velocities[i * 3 + 1] = Math.random() * 2 * intensity;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 2 * intensity;

        lifetimes[i] = 0.5 + Math.random() * 1.0;
        initialLifetimes[i] = lifetimes[i];
      } else if (lifetimes[i] > 0) {
        // Update position
        posArray[i * 3] += velocities[i * 3] * delta;
        posArray[i * 3 + 1] += velocities[i * 3 + 1] * delta;
        posArray[i * 3 + 2] += velocities[i * 3 + 2] * delta;

        // Apply gravity
        velocities[i * 3 + 1] -= 2 * delta;

        // Friction
        velocities[i * 3] *= 0.98;
        velocities[i * 3 + 2] *= 0.98;
      } else {
        // Hide dead particles
        posArray[i * 3 + 1] = -1000;
      }
    }

    positionAttr.needsUpdate = true;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#b8860b"
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
};

// Motor exhaust/heat shimmer effect
const MotorExhaust: React.FC<{ motorPositions: THREE.Vector3[]; motorRPM: number[]; dronePosition: THREE.Vector3 }> = ({
  motorPositions,
  motorRPM,
  dronePosition
}) => {
  const exhaustRef = useRef<THREE.Points>(null);
  const particleCount = 100;

  const { positions, lifetimes } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const lifetimes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = -1000;
      positions[i * 3 + 2] = 0;
      lifetimes[i] = 0;
    }

    return { positions, lifetimes };
  }, []);

  useFrame((_, delta) => {
    if (!exhaustRef.current) return;

    const positionAttr = exhaustRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const posArray = positionAttr.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      lifetimes[i] -= delta;

      if (lifetimes[i] <= 0) {
        // Pick a random motor
        const motorIndex = Math.floor(Math.random() * 4);
        const rpm = motorRPM[motorIndex];

        if (rpm > 1000) {
          const motorPos = motorPositions[motorIndex];
          posArray[i * 3] = dronePosition.x + motorPos.x + (Math.random() - 0.5) * 0.02;
          posArray[i * 3 + 1] = dronePosition.y + motorPos.y - 0.02;
          posArray[i * 3 + 2] = dronePosition.z + motorPos.z + (Math.random() - 0.5) * 0.02;
          lifetimes[i] = 0.1 + Math.random() * 0.2;
        }
      } else {
        // Move down
        posArray[i * 3 + 1] -= 0.5 * delta;
      }
    }

    positionAttr.needsUpdate = true;
  });

  return (
    <points ref={exhaustRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.01}
        color="#ffaa00"
        transparent
        opacity={0.3}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
};

export const ParticleEffects: React.FC<ParticleSystemProps> = ({
  position,
  motorRPM,
  altitude,
  armed
}) => {
  // Calculate dust intensity based on altitude and throttle
  const avgRPM = motorRPM.reduce((a, b) => a + b, 0) / 4;
  const dustIntensity = altitude < 2 && armed ? Math.max(0, (1 - altitude / 2)) * (avgRPM / 5000) : 0;
  const dustSpread = 0.3 + (avgRPM / 5000) * 0.5;

  // Motor positions relative to drone center
  const motorPositions = useMemo(() => [
    new THREE.Vector3(0.15, 0.02, 0.15),
    new THREE.Vector3(-0.15, 0.02, 0.15),
    new THREE.Vector3(-0.15, 0.02, -0.15),
    new THREE.Vector3(0.15, 0.02, -0.15)
  ], []);

  return (
    <>
      {/* Ground dust effect */}
      <DustParticles
        position={position}
        intensity={dustIntensity}
        spread={dustSpread}
      />

      {/* Motor exhaust */}
      {armed && (
        <MotorExhaust
          motorPositions={motorPositions}
          motorRPM={motorRPM}
          dronePosition={position}
        />
      )}
    </>
  );
};
