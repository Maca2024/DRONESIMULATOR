import { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sky, Grid, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { Drone } from './Drone';
import { useGameStore } from '../store/gameStore';
import { useInputStore } from '../store/inputStore';
import { PhysicsEngine } from '../core/PhysicsEngine';

export function GameScene(): JSX.Element {
  const { camera } = useThree();
  const cameraTarget = useRef(new THREE.Vector3());
  const droneRef = useRef<THREE.Group>(null);

  const isPlaying = useGameStore((state) => state.isPlaying);
  const isPaused = useGameStore((state) => state.isPaused);
  const updateDrone = useGameStore((state) => state.updateDrone);
  const tick = useGameStore((state) => state.tick);
  const updateInput = useInputStore((state) => state.update);
  const getInput = useInputStore((state) => state.getInput);

  // Physics engine instance
  const physics = useMemo(() => new PhysicsEngine(), []);

  // Game loop
  useFrame((_, delta) => {
    if (!isPlaying || isPaused) return;

    // Clamp delta to prevent physics explosions
    const dt = Math.min(delta, 0.05);

    // Update input
    updateInput(dt * 1000);

    // Get current input
    const input = getInput();

    // Update physics (run at higher frequency for stability)
    const physicsSteps = 4;
    const physicsStep = dt / physicsSteps;
    for (let i = 0; i < physicsSteps; i++) {
      physics.update(input, physicsStep);
    }

    // Get physics state
    const physicsState = physics.getState();
    const euler = physics.getEulerAngles();

    // Update drone state in store
    updateDrone({
      position: physicsState.position,
      velocity: physicsState.velocity,
      rotation: physicsState.rotation,
      angularVelocity: physicsState.angularVelocity,
      motorRPM: physicsState.motorRPM,
    });

    // Update drone mesh
    if (droneRef.current) {
      droneRef.current.position.set(
        physicsState.position.x,
        physicsState.position.y,
        physicsState.position.z
      );

      // Apply rotation from physics
      droneRef.current.rotation.x = euler.pitch * (Math.PI / 180);
      droneRef.current.rotation.z = euler.roll * (Math.PI / 180);
      droneRef.current.rotation.y = euler.yaw * (Math.PI / 180);
    }

    // Update camera to follow drone
    const camOffset = new THREE.Vector3(0, 3, 8);
    camOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), euler.yaw * (Math.PI / 180));
    cameraTarget.current.set(
      physicsState.position.x + camOffset.x,
      physicsState.position.y + camOffset.y,
      physicsState.position.z + camOffset.z
    );
    camera.position.lerp(cameraTarget.current, 0.05);
    camera.lookAt(physicsState.position.x, physicsState.position.y, physicsState.position.z);

    // Update game time
    tick(dt);
  });

  // Initialize camera position
  useEffect(() => {
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 1, 0);
  }, [camera]);

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

      {/* Training gates */}
      <TrainingGate position={[10, 3, 0]} />
      <TrainingGate position={[20, 4, 5]} rotation={[0, Math.PI / 4, 0]} />
      <TrainingGate position={[30, 3, -5]} rotation={[0, -Math.PI / 4, 0]} />
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
