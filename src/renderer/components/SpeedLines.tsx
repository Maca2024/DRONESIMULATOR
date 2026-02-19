import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface SpeedLinesProps {
  speed: number; // current speed in m/s
  threshold?: number; // minimum speed to show (m/s)
}

const LINE_COUNT = 50;

export const SpeedLines: React.FC<SpeedLinesProps> = ({
  speed,
  threshold = 15,
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { camera } = useThree();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Random angles for each line (arranged radially)
  const lineAngles = useMemo(() => {
    const angles = new Float32Array(LINE_COUNT * 2); // angle, radius
    for (let i = 0; i < LINE_COUNT; i++) {
      angles[i * 2] = Math.random() * Math.PI * 2;
      angles[i * 2 + 1] = 2 + Math.random() * 6; // radius from center
    }
    return angles;
  }, []);

  useFrame(() => {
    if (!meshRef.current || speed < threshold) {
      if (meshRef.current) {
        // Hide all instances
        for (let i = 0; i < LINE_COUNT; i++) {
          dummy.scale.set(0, 0, 0);
          dummy.updateMatrix();
          meshRef.current.setMatrixAt(i, dummy.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
      }
      return;
    }

    const speedFactor = Math.min((speed - threshold) / 30, 1); // 0-1 above threshold
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);

    for (let i = 0; i < LINE_COUNT; i++) {
      const angle = lineAngles[i * 2];
      const radius = lineAngles[i * 2 + 1];

      // Position around camera's forward axis
      const up = new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(forward, up).normalize();
      const realUp = new THREE.Vector3().crossVectors(right, forward).normalize();

      const pos = new THREE.Vector3()
        .copy(camera.position)
        .add(forward.clone().multiplyScalar(5))
        .add(right.clone().multiplyScalar(Math.cos(angle) * radius))
        .add(realUp.clone().multiplyScalar(Math.sin(angle) * radius));

      dummy.position.copy(pos);

      // Point lines along the forward direction
      dummy.quaternion.copy(camera.quaternion);

      // Scale: length based on speed, thin width
      const lineLength = 0.5 + speedFactor * 2;
      dummy.scale.set(0.01, 0.01, lineLength * speedFactor);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (speed < threshold) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, LINE_COUNT]} frustumCulled={false}>
      <cylinderGeometry args={[1, 1, 1, 3]} />
      <meshBasicMaterial
        color="#ffffff"
        transparent
        opacity={0.3}
      />
    </instancedMesh>
  );
};
