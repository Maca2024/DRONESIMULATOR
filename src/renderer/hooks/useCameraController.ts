/**
 * useCameraController - Manages different camera modes
 *
 * Modes:
 * - chase: Third-person follow camera
 * - fpv: First-person cockpit view
 * - orbit: Free orbit around drone
 * - cinematic: Smooth cinematic tracking
 */

import { useRef, useCallback, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

export type CameraMode = 'chase' | 'fpv' | 'orbit' | 'cinematic';

export interface CameraConfig {
  chase: {
    distance: number;
    height: number;
    smoothing: number;
    lookAhead: number;
  };
  fpv: {
    offset: { x: number; y: number; z: number };
    tilt: number;
  };
  orbit: {
    radius: number;
    height: number;
    autoRotate: boolean;
    rotateSpeed: number;
  };
  cinematic: {
    distance: number;
    height: number;
    smoothing: number;
  };
}

const DEFAULT_CONFIG: CameraConfig = {
  chase: {
    distance: 8,
    height: 3,
    smoothing: 0.05,
    lookAhead: 2,
  },
  fpv: {
    offset: { x: 0, y: 0.1, z: 0.2 },
    tilt: -10,
  },
  orbit: {
    radius: 15,
    height: 5,
    autoRotate: true,
    rotateSpeed: 0.5,
  },
  cinematic: {
    distance: 20,
    height: 8,
    smoothing: 0.02,
  },
};

export interface CameraController {
  mode: CameraMode;
  setMode: (mode: CameraMode) => void;
  cycleMode: () => void;
  update: (
    dronePosition: { x: number; y: number; z: number },
    droneRotation: { roll: number; pitch: number; yaw: number },
    deltaTime: number
  ) => void;
}

export function useCameraController(
  initialMode: CameraMode = 'chase',
  config: Partial<CameraConfig> = {}
): CameraController {
  const { camera } = useThree();
  const modeRef = useRef<CameraMode>(initialMode);
  const targetPosition = useRef(new THREE.Vector3());
  const currentPosition = useRef(new THREE.Vector3());
  const orbitAngle = useRef(0);
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  // Mode cycling order
  const MODES: CameraMode[] = ['chase', 'fpv', 'orbit', 'cinematic'];

  const setMode = useCallback((mode: CameraMode) => {
    modeRef.current = mode;
    console.info(`Camera mode: ${mode}`);
  }, []);

  const cycleMode = useCallback(() => {
    const currentIndex = MODES.indexOf(modeRef.current);
    const nextIndex = (currentIndex + 1) % MODES.length;
    setMode(MODES[nextIndex]);
  }, [setMode]);

  // Listen for camera mode key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.code === 'KeyC' && !e.repeat) {
        cycleMode();
      }
      // Number keys for direct mode selection
      if (e.code === 'Digit4' && !e.repeat) setMode('chase');
      if (e.code === 'Digit5' && !e.repeat) setMode('fpv');
      if (e.code === 'Digit6' && !e.repeat) setMode('orbit');
      if (e.code === 'Digit7' && !e.repeat) setMode('cinematic');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cycleMode, setMode]);

  const update = useCallback(
    (
      dronePosition: { x: number; y: number; z: number },
      droneRotation: { roll: number; pitch: number; yaw: number },
      deltaTime: number
    ) => {
      const dronePos = new THREE.Vector3(dronePosition.x, dronePosition.y, dronePosition.z);
      const yawRad = droneRotation.yaw * (Math.PI / 180);

      switch (modeRef.current) {
        case 'chase': {
          const cfg = fullConfig.chase;
          // Calculate chase camera position
          const offset = new THREE.Vector3(0, cfg.height, cfg.distance);
          offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), yawRad);
          targetPosition.current.copy(dronePos).add(offset);

          // Smooth follow
          currentPosition.current.lerp(targetPosition.current, cfg.smoothing);
          camera.position.copy(currentPosition.current);

          // Look ahead of the drone
          const lookTarget = dronePos.clone();
          const ahead = new THREE.Vector3(0, 0, -cfg.lookAhead);
          ahead.applyAxisAngle(new THREE.Vector3(0, 1, 0), yawRad);
          lookTarget.add(ahead);
          camera.lookAt(lookTarget);
          break;
        }

        case 'fpv': {
          const cfg = fullConfig.fpv;
          // Position camera at drone with small offset
          const offset = new THREE.Vector3(cfg.offset.x, cfg.offset.y, cfg.offset.z);
          offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), yawRad);
          camera.position.copy(dronePos).add(offset);

          // Apply drone rotation to camera
          camera.rotation.set(
            droneRotation.pitch * (Math.PI / 180) + cfg.tilt * (Math.PI / 180),
            yawRad + Math.PI,
            droneRotation.roll * (Math.PI / 180)
          );
          break;
        }

        case 'orbit': {
          const cfg = fullConfig.orbit;
          if (cfg.autoRotate) {
            orbitAngle.current += deltaTime * cfg.rotateSpeed;
          }

          // Orbit around drone
          const x = dronePos.x + Math.sin(orbitAngle.current) * cfg.radius;
          const z = dronePos.z + Math.cos(orbitAngle.current) * cfg.radius;
          camera.position.set(x, dronePos.y + cfg.height, z);
          camera.lookAt(dronePos);
          break;
        }

        case 'cinematic': {
          const cfg = fullConfig.cinematic;
          // Very smooth distant follow
          const offset = new THREE.Vector3(cfg.distance * 0.5, cfg.height, cfg.distance);
          offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), yawRad * 0.3);
          targetPosition.current.copy(dronePos).add(offset);

          // Very slow smoothing for cinematic feel
          currentPosition.current.lerp(targetPosition.current, cfg.smoothing);
          camera.position.copy(currentPosition.current);
          camera.lookAt(dronePos);
          break;
        }
      }
    },
    [camera, fullConfig]
  );

  return {
    mode: modeRef.current,
    setMode,
    cycleMode,
    update,
  };
}
