import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sky, Cloud, Stars } from '@react-three/drei';
import * as THREE from 'three';

interface EnvironmentProps {
  timeOfDay?: 'dawn' | 'day' | 'dusk' | 'night';
  weather?: 'clear' | 'cloudy' | 'foggy';
}

export const Environment: React.FC<EnvironmentProps> = ({
  timeOfDay = 'day',
  weather = 'clear'
}) => {
  const sunRef = useRef<THREE.DirectionalLight>(null);

  // Sun position based on time of day
  const sunPosition = useMemo(() => {
    switch (timeOfDay) {
      case 'dawn':
        return [100, 20, 100] as [number, number, number];
      case 'day':
        return [100, 100, 50] as [number, number, number];
      case 'dusk':
        return [-100, 20, 100] as [number, number, number];
      case 'night':
        return [0, -100, 0] as [number, number, number];
      default:
        return [100, 100, 50] as [number, number, number];
    }
  }, [timeOfDay]);

  // Sky parameters based on time
  const skyParams = useMemo(() => {
    switch (timeOfDay) {
      case 'dawn':
        return { turbidity: 8, rayleigh: 2, mieCoefficient: 0.1, mieDirectionalG: 0.8 };
      case 'day':
        return { turbidity: 10, rayleigh: 0.5, mieCoefficient: 0.005, mieDirectionalG: 0.8 };
      case 'dusk':
        return { turbidity: 8, rayleigh: 3, mieCoefficient: 0.1, mieDirectionalG: 0.95 };
      case 'night':
        return { turbidity: 20, rayleigh: 0.1, mieCoefficient: 0.001, mieDirectionalG: 0.1 };
      default:
        return { turbidity: 10, rayleigh: 0.5, mieCoefficient: 0.005, mieDirectionalG: 0.8 };
    }
  }, [timeOfDay]);

  // Ambient light intensity
  const ambientIntensity = timeOfDay === 'night' ? 0.1 : timeOfDay === 'dawn' || timeOfDay === 'dusk' ? 0.4 : 0.6;
  const sunIntensity = timeOfDay === 'night' ? 0.1 : timeOfDay === 'dawn' || timeOfDay === 'dusk' ? 0.8 : 1.2;

  // Animate sun slightly for dynamic lighting
  useFrame((state) => {
    if (sunRef.current && timeOfDay === 'day') {
      const t = state.clock.elapsedTime * 0.01;
      sunRef.current.position.x = sunPosition[0] + Math.sin(t) * 10;
      sunRef.current.position.z = sunPosition[2] + Math.cos(t) * 10;
    }
  });

  return (
    <>
      {/* Sky */}
      {timeOfDay !== 'night' && (
        <Sky
          distance={450000}
          sunPosition={sunPosition}
          inclination={0.5}
          azimuth={0.25}
          {...skyParams}
        />
      )}

      {/* Stars for night/dusk */}
      {(timeOfDay === 'night' || timeOfDay === 'dusk') && (
        <Stars
          radius={300}
          depth={60}
          count={timeOfDay === 'night' ? 7000 : 2000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />
      )}

      {/* Clouds */}
      {weather !== 'clear' && timeOfDay !== 'night' && (
        <>
          <Cloud position={[-40, 40, -50]} speed={0.2} opacity={weather === 'foggy' ? 0.8 : 0.5} />
          <Cloud position={[40, 35, -30]} speed={0.3} opacity={weather === 'foggy' ? 0.7 : 0.4} />
          <Cloud position={[0, 45, 50]} speed={0.25} opacity={weather === 'foggy' ? 0.9 : 0.6} />
          <Cloud position={[-60, 38, 20]} speed={0.15} opacity={weather === 'foggy' ? 0.6 : 0.3} />
          <Cloud position={[60, 42, -40]} speed={0.35} opacity={weather === 'foggy' ? 0.75 : 0.45} />
        </>
      )}

      {/* Main directional light (sun/moon) */}
      <directionalLight
        ref={sunRef}
        position={sunPosition}
        intensity={sunIntensity}
        color={timeOfDay === 'dusk' ? '#ff9966' : timeOfDay === 'dawn' ? '#ffcc99' : '#ffffff'}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={500}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />

      {/* Ambient light */}
      <ambientLight intensity={ambientIntensity} color={timeOfDay === 'night' ? '#334466' : '#ffffff'} />

      {/* Hemisphere light for natural sky reflection */}
      <hemisphereLight
        color={timeOfDay === 'night' ? '#112244' : '#87ceeb'}
        groundColor={timeOfDay === 'night' ? '#000000' : '#8b4513'}
        intensity={0.5}
      />

      {/* Fog based on weather */}
      {weather === 'foggy' && (
        <fog attach="fog" args={['#cccccc', 10, 150]} />
      )}
    </>
  );
};
