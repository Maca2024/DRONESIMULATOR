import React, { useMemo } from 'react';
import * as THREE from 'three';

interface NeonGridProps {
  size?: number;
  dronePosition?: { x: number; z: number };
}

const gridVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const gridFragmentShader = `
  uniform float time;
  uniform vec2 dronePos;
  varying vec2 vUv;

  void main() {
    // Scale UV to world coordinates
    vec2 worldPos = (vUv - 0.5) * 200.0;

    // Grid lines
    vec2 grid = abs(fract(worldPos * 0.5) - 0.5);
    float gridLine = min(grid.x, grid.y);
    float line = 1.0 - smoothstep(0.0, 0.03, gridLine);

    // Scrolling effect based on drone position
    vec2 scrollGrid = abs(fract((worldPos - dronePos) * 0.1 + time * 0.1) - 0.5);
    float scrollLine = 1.0 - smoothstep(0.0, 0.05, min(scrollGrid.x, scrollGrid.y));

    // Distance fade from center
    float dist = length(worldPos) / 100.0;
    float fade = 1.0 - smoothstep(0.0, 1.0, dist);

    // Combine
    float intensity = (line * 0.6 + scrollLine * 0.3) * fade;

    // Tron-style cyan glow
    vec3 color = vec3(0.0, 1.0, 0.9) * intensity;

    gl_FragColor = vec4(color, intensity * 0.5);
  }
`;

export const NeonGrid: React.FC<NeonGridProps> = ({
  size = 200,
  dronePosition = { x: 0, z: 0 },
}) => {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: gridVertexShader,
      fragmentShader: gridFragmentShader,
      uniforms: {
        time: { value: 0 },
        dronePos: { value: new THREE.Vector2(dronePosition.x, dronePosition.z) },
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }, []);

  // Update uniforms each frame via useFrame is too expensive for shader material ref
  // Instead, update via the material reference
  React.useEffect(() => {
    const interval = setInterval(() => {
      material.uniforms.time.value = performance.now() * 0.001;
      material.uniforms.dronePos.value.set(dronePosition.x, dronePosition.z);
    }, 16);
    return () => clearInterval(interval);
  }, [material, dronePosition.x, dronePosition.z]);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.03, 0]}
      material={material}
    >
      <planeGeometry args={[size, size]} />
    </mesh>
  );
};
