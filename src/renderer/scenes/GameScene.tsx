import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sky, Grid, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { Drone } from './Drone';
import { useGameStore } from '../store/gameStore';
import { useInputStore } from '../store/inputStore';
import { useGameManager } from '../hooks/useGameManager';
import { useCameraController } from '../hooks/useCameraController';
import type { MissionObjective } from '@shared/types';

export function GameScene(): JSX.Element {
  const droneRef = useRef<THREE.Group>(null);
  const cameraController = useCameraController('chase');

  const isPlaying = useGameStore((state) => state.isPlaying);
  const isPaused = useGameStore((state) => state.isPaused);
  const currentScreen = useGameStore((state) => state.currentScreen);
  const tick = useGameStore((state) => state.tick);
  const updateInput = useInputStore((state) => state.update);

  // Game manager with all systems
  const gameManager = useGameManager();
  const { tutorial, mission, update, initAudio } = gameManager;

  // Local state for 3D scene rendering
  const [tutorialTask, setTutorialTask] = useState(tutorial.getCurrentTask());
  const [missionState, setMissionState] = useState(mission.getCurrentMissionState());
  const [nextObjective, setNextObjective] = useState<MissionObjective | null>(null);

  // Initialize audio on first click
  useEffect(() => {
    const handleInteraction = (): void => {
      initAudio();
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, [initAudio]);

  // Game loop
  useFrame((_, delta) => {
    if (!isPlaying || isPaused) return;

    // Clamp delta to prevent physics explosions
    const dt = Math.min(delta, 0.05);

    // Update input
    updateInput(dt * 1000);

    // Update all game systems
    const result = update(dt);

    // Update drone mesh and camera
    if (droneRef.current && result) {
      const { physicsState, euler } = result;
      droneRef.current.position.set(
        physicsState.position.x,
        physicsState.position.y,
        physicsState.position.z
      );

      // Apply rotation from physics
      droneRef.current.rotation.x = euler.pitch * (Math.PI / 180);
      droneRef.current.rotation.z = euler.roll * (Math.PI / 180);
      droneRef.current.rotation.y = euler.yaw * (Math.PI / 180);

      // Update camera based on current mode
      cameraController.update(physicsState.position, euler, dt);
    }

    // Update 3D scene state for markers
    if (currentScreen === 'tutorial') {
      setTutorialTask(tutorial.getCurrentTask());
    }
    if (currentScreen === 'mission') {
      setMissionState(mission.getCurrentMissionState());
      setNextObjective(mission.getNextObjective());
    }

    // Update game time
    tick(dt);
  });

  // Get mission objectives for rendering gates
  const missionObjectives = missionState?.mission.objectives || [];

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[50, 50, 25]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={100}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />

      {/* Sky */}
      <Sky
        distance={450000}
        sunPosition={[50, 50, 25]}
        inclination={0.6}
        azimuth={0.25}
      />

      {/* Environment */}
      <Environment preset="sunset" />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color="#4a7c59" />
      </mesh>

      {/* Grid */}
      <Grid
        position={[0, 0.01, 0]}
        args={[100, 100]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#3d6b4a"
        sectionSize={10}
        sectionThickness={1}
        sectionColor="#2d5a3a"
        fadeDistance={100}
        fadeStrength={1}
        followCamera={false}
      />

      {/* Landing pad */}
      <LandingPad position={[0, 0.02, 0]} />

      {/* Drone */}
      <Drone ref={droneRef} />

      {/* Training gates for free play */}
      {currentScreen === 'freePlay' && (
        <>
          <TrainingGate position={[10, 3, 0]} />
          <TrainingGate position={[20, 4, 5]} rotation={[0, Math.PI / 4, 0]} />
          <TrainingGate position={[30, 3, -5]} rotation={[0, -Math.PI / 4, 0]} />
        </>
      )}

      {/* Mission objectives */}
      {currentScreen === 'mission' &&
        missionObjectives.map((obj) => (
          <ObjectiveMarker
            key={obj.id}
            objective={obj}
            isNext={nextObjective?.id === obj.id}
          />
        ))}

      {/* Tutorial markers */}
      {currentScreen === 'tutorial' && tutorialTask?.targetPosition && (
        <TargetMarker position={tutorialTask.targetPosition} />
      )}
      {currentScreen === 'tutorial' && tutorialTask?.targetAltitude && (
        <AltitudeRing altitude={tutorialTask.targetAltitude} />
      )}
    </>
  );
}

function LandingPad({ position }: { position: [number, number, number] }): JSX.Element {
  return (
    <group position={position}>
      {/* Pad base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3, 32]} />
        <meshStandardMaterial color="#333" />
      </mesh>

      {/* H marking */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[0.4, 2]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.5, 0.01, 0]}>
        <planeGeometry args={[0.4, 2]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.5, 0.01, 0]}>
        <planeGeometry args={[0.4, 2]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[1.4, 0.4]} />
        <meshStandardMaterial color="#fff" />
      </mesh>

      {/* Corner lights */}
      {[
        [2.5, 0.1, 2.5],
        [2.5, 0.1, -2.5],
        [-2.5, 0.1, 2.5],
        [-2.5, 0.1, -2.5],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={2} />
        </mesh>
      ))}
    </group>
  );
}

