import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface TerrainProps {
  size?: number;
  resolution?: number;
  heightScale?: number;
  type?: 'grass' | 'desert' | 'snow' | 'urban';
}

// Value noise with smoothstep interpolation
const hash = (x: number, z: number): number => {
  let h = (x * 374761393 + z * 668265263) | 0;
  h = ((h ^ (h >> 13)) * 1274126177) | 0;
  return (h & 0x7fffffff) / 0x7fffffff; // 0 to 1
};

const smoothstep = (t: number): number => t * t * (3 - 2 * t);

const valueNoise = (x: number, z: number): number => {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = smoothstep(x - ix);
  const fz = smoothstep(z - iz);

  const a = hash(ix, iz);
  const b = hash(ix + 1, iz);
  const c = hash(ix, iz + 1);
  const d = hash(ix + 1, iz + 1);

  return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
};

// Fractal Brownian Motion - 5 octaves for natural terrain
const fbm = (x: number, z: number, octaves = 5): number => {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    value += valueNoise(x * frequency, z * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2.1;
  }

  return value / maxValue; // Normalize to 0-1
};

// Generate procedural height map with FBM value noise
const generateHeightMap = (resolution: number, scale: number): Float32Array => {
  const heights = new Float32Array((resolution + 1) * (resolution + 1));

  for (let z = 0; z <= resolution; z++) {
    for (let x = 0; x <= resolution; x++) {
      const nx = (x / resolution - 0.5) * 10;
      const nz = (z / resolution - 0.5) * 10;

      // FBM noise centered around 0
      let height = (fbm(nx, nz, 5) - 0.5) * 2 * scale;

      // Add ridge features using abs of noise
      const ridge = Math.abs(fbm(nx * 1.5 + 7.3, nz * 1.5 + 2.8, 3) - 0.5) * scale * 0.5;
      height += ridge;

      // Flatten center area (landing zone)
      const distFromCenter = Math.sqrt(
        ((x / resolution - 0.5) * (x / resolution - 0.5)) +
        ((z / resolution - 0.5) * (z / resolution - 0.5))
      );
      if (distFromCenter < 0.1) {
        height *= distFromCenter / 0.1;
      }

      heights[z * (resolution + 1) + x] = height;
    }
  }

  return heights;
};

// Terrain vertex shader for grass animation
const grassVertexShader = `
  varying vec2 vUv;
  varying float vHeight;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vHeight = position.y;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Terrain fragment shader
const terrainFragmentShader = `
  uniform vec3 grassColor;
  uniform vec3 dirtColor;
  uniform vec3 rockColor;
  uniform float time;

  varying vec2 vUv;
  varying float vHeight;
  varying vec3 vNormal;
  varying vec3 vPosition;

  // Simple noise function
  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    // Base colors based on height
    vec3 color = grassColor;

    // Mix in dirt at lower heights
    float dirtFactor = smoothstep(-0.5, 0.0, vHeight);
    color = mix(dirtColor, color, dirtFactor);

    // Mix in rock at higher heights
    float rockFactor = smoothstep(1.0, 2.0, vHeight);
    color = mix(color, rockColor, rockFactor);

    // Add slope-based rock
    float slope = 1.0 - dot(vNormal, vec3(0.0, 1.0, 0.0));
    color = mix(color, rockColor, smoothstep(0.3, 0.6, slope));

    // Add procedural detail
    float detail = noise(vUv * 100.0) * 0.1;
    color += detail;

    // Simple lighting
    vec3 lightDir = normalize(vec3(1.0, 1.0, 0.5));
    float light = max(dot(vNormal, lightDir), 0.2);
    color *= light;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export const Terrain: React.FC<TerrainProps> = ({
  size = 200,
  resolution = 128,
  heightScale = 3,
  type = 'grass'
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Generate terrain geometry
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, resolution, resolution);
    geo.rotateX(-Math.PI / 2);

    const heights = generateHeightMap(resolution, heightScale);
    const positions = geo.attributes.position.array as Float32Array;

    for (let i = 0; i < positions.length / 3; i++) {
      positions[i * 3 + 1] = heights[i];
    }

    geo.computeVertexNormals();
    return geo;
  }, [size, resolution, heightScale]);

  // Color schemes for different terrain types
  const colors = useMemo(() => {
    switch (type) {
      case 'desert':
        return {
          grass: new THREE.Color('#d4a574'),
          dirt: new THREE.Color('#c4956a'),
          rock: new THREE.Color('#8b7355')
        };
      case 'snow':
        return {
          grass: new THREE.Color('#f0f0f0'),
          dirt: new THREE.Color('#e8e8e8'),
          rock: new THREE.Color('#888888')
        };
      case 'urban':
        return {
          grass: new THREE.Color('#4a4a4a'),
          dirt: new THREE.Color('#3a3a3a'),
          rock: new THREE.Color('#2a2a2a')
        };
      default: // grass
        return {
          grass: new THREE.Color('#3d7c47'),
          dirt: new THREE.Color('#8b6914'),
          rock: new THREE.Color('#666666')
        };
    }
  }, [type]);

  // Shader material
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: grassVertexShader,
      fragmentShader: terrainFragmentShader,
      uniforms: {
        grassColor: { value: colors.grass },
        dirtColor: { value: colors.dirt },
        rockColor: { value: colors.rock },
        time: { value: 0 }
      }
    });
  }, [colors]);

  useFrame((state) => {
    if (material.uniforms) {
      material.uniforms.time.value = state.clock.elapsedTime;
    }
  });

  return (
    <group>
      {/* Main terrain */}
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        receiveShadow
      />

      {/* Landing pad at center */}
      <LandingPad position={[0, 0.02, 0]} />

      {/* Scattered trees/objects */}
      <TerrainObjects type={type} size={size} />
    </group>
  );
};

