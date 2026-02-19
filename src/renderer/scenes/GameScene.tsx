import { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Grid } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { useInputStore } from '../store/inputStore';
import { useGameManager } from '../hooks/useGameManager';
import { useCameraController } from '../hooks/useCameraController';
import { PostProcessingEffects } from '../components/PostProcessingEffects';
import { Environment } from '../components/Environment';
import { DroneModel } from '../components/DroneModel';
import { ParticleEffects } from '../components/ParticleEffects';
import { Terrain } from '../components/Terrain';
import { Water } from '../components/Water';
import { RainEffect } from '../components/RainEffect';
import { WindParticles } from '../components/WindParticles';
import { SpeedLines } from '../components/SpeedLines';
import { NeonGate } from '../components/NeonGate';
import { NeonGrid } from '../components/NeonGrid';
import { DroneTrail } from '../components/DroneTrail';
import { GhostDrone } from '../components/GhostDrone';
import { Minimap } from '../ui/Minimap';
import { RaceSystem } from '../systems/RaceSystem';
import { RACE } from '@shared/constants';
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
  const raceState = useGameStore((state) => state.raceState);
  const updateInput = useInputStore((state) => state.update);

  // Game manager with all systems
  const gameManager = useGameManager();
  const { tutorial, mission, update, initAudio, getWeatherState } = gameManager;

  // Local state for 3D scene rendering
  const [tutorialTask, setTutorialTask] = useState(tutorial.getCurrentTask());
  const [missionState, setMissionState] = useState(mission.getCurrentMissionState());
  const [nextObjective, setNextObjective] = useState<MissionObjective | null>(null);

  // State for particles and effects
  const [dronePosition, setDronePosition] = useState(new THREE.Vector3(0, 0, 0));
  const [droneVelocity, setDroneVelocity] = useState(new THREE.Vector3(0, 0, 0));
  const [motorRPM, setMotorRPM] = useState<[number, number, number, number]>([0, 0, 0, 0]);
  const [droneSpeed, setDroneSpeed] = useState(0);
  const [terrainType] = useState<'grass' | 'desert' | 'snow' | 'urban'>('grass');

  // Weather state (updated each frame)
  const [weatherState, setWeatherState] = useState(getWeatherState());

  // Neon race gate data
  const defaultCourse = useMemo(() => RaceSystem.getDefaultCourse(), []);
  const neonGateColors = RACE.NEON_GATE_COLORS;

  // Update fog based on weather
  useEffect(() => {
    if (weatherState.fogDensity > 0.01) {
      scene.fog = new THREE.Fog(0xaaaacc, 10, 150 / weatherState.fogDensity);
    } else {
      scene.fog = null;
    }
  }, [scene, weatherState.fogDensity]);

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
      const pos = new THREE.Vector3(
        physicsState.position.x,
        physicsState.position.y,
        physicsState.position.z
      );
      const vel = new THREE.Vector3(
        physicsState.velocity.x,
        physicsState.velocity.y,
        physicsState.velocity.z
      );
      setDronePosition(pos);
      setDroneVelocity(vel);
      setMotorRPM(physicsState.motorRPM);
      setDroneSpeed(vel.length());
    }

    // Update weather state for rendering
    setWeatherState(getWeatherState());

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

  // Is neon race mode
  const isNeonRace = currentScreen === 'neonRace';
  const isFreestyle = currentScreen === 'freestyle';
  const showTrail = isNeonRace || isFreestyle;

  return (
    <>
      {/* Post-processing effects with dynamic speed */}
      <PostProcessingEffects enabled={true} quality="medium" droneSpeed={droneSpeed / 40} />

      {/* Environment (sky, clouds, lighting) with continuous time */}
      <Environment
        timeOfDay="day"
        weather={weatherState.fogDensity > 0.3 ? 'foggy' : 'clear'}
        continuousTime={weatherState.timeOfDay}
      />

      {/* Terrain with procedural details */}
      <Terrain size={200} resolution={64} heightScale={2} type={terrainType} />

      {/* Water surface */}
      <Water size={200} waterLevel={-0.5} />

      {/* Grid overlay (hide in neon race - use NeonGrid instead) */}
      {!isNeonRace && (
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
      )}

      {/* Neon grid for race mode */}
      {isNeonRace && (
        <NeonGrid
          size={200}
          dronePosition={{ x: dronePosition.x, z: dronePosition.z }}
        />
      )}

      {/* Weather effects */}
      {weatherState.rainIntensity > 0 && (
        <RainEffect
          intensity={weatherState.rainIntensity}
          windDirection={weatherState.wind.direction}
          dronePosition={dronePosition}
        />
      )}
      <WindParticles
        windDirection={weatherState.wind.direction}
        windSpeed={weatherState.wind.baseSpeed + weatherState.wind.gustSpeed}
        dronePosition={dronePosition}
      />

      {/* Speed lines at high speed */}
      <SpeedLines speed={droneSpeed} threshold={15} />

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

      {/* Drone trail for freestyle/race */}
      {showTrail && <DroneTrail droneRef={droneRef} color={isNeonRace ? '#00ffff' : '#ff66ff'} />}

      {/* Neon race gates */}
      {isNeonRace && defaultCourse.checkpoints.map((cp, i) => (
        <NeonGate
          key={i}
          position={[cp.position.x, cp.position.y, cp.position.z]}
          color={neonGateColors[i % neonGateColors.length]}
          index={i}
          passed={raceState ? i < raceState.currentCheckpoint : false}
        />
      ))}

      {/* Ghost drone in race mode */}
      {isNeonRace && raceState && raceState.ghostData.length > 0 && (
        <GhostDrone
          getFrame={(time) => {
            if (raceState.ghostData.length === 0 || raceState.bestLapTime === Infinity) return null;
            const loopedTime = time % raceState.bestLapTime;
            const ghostData = raceState.ghostData;
            let low = 0;
            let high = ghostData.length - 1;
            while (low < high - 1) {
              const mid = Math.floor((low + high) / 2);
              if (ghostData[mid].timestamp <= loopedTime) low = mid;
              else high = mid;
            }
            const a = ghostData[low];
            const b = ghostData[Math.min(high, ghostData.length - 1)];
            const range = b.timestamp - a.timestamp;
            const t = range > 0 ? (loopedTime - a.timestamp) / range : 0;
            return {
              timestamp: loopedTime,
              position: {
                x: a.position.x + (b.position.x - a.position.x) * t,
                y: a.position.y + (b.position.y - a.position.y) * t,
                z: a.position.z + (b.position.z - a.position.z) * t,
              },
              rotation: {
                roll: a.rotation.roll + (b.rotation.roll - a.rotation.roll) * t,
                pitch: a.rotation.pitch + (b.rotation.pitch - a.rotation.pitch) * t,
                yaw: a.rotation.yaw + (b.rotation.yaw - a.rotation.yaw) * t,
              },
            };
          }}
        />
      )}

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

      {/* Minimap (HTML overlay rendered outside Canvas via portal) */}
    </>
  );
}

// Minimap is an HTML component - export for use in App.tsx
export { Minimap };

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
