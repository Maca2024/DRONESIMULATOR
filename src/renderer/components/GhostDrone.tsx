/**
 * GhostDrone - Semi-transparent replay visualization
 *
 * Renders a ghost drone showing recorded flight playback position
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { flightRecorder } from '../systems/FlightRecorder';

interface GhostDroneProps {
  opacity?: number;
  color?: string;
}

export const GhostDrone: React.FC<GhostDroneProps> = ({
  opacity = 0.5,
  color = '#00ff88'
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const propellerRefs = [
    useRef<THREE.Group>(null),
    useRef<THREE.Group>(null),
    useRef<THREE.Group>(null),
    useRef<THREE.Group>(null)
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

  // Ghost materials - semi-transparent
  const ghostBodyMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: color,
    metalness: 0.3,
    roughness: 0.5,
    transparent: true,
    opacity: opacity * 0.8,
  }), [color, opacity]);

  const ghostArmMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: color,
    metalness: 0.2,
    roughness: 0.6,
    transparent: true,
    opacity: opacity * 0.6,
  }), [color, opacity]);

  const ghostPropellerMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ffffff',
    metalness: 0.3,
    roughness: 0.5,
    transparent: true,
    opacity: opacity * 0.4,
  }), [opacity]);

  // Update position and animate propellers
  useFrame(() => {
    const frame = flightRecorder.getInterpolatedFrame();

    if (!frame || !groupRef.current) return;

    // Update position
    groupRef.current.position.set(
      frame.position.x,
      frame.position.y,
      frame.position.z
    );

    // Update rotation from quaternion
    groupRef.current.quaternion.set(
      frame.rotation.x,
      frame.rotation.y,
      frame.rotation.z,
      frame.rotation.w
    );

    // Animate propellers based on motor RPM
    propellerRefs.forEach((ref, index) => {
      if (ref.current) {
        const rpm = frame.motorRPM[index];
        const rotationSpeed = (rpm / 60) * Math.PI * 2 * 0.016; // ~60fps
        const direction = index % 2 === 0 ? 1 : -1;
        ref.current.rotation.y += rotationSpeed * direction;
      }
    });
  });

  // Check if playback is active
  const playbackState = flightRecorder.getPlaybackState();
  if (!playbackState.isPlaying && playbackState.progress === 0) {
    return null;
  }

  return (
    <group ref={groupRef}>
      {/* Center body */}
      <mesh material={ghostBodyMaterial}>
        <boxGeometry args={[0.1, 0.03, 0.1]} />
      </mesh>

      {/* Arms */}
      {motorPositions.map((pos, index) => (
        <group key={index}>
          {/* Arm */}
          <mesh
            position={[pos[0] / 2, pos[1], pos[2] / 2]}
            rotation={[0, Math.atan2(pos[0], pos[2]), 0]}
            material={ghostArmMaterial}
          >
            <boxGeometry args={[0.02, 0.015, 0.21]} />
          </mesh>

          {/* Motor housing */}
          <mesh position={pos} material={ghostBodyMaterial}>
            <cylinderGeometry args={[0.025, 0.025, 0.04, 8]} />
          </mesh>

          {/* Propeller */}
          <group ref={propellerRefs[index]} position={[pos[0], pos[1] + 0.025, pos[2]]}>
            <mesh geometry={propellerGeometry} material={ghostPropellerMaterial} />
            <mesh
              geometry={propellerGeometry}
              material={ghostPropellerMaterial}
              rotation={[0, Math.PI, 0]}
            />
          </group>
        </group>
      ))}

      {/* Ghost glow effect */}
      <pointLight color={color} intensity={0.5} distance={2} />
    </group>
  );
};
