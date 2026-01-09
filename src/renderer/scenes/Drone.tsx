import { forwardRef, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';

interface DroneProps {
  // Props can be extended later
}

export const Drone = forwardRef<THREE.Group, DroneProps>(function Drone(_, ref) {
  const propellerRefs = useRef<THREE.Mesh[]>([]);
  const drone = useGameStore((state) => state.drone);

  // Animate propellers
  useFrame((_, delta) => {
    const avgRPM = drone.motorRPM.reduce((a, b) => a + b, 0) / 4;
    const rotationSpeed = (avgRPM / 10000) * delta * 100;

    propellerRefs.current.forEach((prop, index) => {
      if (prop) {
        // Alternate rotation direction
        prop.rotation.y += index % 2 === 0 ? rotationSpeed : -rotationSpeed;
      }
    });
  });

  const armLength = 0.15;
  const armPositions: [number, number, number][] = [
    [armLength, 0.02, armLength], // Front-right
    [-armLength, 0.02, armLength], // Front-left
    [-armLength, 0.02, -armLength], // Back-left
    [armLength, 0.02, -armLength], // Back-right
  ];

  return (
    <group ref={ref} position={[0, 1, 0]}>
      {/* Main body */}
      <mesh castShadow>
        <boxGeometry args={[0.15, 0.04, 0.15]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Top plate */}
      <mesh position={[0, 0.025, 0]} castShadow>
        <boxGeometry args={[0.12, 0.01, 0.12]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Camera mount (front) */}
      <mesh position={[0, -0.01, 0.06]} castShadow>
        <boxGeometry args={[0.03, 0.03, 0.03]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0, -0.01, 0.08]}>
        <sphereGeometry args={[0.012, 16, 16]} />
        <meshStandardMaterial color="#111" metalness={1} roughness={0} />
      </mesh>

      {/* Arms and motors */}
      {armPositions.map((pos, index) => (
        <group key={index} position={pos}>
          {/* Arm */}
          <mesh castShadow>
            <boxGeometry args={[0.02, 0.015, 0.02]} />
            <meshStandardMaterial color="#333" />
          </mesh>

          {/* Motor */}
          <mesh position={[0, 0.02, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.025, 0.03, 16]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.1} />
          </mesh>

          {/* Motor bell */}
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.01, 16]} />
            <meshStandardMaterial color="#ff4444" metalness={0.7} roughness={0.3} />
          </mesh>

          {/* Propeller */}
          <mesh
            ref={(el) => {
              if (el) propellerRefs.current[index] = el;
            }}
            position={[0, 0.05, 0]}
          >
            <boxGeometry args={[0.12, 0.003, 0.015]} />
            <meshStandardMaterial
              color="#444"
              transparent
              opacity={0.8}
            />
          </mesh>

          {/* Propeller blur (when spinning) */}
          {drone.motorRPM[index] > 1000 && (
            <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.06, 32]} />
              <meshStandardMaterial
                color="#666"
                transparent
                opacity={Math.min(0.3, drone.motorRPM[index] / 30000)}
                side={THREE.DoubleSide}
              />
            </mesh>
          )}
        </group>
      ))}

      {/* LED lights */}
      <LEDLight position={[0.06, 0, 0.06]} color={drone.isArmed ? '#00ff00' : '#ff0000'} />
      <LEDLight position={[-0.06, 0, 0.06]} color={drone.isArmed ? '#00ff00' : '#ff0000'} />
      <LEDLight position={[0.06, 0, -0.06]} color="#ffffff" intensity={0.5} />
      <LEDLight position={[-0.06, 0, -0.06]} color="#ffffff" intensity={0.5} />

      {/* Battery indicator */}
      <mesh position={[0, -0.025, 0]}>
        <boxGeometry args={[0.06, 0.02, 0.04]} />
        <meshStandardMaterial color="#222" />
      </mesh>

      {/* Thrust visualization */}
      {drone.isArmed && drone.motorRPM[0] > 5000 && <ThrustEffect intensity={drone.motorRPM[0] / 10000} />}
    </group>
  );
});

interface LEDLightProps {
  position: [number, number, number];
  color: string;
  intensity?: number;
}

function LEDLight({ position, color, intensity = 1 }: LEDLightProps): JSX.Element {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.008, 8, 8]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={intensity * 2}
      />
    </mesh>
  );
}

interface ThrustEffectProps {
  intensity: number;
}

function ThrustEffect({ intensity }: ThrustEffectProps): JSX.Element {
  const ref = useRef<THREE.Points>(null);

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.1;
    }
  });

  const particleCount = 50;
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2;
    const radius = 0.1 + Math.random() * 0.05;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = -0.05 - Math.random() * 0.1 * intensity;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
  }

  return (
    <points ref={ref}>
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
        opacity={intensity * 0.5}
        sizeAttenuation
      />
    </points>
  );
}
