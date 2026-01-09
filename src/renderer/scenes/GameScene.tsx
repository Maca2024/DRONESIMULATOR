import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sky, Grid, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { Drone } from './Drone';
import { useGameStore } from '../store/gameStore';
import { useInputStore } from '../store/inputStore';
import { PHYSICS } from '@shared/constants';

export function GameScene(): JSX.Element {
  const { camera } = useThree();
  const cameraTarget = useRef(new THREE.Vector3());
  const droneRef = useRef<THREE.Group>(null);

  const isPlaying = useGameStore((state) => state.isPlaying);
  const isPaused = useGameStore((state) => state.isPaused);
  const updateDrone = useGameStore((state) => state.updateDrone);
  const drone = useGameStore((state) => state.drone);
  const tick = useGameStore((state) => state.tick);
  const updateInput = useInputStore((state) => state.update);
  const getInput = useInputStore((state) => state.getInput);

  // Game loop
  useFrame((_, delta) => {
    if (!isPlaying || isPaused) return;

    // Update input
    updateInput(delta * 1000);

    // Get current input
    const input = getInput();

    // Simple physics simulation
    const thrustForce = input.throttle * 20;
    const gravity = PHYSICS.GRAVITY;

    // Calculate new velocity
    const newVelocity = {
      x: drone.velocity.x + input.roll * 10 * delta,
      y: drone.velocity.y + (thrustForce - gravity) * delta,
      z: drone.velocity.z - input.pitch * 10 * delta,
    };

    // Apply drag
    const drag = 0.98;
    newVelocity.x *= drag;
    newVelocity.y *= drag;
    newVelocity.z *= drag;

    // Calculate new position
    const newPosition = {
      x: drone.position.x + newVelocity.x * delta,
      y: Math.max(0.5, drone.position.y + newVelocity.y * delta),
      z: drone.position.z + newVelocity.z * delta,
    };

    // Calculate rotation from velocity
    const targetRoll = -input.roll * 0.5;
    const targetPitch = input.pitch * 0.5;

    // Update drone state
    updateDrone({
      position: newPosition,
      velocity: newVelocity,
      motorRPM: [
        input.throttle * 10000,
        input.throttle * 10000,
        input.throttle * 10000,
        input.throttle * 10000,
      ],
    });

    // Update drone mesh
    if (droneRef.current) {
      droneRef.current.position.set(newPosition.x, newPosition.y, newPosition.z);
      droneRef.current.rotation.x = THREE.MathUtils.lerp(
        droneRef.current.rotation.x,
        targetPitch,
        0.1
      );
      droneRef.current.rotation.z = THREE.MathUtils.lerp(
        droneRef.current.rotation.z,
        targetRoll,
        0.1
      );
      droneRef.current.rotation.y += input.yaw * delta * 2;
    }

    // Update camera to follow drone
    cameraTarget.current.set(newPosition.x, newPosition.y + 2, newPosition.z + 8);
    camera.position.lerp(cameraTarget.current, 0.05);
    camera.lookAt(newPosition.x, newPosition.y, newPosition.z);

    // Update game time
    tick(delta);
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
