import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface DroneModelProps {
  motorRPM: [number, number, number, number];
  armed: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

export const DroneModel: React.FC<DroneModelProps> = ({
  motorRPM,
  armed,
  position = [0, 0, 0],
  rotation = [0, 0, 0]
}) => {
  const propellerRefs = [
    useRef<THREE.Group>(null),
    useRef<THREE.Group>(null),
    useRef<THREE.Group>(null),
    useRef<THREE.Group>(null)
  ];

  const motorLightRefs = [
    useRef<THREE.PointLight>(null),
    useRef<THREE.PointLight>(null),
    useRef<THREE.PointLight>(null),
    useRef<THREE.PointLight>(null)
  ];

  // Motor positions (X pattern)
  const motorPositions: [number, number, number][] = [
    [0.15, 0.02, 0.15],   // Front-right
    [-0.15, 0.02, 0.15],  // Front-left
    [-0.15, 0.02, -0.15], // Back-left
    [0.15, 0.02, -0.15]   // Back-right
  ];

  // Create propeller geometry
  const propellerGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(0.08, 0.008);
    shape.lineTo(0.08, -0.008);
    shape.lineTo(0, 0);

    const extrudeSettings = {
      depth: 0.003,
      bevelEnabled: false
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, []);

  // Materials
  const bodyMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#1a1a2e',
    metalness: 0.7,
    roughness: 0.3,
  }), []);

  const carbonMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#2d2d2d',
    metalness: 0.4,
    roughness: 0.6,
  }), []);

  const motorMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#4a4a4a',
    metalness: 0.9,
    roughness: 0.2,
  }), []);

  const propellerMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ff6b6b',
    metalness: 0.3,
    roughness: 0.5,
    transparent: true,
    opacity: 0.9,
  }), []);

  const ledColors = ['#00ff00', '#ff0000', '#ff0000', '#00ff00']; // Front green, back red

  // Animate propellers
  useFrame((_, delta) => {
    propellerRefs.forEach((ref, index) => {
      if (ref.current) {
        const rpm = motorRPM[index];
        const rotationSpeed = (rpm / 60) * Math.PI * 2 * delta;
        // Alternate rotation direction for stability
        const direction = index % 2 === 0 ? 1 : -1;
        ref.current.rotation.y += rotationSpeed * direction;
      }
    });

    // Pulse motor lights based on armed state
    motorLightRefs.forEach((ref, index) => {
      if (ref.current) {
        if (armed) {
          const intensity = 0.5 + Math.sin(Date.now() * 0.01 + index) * 0.2;
          ref.current.intensity = intensity * (motorRPM[index] / 5000);
        } else {
          ref.current.intensity = 0.1;
        }
      }
    });
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Main body - center hub */}
      <mesh material={bodyMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.04, 0.05, 0.03, 8]} />
      </mesh>

      {/* Top cover */}
      <mesh position={[0, 0.02, 0]} material={bodyMaterial} castShadow>
        <sphereGeometry args={[0.04, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>

      {/* Battery indicator */}
      <mesh position={[0, 0.025, 0]}>
        <boxGeometry args={[0.02, 0.005, 0.03]} />
        <meshStandardMaterial color={armed ? '#00ff00' : '#ff0000'} emissive={armed ? '#00ff00' : '#ff0000'} emissiveIntensity={0.5} />
      </mesh>

      {/* Camera mount */}
      <mesh position={[0, -0.015, 0.03]} material={bodyMaterial} castShadow>
        <boxGeometry args={[0.025, 0.02, 0.02]} />
      </mesh>
      <mesh position={[0, -0.015, 0.045]}>
        <sphereGeometry args={[0.008, 8, 8]} />
        <meshStandardMaterial color="#111111" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Camera lens */}
      <mesh position={[0, -0.015, 0.052]}>
        <circleGeometry args={[0.005, 16]} />
        <meshStandardMaterial color="#3366ff" emissive="#3366ff" emissiveIntensity={0.3} />
      </mesh>

      {/* Arms */}
      {motorPositions.map((pos, index) => (
        <group key={`arm-${index}`}>
          {/* Arm */}
          <mesh
            position={[pos[0] / 2, 0, pos[2] / 2]}
            rotation={[0, Math.atan2(pos[0], pos[2]), 0]}
            material={carbonMaterial}
            castShadow
          >
            <boxGeometry args={[0.015, 0.01, 0.21]} />
          </mesh>

          {/* Motor housing */}
          <mesh position={pos} material={motorMaterial} castShadow>
            <cylinderGeometry args={[0.02, 0.018, 0.025, 12]} />
          </mesh>

          {/* Motor top cap */}
          <mesh position={[pos[0], pos[1] + 0.015, pos[2]]} material={motorMaterial} castShadow>
            <cylinderGeometry args={[0.015, 0.02, 0.008, 12]} />
          </mesh>

          {/* Propeller guard ring */}
          <mesh position={[pos[0], pos[1] + 0.01, pos[2]]} material={carbonMaterial}>
            <torusGeometry args={[0.09, 0.004, 8, 24]} />
          </mesh>

          {/* Propeller assembly */}
          <group ref={propellerRefs[index]} position={[pos[0], pos[1] + 0.022, pos[2]]}>
            {/* Propeller hub */}
            <mesh material={motorMaterial}>
              <cylinderGeometry args={[0.008, 0.008, 0.008, 8]} />
            </mesh>

            {/* Propeller blades */}
            <mesh geometry={propellerGeometry} material={propellerMaterial} rotation={[Math.PI / 2, 0, 0]} />
            <mesh geometry={propellerGeometry} material={propellerMaterial} rotation={[Math.PI / 2, 0, Math.PI]} />
          </group>

          {/* LED lights */}
          <mesh position={[pos[0], pos[1] - 0.015, pos[2]]}>
            <sphereGeometry args={[0.005, 8, 8]} />
            <meshStandardMaterial
              color={ledColors[index]}
              emissive={ledColors[index]}
              emissiveIntensity={armed ? 1 : 0.2}
            />
          </mesh>

          {/* Motor glow light */}
          <pointLight
            ref={motorLightRefs[index]}
            position={[pos[0], pos[1] + 0.03, pos[2]]}
            color="#ffaa00"
            intensity={0}
            distance={0.3}
          />
        </group>
      ))}

      {/* Landing gear */}
      {[[-0.1, -0.03, 0], [0.1, -0.03, 0]].map((pos, index) => (
        <group key={`landing-${index}`} position={pos as [number, number, number]}>
          <mesh material={carbonMaterial} castShadow>
            <boxGeometry args={[0.008, 0.04, 0.12]} />
          </mesh>
          {/* Landing feet */}
          <mesh position={[0, -0.02, 0.05]} material={carbonMaterial}>
            <sphereGeometry args={[0.008, 8, 8]} />
          </mesh>
          <mesh position={[0, -0.02, -0.05]} material={carbonMaterial}>
            <sphereGeometry args={[0.008, 8, 8]} />
          </mesh>
        </group>
      ))}

      {/* Antenna */}
      <mesh position={[0, 0.04, -0.02]} material={bodyMaterial}>
        <cylinderGeometry args={[0.002, 0.002, 0.03, 6]} />
      </mesh>
      <mesh position={[0, 0.055, -0.02]}>
        <sphereGeometry args={[0.004, 8, 8]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
};
