import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Grid } from '@react-three/drei';
import * as THREE from 'three';
// Drone model is now in DroneModel component
import { useGameStore } from '../store/gameStore';
import { useInputStore } from '../store/inputStore';
import { useGameManager } from '../hooks/useGameManager';
import { useCameraController } from '../hooks/useCameraController';
import { PostProcessingEffects } from '../components/PostProcessingEffects';
import { Environment } from '../components/Environment';
import { DroneModel } from '../components/DroneModel';
import { ParticleEffects } from '../components/ParticleEffects';
import { Terrain } from '../components/Terrain';
import type { MissionObjective } from '@shared/types';

export function GameScene(): JSX.Element {
  const droneRef = useRef<THREE.Group>(null);
  const cameraController = useCameraController('chase');
  const { scene } = useThree();

  const isPlaying = useGameStore((state) => state.isPlaying);
  const isPaused = useGameStore((state) => state.isPaused);
  const currentScreen = useGameStore((state) => state.currentScreen);
  const tick = useGameStore((state) => state.tick);
  const droneState = useGameStore((state) => state.drone);
  const updateInput = useInputStore((state) => state.update);

  // Game manager with all systems
  const gameManager = useGameManager();
  const { tutorial, mission, update, initAudio } = gameManager;

  // Local state for 3D scene rendering
  const [tutorialTask, setTutorialTask] = useState(tutorial.getCurrentTask());
  const [missionState, setMissionState] = useState(mission.getCurrentMissionState());
  const [nextObjective, setNextObjective] = useState<MissionObjective | null>(null);

  // State for particles and effects
  const [dronePosition, setDronePosition] = useState(new THREE.Vector3(0, 0, 0));
  const [droneVelocity, setDroneVelocity] = useState(new THREE.Vector3(0, 0, 0));
  const [motorRPM, setMotorRPM] = useState<[number, number, number, number]>([0, 0, 0, 0]);
  const [timeOfDay] = useState<'dawn' | 'day' | 'dusk' | 'night'>('day');
  const [weather] = useState<'clear' | 'cloudy' | 'foggy'>('clear');
  const [terrainType] = useState<'grass' | 'desert' | 'snow' | 'urban'>('grass');

  // Enable shadows
  useEffect(() => {
    scene.fog = weather === 'foggy' ? new THREE.Fog(0xcccccc, 10, 150) : null;
  }, [scene, weather]);

  // Initialize input handlers when game scene mounts
  const initializeInput = useInputStore((state) => state.initialize);

  useEffect(() => {
    console.log('GameScene: Initializing input handlers...');
    initializeInput();
  }, [initializeInput]);

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

      // Update state for effects
      setDronePosition(new THREE.Vector3(
        physicsState.position.x,
        physicsState.position.y,
        physicsState.position.z
      ));
      setDroneVelocity(new THREE.Vector3(
        physicsState.velocity.x,
        physicsState.velocity.y,
        physicsState.velocity.z
      ));
      setMotorRPM(physicsState.motorRPM);
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
      {/* Post-processing effects */}
      <PostProcessingEffects enabled={true} quality="medium" />

      {/* Environment (sky, clouds, lighting) */}
      <Environment timeOfDay={timeOfDay} weather={weather} />

      {/* Terrain with procedural details */}
      <Terrain size={200} resolution={64} heightScale={2} type={terrainType} />

      {/* Grid overlay */}
      <Grid
        position={[0, 0.02, 0]}
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

      {/* Particle effects */}
      <ParticleEffects
        position={dronePosition}
        motorRPM={motorRPM}
        velocity={droneVelocity}
        altitude={dronePosition.y}
        armed={droneState.isArmed}
      />

      {/* Drone with enhanced model */}
      <group ref={droneRef}>
        <DroneModel motorRPM={motorRPM} armed={droneState.isArmed} />
      </group>

      {/* Legacy drone for fallback */}
      {/* <Drone ref={droneRef} /> */}

      {/* Training gates for free play */}
      {currentScreen === 'freePlay' && (
        <>
          <TrainingGate position={[10, 3, 0]} />
          <TrainingGate position={[20, 4, 5]} rotation={[0, Math.PI / 4, 0]} />
          <TrainingGate position={[30, 3, -5]} rotation={[0, -Math.PI / 4, 0]} />
          <TrainingGate position={[-15, 5, 10]} rotation={[0, Math.PI / 2, 0]} />
          <TrainingGate position={[-25, 3, -10]} rotation={[0, -Math.PI / 3, 0]} />
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

interface TrainingGateProps {
  position: [number, number, number];
  rotation?: [number, number, number];
}

function TrainingGate({ position, rotation = [0, 0, 0] }: TrainingGateProps): JSX.Element {
  return (
    <group position={position} rotation={rotation}>
      {/* Gate frame with glow */}
      <mesh position={[-2, 0, 0]} castShadow>
        <boxGeometry args={[0.2, 4, 0.2]} />
        <meshStandardMaterial
          color="#ff4444"
          emissive="#ff2222"
          emissiveIntensity={0.3}
        />
      </mesh>
      <mesh position={[2, 0, 0]} castShadow>
        <boxGeometry args={[0.2, 4, 0.2]} />
        <meshStandardMaterial
          color="#ff4444"
          emissive="#ff2222"
          emissiveIntensity={0.3}
        />
      </mesh>
      <mesh position={[0, 2, 0]} castShadow>
        <boxGeometry args={[4.2, 0.2, 0.2]} />
        <meshStandardMaterial
          color="#ff4444"
          emissive="#ff2222"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Gate indicator ring */}
      <mesh position={[0, 0, 0.1]} rotation={[0, 0, 0]}>
        <ringGeometry args={[1.5, 1.8, 32]} />
        <meshStandardMaterial
          color="#00ffff"
          emissive="#00ffff"
          emissiveIntensity={1}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Inner glow */}
      <mesh position={[0, 0, 0]}>
        <ringGeometry args={[0.5, 1.5, 32]} />
        <meshStandardMaterial
          color="#00ffff"
          emissive="#00ffff"
          emissiveIntensity={0.5}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Point lights for glow effect */}
      <pointLight position={[0, 0, 0.2]} color="#00ffff" intensity={1} distance={5} />
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
      <group position={[position.x, position.y, position.z]}>
        <mesh>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial
            color="#00ff88"
            emissive="#00ff88"
            emissiveIntensity={0.5}
          />
        </mesh>
        <pointLight color="#00ff88" intensity={0.5} distance={3} />
      </group>
    );
  }

  const color = isNext ? '#ffaa00' : '#4a9eff';

  switch (type) {
    case 'checkpoint':
      return (
        <group position={[position.x, position.y, position.z]}>
          <mesh>
            <torusGeometry args={[radius, 0.15, 16, 32]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={isNext ? 1.5 : 0.5}
              transparent
              opacity={0.9}
            />
          </mesh>
          {isNext && (
            <>
              <mesh>
                <sphereGeometry args={[0.3, 16, 16]} />
                <meshStandardMaterial
                  color="#ffffff"
                  emissive="#ffffff"
                  emissiveIntensity={2}
                />
              </mesh>
              <pointLight color={color} intensity={2} distance={10} />
            </>
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
              emissiveIntensity={isNext ? 1.5 : 0.5}
              transparent
              opacity={0.9}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <circleGeometry args={[radius - 0.3, 32]} />
            <meshStandardMaterial color="#333" transparent opacity={0.6} />
          </mesh>
          {isNext && (
            <pointLight position={[0, 1, 0]} color={color} intensity={1} distance={8} />
          )}
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
              emissiveIntensity={isNext ? 0.8 : 0.3}
              transparent
              opacity={0.4}
              wireframe
            />
          </mesh>
          {isNext && (
            <pointLight color={color} intensity={1} distance={radius * 3} />
          )}
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
              emissiveIntensity={isNext ? 1.5 : 0.8}
            />
          </mesh>
          <pointLight color={color} intensity={isNext ? 2 : 0.5} distance={5} />
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
          emissiveIntensity={1.5}
          transparent
          opacity={0.7}
        />
      </mesh>
      <mesh>
        <ringGeometry args={[1, 1.2, 32]} />
        <meshStandardMaterial
          color="#00ff88"
          emissive="#00ff88"
          emissiveIntensity={0.8}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      <pointLight color="#00ff88" intensity={2} distance={8} />
    </group>
  );
}

interface AltitudeRingProps {
  altitude: number;
}

function AltitudeRing({ altitude }: AltitudeRingProps): JSX.Element {
  return (
    <group position={[0, altitude, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[8, 10, 64]} />
        <meshStandardMaterial
          color="#00ff88"
          emissive="#00ff88"
          emissiveIntensity={0.5}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Altitude indicator lights */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => (
        <pointLight
          key={i}
          position={[Math.cos(angle) * 9, 0, Math.sin(angle) * 9]}
          color="#00ff88"
          intensity={0.5}
          distance={5}
        />
      ))}
    </group>
  );
}