interface TrainingGateProps {
  position: [number, number, number];
  rotation?: [number, number, number];
}

function TrainingGate({ position, rotation = [0, 0, 0] }: TrainingGateProps): JSX.Element {
  return (
    <group position={position} rotation={rotation}>
      {/* Gate frame */}
      <mesh position={[-2, 0, 0]}>
        <boxGeometry args={[0.2, 4, 0.2]} />
        <meshStandardMaterial color="#ff4444" />
      </mesh>
      <mesh position={[2, 0, 0]}>
        <boxGeometry args={[0.2, 4, 0.2]} />
        <meshStandardMaterial color="#ff4444" />
      </mesh>
      <mesh position={[0, 2, 0]}>
        <boxGeometry args={[4.2, 0.2, 0.2]} />
        <meshStandardMaterial color="#ff4444" />
      </mesh>

      {/* Gate indicator */}
      <mesh position={[0, 0, 0.1]} rotation={[0, 0, 0]}>
        <ringGeometry args={[1.5, 1.8, 32]} />
        <meshStandardMaterial
          color="#00ffff"
          emissive="#00ffff"
          emissiveIntensity={0.5}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

interface ObjectiveMarkerProps {
  objective: import('@shared/types').MissionObjective;
  isNext: boolean;
}

function ObjectiveMarker({ objective, isNext }: ObjectiveMarkerProps): JSX.Element {
  const { position, type, completed, radius } = objective;

  if (completed) {
    return (
      <mesh position={[position.x, position.y, position.z]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={0.3} />
      </mesh>
    );
  }

  const color = isNext ? '#ffaa00' : '#4a9eff';

  switch (type) {
    case 'checkpoint':
      return (
        <group position={[position.x, position.y, position.z]}>
          <mesh>
            <torusGeometry args={[radius, 0.1, 16, 32]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={isNext ? 1 : 0.3}
              transparent
              opacity={0.8}
            />
          </mesh>
          {isNext && (
            <mesh>
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} />
            </mesh>
          )}
        </group>
      );

    case 'land':
      return (
        <group position={[position.x, 0.05, position.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[radius - 0.2, radius, 32]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={isNext ? 1 : 0.3}
              transparent
              opacity={0.8}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <circleGeometry args={[radius - 0.3, 32]} />
            <meshStandardMaterial color="#333" transparent opacity={0.5} />
          </mesh>
        </group>
      );

    case 'hover':
      return (
        <group position={[position.x, position.y, position.z]}>
          <mesh>
            <boxGeometry args={[radius * 2, radius * 2, radius * 2]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={isNext ? 0.5 : 0.2}
              transparent
              opacity={0.3}
              wireframe
            />
          </mesh>
        </group>
      );

    case 'collect':
      return (
        <group position={[position.x, position.y, position.z]}>
          <mesh>
            <octahedronGeometry args={[0.5]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={isNext ? 1 : 0.5}
            />
          </mesh>
        </group>
      );

    default:
      return (
        <mesh position={[position.x, position.y, position.z]}>
          <sphereGeometry args={[radius, 16, 16]} />
          <meshStandardMaterial color={color} transparent opacity={0.5} />
        </mesh>
      );
  }
}

interface TargetMarkerProps {
  position: { x: number; y: number; z: number };
}

function TargetMarker({ position }: TargetMarkerProps): JSX.Element {
  return (
    <group position={[position.x, position.y, position.z]}>
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial
          color="#00ff88"
          emissive="#00ff88"
          emissiveIntensity={1}
          transparent
          opacity={0.6}
        />
      </mesh>
      <mesh>
        <ringGeometry args={[1, 1.2, 32]} />
        <meshStandardMaterial
          color="#00ff88"
          emissive="#00ff88"
          emissiveIntensity={0.5}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

interface AltitudeRingProps {
  altitude: number;
}

function AltitudeRing({ altitude }: AltitudeRingProps): JSX.Element {
  return (
    <mesh position={[0, altitude, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[8, 10, 64]} />
      <meshStandardMaterial
        color="#00ff88"
        emissive="#00ff88"
        emissiveIntensity={0.3}
        transparent
        opacity={0.2}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
