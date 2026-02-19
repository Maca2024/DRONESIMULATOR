import React from 'react';
import { Trail } from '@react-three/drei';
import * as THREE from 'three';

interface DroneTrailProps {
  droneRef: React.RefObject<THREE.Group>;
  color?: string;
}

export const DroneTrail: React.FC<DroneTrailProps> = ({
  droneRef,
  color = '#00ffff',
}) => {
  if (!droneRef.current) return null;

  return (
    <Trail
      width={0.5}
      length={20}
      color={new THREE.Color(color)}
      attenuation={(w: number) => w * w}
      target={droneRef as React.MutableRefObject<THREE.Object3D>}
    />
  );
};