// Landing pad component
const LandingPad: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
      {/* Main pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[3, 32]} />
        <meshStandardMaterial color="#333333" roughness={0.8} />
      </mesh>

      {/* H marking */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[0.3, 1.5]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[1, 0.3]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Circle marking */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[2, 2.2, 32]} />
        <meshStandardMaterial color="#ffff00" />
      </mesh>

      {/* Corner lights */}
      {[
        [2.5, 0.1, 2.5],
        [-2.5, 0.1, 2.5],
        [-2.5, 0.1, -2.5],
        [2.5, 0.1, -2.5]
      ].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          <mesh>
            <cylinderGeometry args={[0.1, 0.1, 0.2, 8]} />
            <meshStandardMaterial color="#222222" />
          </mesh>
          <pointLight color="#00ff00" intensity={0.5} distance={5} />
        </group>
      ))}
    </group>
  );
};

// Terrain objects (trees, rocks, etc.)
const TerrainObjects: React.FC<{ type: string; size: number }> = ({ type, size }) => {
  const objects = useMemo(() => {
    const items: { position: [number, number, number]; type: string; scale: number }[] = [];
    const count = type === 'urban' ? 30 : 50;

    for (let i = 0; i < count; i++) {
      // Random position, avoiding center landing zone
      let x, z;
      do {
        x = (Math.random() - 0.5) * size * 0.8;
        z = (Math.random() - 0.5) * size * 0.8;
      } while (Math.sqrt(x * x + z * z) < 15);

      items.push({
        position: [x, 0, z],
        type: type === 'urban' ? 'building' : type === 'desert' ? 'rock' : 'tree',
        scale: 0.5 + Math.random() * 1.5
      });
    }

    return items;
  }, [type, size]);

  return (
    <group>
      {objects.map((obj, i) => (
        <TerrainObject key={i} {...obj} />
      ))}
    </group>
  );
};

// Individual terrain object
const TerrainObject: React.FC<{
  position: [number, number, number];
  type: string;
  scale: number;
}> = ({ position, type, scale }) => {
  if (type === 'tree') {
    return (
      <group position={position} scale={scale}>
        {/* Trunk */}
        <mesh position={[0, 1, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.3, 2, 8]} />
          <meshStandardMaterial color="#4a3728" roughness={0.9} />
        </mesh>
        {/* Foliage */}
        <mesh position={[0, 3, 0]} castShadow>
          <coneGeometry args={[1.5, 3, 8]} />
          <meshStandardMaterial color="#2d5a27" roughness={0.8} />
        </mesh>
        <mesh position={[0, 4.5, 0]} castShadow>
          <coneGeometry args={[1, 2, 8]} />
          <meshStandardMaterial color="#2d5a27" roughness={0.8} />
        </mesh>
      </group>
    );
  }

  if (type === 'rock') {
    return (
      <mesh position={position} scale={scale} castShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#8b7355" roughness={0.95} />
      </mesh>
    );
  }

  if (type === 'building') {
    const height = 5 + Math.random() * 20;
    return (
      <group position={position}>
        <mesh position={[0, height / 2, 0]} castShadow>
          <boxGeometry args={[4 * scale, height, 4 * scale]} />
          <meshStandardMaterial color="#555555" roughness={0.7} metalness={0.3} />
        </mesh>
        {/* Windows */}
        {Array.from({ length: Math.floor(height / 3) }).map((_, i) => (
          <mesh key={i} position={[2 * scale + 0.01, 2 + i * 3, 0]}>
            <planeGeometry args={[3 * scale * 0.8, 2]} />
            <meshStandardMaterial
              color="#88ccff"
              emissive="#88ccff"
              emissiveIntensity={0.3}
            />
          </mesh>
        ))}
      </group>
    );
  }

  return null;
};
