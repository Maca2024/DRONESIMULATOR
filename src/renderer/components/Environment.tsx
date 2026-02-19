import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sky, Cloud, Stars } from '@react-three/drei';
import * as THREE from 'three';

interface EnvironmentProps {
  timeOfDay?: 'dawn' | 'day' | 'dusk' | 'night';
  weather?: 'clear' | 'cloudy' | 'foggy';
  continuousTime?: number; // 0-24, overrides discrete timeOfDay if provided
}

// Convert continuous time (0-24) to sun position
function getSunPosition(time: number): [number, number, number] {
  // Sun rises at 6, peaks at 12, sets at 18
  const angle = ((time - 6) / 12) * Math.PI;
  const sunY = Math.sin(angle) * 100;
  const sunX = Math.cos(angle) * 100;
  return [sunX, Math.max(-50, sunY), 50];
}

// Interpolate colors based on time
function getTimeColors(time: number) {
  // Night: 0-5, Dawn: 5-7, Day: 7-17, Dusk: 17-19, Night: 19-24
  if (time < 5 || time >= 20) {
    return {
      sunColor: '#334466',
      ambientColor: '#112233',
      skyColor: '#000011',
      ambientIntensity: 0.1,
      sunIntensity: 0.1,
      isNight: true,
      isDusk: false,
    };
  } else if (time < 7) {
    const t = (time - 5) / 2; // 0-1
    return {
      sunColor: lerpColor('#334466', '#ffcc99', t),
      ambientColor: lerpColor('#112233', '#ffffff', t),
      skyColor: lerpColor('#000011', '#87ceeb', t),
      ambientIntensity: 0.1 + t * 0.3,
      sunIntensity: 0.1 + t * 0.7,
      isNight: t < 0.3,
      isDusk: true,
    };
  } else if (time < 17) {
    return {
      sunColor: '#ffffff',
      ambientColor: '#ffffff',
      skyColor: '#87ceeb',
      ambientIntensity: 0.6,
      sunIntensity: 1.2,
      isNight: false,
      isDusk: false,
    };
  } else if (time < 20) {
    const t = (time - 17) / 3; // 0-1
    return {
      sunColor: lerpColor('#ffffff', '#ff9966', t),
      ambientColor: lerpColor('#ffffff', '#334466', t),
      skyColor: lerpColor('#87ceeb', '#000011', t),
      ambientIntensity: 0.6 - t * 0.5,
      sunIntensity: 1.2 - t * 1.1,
      isNight: t > 0.8,
      isDusk: true,
    };
  }
  return {
    sunColor: '#ffffff',
    ambientColor: '#ffffff',
    skyColor: '#87ceeb',
    ambientIntensity: 0.6,
    sunIntensity: 1.2,
    isNight: false,
    isDusk: false,
  };
}

function lerpColor(a: string, b: string, t: number): string {
  const ca = new THREE.Color(a);
  const cb = new THREE.Color(b);
  ca.lerp(cb, t);
  return '#' + ca.getHexString();
}

export const Environment: React.FC<EnvironmentProps> = ({
  timeOfDay = 'day',
  weather = 'clear',
  continuousTime,
}) => {
  const sunRef = useRef<THREE.DirectionalLight>(null);

  // Determine effective time
  const effectiveTime = continuousTime ?? (
    timeOfDay === 'dawn' ? 6 : timeOfDay === 'day' ? 12 : timeOfDay === 'dusk' ? 18 : 0
  );

  const sunPosition = useMemo(() => getSunPosition(effectiveTime), [effectiveTime]);
  const colors = useMemo(() => getTimeColors(effectiveTime), [effectiveTime]);

  // Sky parameters interpolated by time
  const skyParams = useMemo(() => {
    if (colors.isNight) {
      return { turbidity: 20, rayleigh: 0.1, mieCoefficient: 0.001, mieDirectionalG: 0.1 };
    }
    if (colors.isDusk) {
      return { turbidity: 8, rayleigh: 2.5, mieCoefficient: 0.1, mieDirectionalG: 0.9 };
    }
    return { turbidity: 10, rayleigh: 0.5, mieCoefficient: 0.005, mieDirectionalG: 0.8 };
  }, [colors.isNight, colors.isDusk]);

  // Animate sun slightly for dynamic lighting
  useFrame((state) => {
    if (sunRef.current && !colors.isNight) {
      const t = state.clock.elapsedTime * 0.01;
      sunRef.current.position.x = sunPosition[0] + Math.sin(t) * 10;
      sunRef.current.position.z = sunPosition[2] + Math.cos(t) * 10;
    }
  });

  return (
    <>
      {/* Sky */}
      {!colors.isNight && (
        <Sky
          distance={450000}
          sunPosition={sunPosition}
          inclination={0.5}
          azimuth={0.25}
          {...skyParams}
        />
      )}

      {/* Stars for night/dusk */}
      {(colors.isNight || colors.isDusk) && (
        <Stars
          radius={300}
          depth={60}
          count={colors.isNight ? 7000 : 2000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />
      )}

      {/* Clouds */}
      {weather !== 'clear' && !colors.isNight && (
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
        intensity={colors.sunIntensity}
        color={colors.sunColor}
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
      <ambientLight intensity={colors.ambientIntensity} color={colors.ambientColor} />

      {/* Hemisphere light for natural sky reflection */}
      <hemisphereLight
        color={colors.isNight ? '#112244' : colors.skyColor}
        groundColor={colors.isNight ? '#000000' : '#8b4513'}
        intensity={0.5}
      />

      {/* Fog based on weather */}
      {weather === 'foggy' && (
        <fog attach="fog" args={['#cccccc', 10, 150]} />
      )}
    </>
  );
};
