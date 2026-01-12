/**
 * useGameManager - Coordinates game systems
 *
 * Integrates:
 * - PhysicsEngine
 * - TutorialSystem
 * - MissionSystem
 * - AudioSystem
 */

import { useRef, useEffect, useCallback } from 'react';
import { PhysicsEngine } from '../core/PhysicsEngine';
import { TutorialSystem } from '../systems/TutorialSystem';
import { MissionSystem } from '../systems/MissionSystem';
import { audioSystem } from '../systems/AudioSystem';
import { useGameStore } from '../store/gameStore';
import { useInputStore } from '../store/inputStore';
import type { TutorialLevel, Vector3 } from '@shared/types';

// Battery configuration
const BATTERY_CONFIG = {
  capacity: 100, // percentage
  baseDrainRate: 0.02, // % per second at idle
  throttleDrainMultiplier: 0.15, // additional % per second at full throttle
  lowBatteryThreshold: 20, // % - warning threshold
  criticalBatteryThreshold: 5, // % - critical warning
};

export interface UpdateResult {
  physicsState: {
    position: Vector3;
    velocity: Vector3;
    rotation: { x: number; y: number; z: number; w: number };
    angularVelocity: Vector3;
    motorRPM: [number, number, number, number];
  };
  euler: { roll: number; pitch: number; yaw: number };
}

export interface GameManagerState {
  physics: PhysicsEngine;
  tutorial: TutorialSystem;
  mission: MissionSystem;
}

export interface GameManagerActions {
  update: (dt: number) => UpdateResult;
  reset: (position?: { x: number; y: number; z: number }) => void;
  startTutorial: (level: TutorialLevel) => void;
  startMission: (missionId: string) => void;
  stopMission: () => void;
  initAudio: () => void;
}

export function useGameManager(): GameManagerState & GameManagerActions {
  const physics = useRef(new PhysicsEngine());
  const tutorial = useRef(new TutorialSystem());
  const mission = useRef(new MissionSystem());

  // Battery state
  const batteryLevel = useRef(BATTERY_CONFIG.capacity);
  const lastLowBatteryWarning = useRef(0);

  const updateDrone = useGameStore((state) => state.updateDrone);
  const addScore = useGameStore((state) => state.addScore);
  const crash = useGameStore((state) => state.crash);
  const getInput = useInputStore((state) => state.getInput);
  const droneIsArmed = useGameStore((state) => state.drone.isArmed);

  // Initialize audio on first interaction
  const initAudio = useCallback(() => {
    audioSystem.initialize();
  }, []);

  // Main update loop
  const update = useCallback(
    (dt: number) => {
      const input = getInput();

      // Calculate battery drain based on throttle (only when armed)
      if (droneIsArmed && batteryLevel.current > 0) {
        const throttleFactor = input.throttle;
        const drainRate =
          BATTERY_CONFIG.baseDrainRate +
          throttleFactor * BATTERY_CONFIG.throttleDrainMultiplier;
        batteryLevel.current = Math.max(0, batteryLevel.current - drainRate * dt);

        // Low battery warning (play every 5 seconds when below threshold)
        const now = Date.now();
        if (
          batteryLevel.current <= BATTERY_CONFIG.lowBatteryThreshold &&
          now - lastLowBatteryWarning.current > 5000
        ) {
          audioSystem.playEffect('lowBattery');
          lastLowBatteryWarning.current = now;
        }
      }

      // Apply power reduction when battery is critically low
      const powerMultiplier =
        batteryLevel.current <= BATTERY_CONFIG.criticalBatteryThreshold
          ? batteryLevel.current / BATTERY_CONFIG.criticalBatteryThreshold
          : 1;

      // Modify input based on power level
      const adjustedInput = {
        ...input,
        throttle: input.throttle * powerMultiplier,
      };

      // Run physics at higher frequency for stability
      const physicsSteps = 4;
      const physicsStep = dt / physicsSteps;
      for (let i = 0; i < physicsSteps; i++) {
        physics.current.update(adjustedInput, physicsStep);
      }

      // Get physics state
      const physicsState = physics.current.getState();

      // Update drone state in store (including battery level)
      updateDrone({
        position: physicsState.position,
        velocity: physicsState.velocity,
        rotation: physicsState.rotation,
        angularVelocity: physicsState.angularVelocity,
        motorRPM: physicsState.motorRPM,
        batteryLevel: batteryLevel.current,
      });

      // Update audio motor sounds
      audioSystem.updateMotorSounds(physicsState.motorRPM);

      // Update tutorial if active
      const tutorialProgress = tutorial.current.getProgress();
      if (tutorialProgress.currentTaskIndex >= 0) {
        tutorial.current.update(
          { ...physicsState, batteryLevel: batteryLevel.current, isArmed: droneIsArmed, flightMode: 'angle' },
          input,
          dt
        );
      }

      // Update mission if active
      const missionState = mission.current.getCurrentMissionState();
      if (missionState && !missionState.isComplete) {
        const prevCompleted = missionState.objectivesCompleted;
        mission.current.update(
          { ...physicsState, batteryLevel: batteryLevel.current, isArmed: droneIsArmed, flightMode: 'angle' },
          dt
        );

        // Check for new completions
        const newState = mission.current.getCurrentMissionState();
        if (newState && newState.objectivesCompleted > prevCompleted) {
          audioSystem.playEffect('checkpoint');
          addScore(100);
        }
      }

      // Check for crash
      if (physics.current.isCrashed()) {
        audioSystem.playEffect('crash');
        crash(physicsState.position);
        mission.current.recordCrash();
      }

      return {
        physicsState,
        euler: physics.current.getEulerAngles(),
      };
    },
    [getInput, updateDrone, addScore, crash, droneIsArmed]
  );

  // Reset physics and battery
  const reset = useCallback((position?: { x: number; y: number; z: number }) => {
    physics.current.reset(position);
    batteryLevel.current = BATTERY_CONFIG.capacity;
    lastLowBatteryWarning.current = 0;
  }, []);

  // Start tutorial level
  const startTutorial = useCallback((level: TutorialLevel) => {
    tutorial.current.setLevel(level);
    physics.current.reset({ x: 0, y: 1, z: 0 });
  }, []);

  // Start mission
  const startMission = useCallback((missionId: string) => {
    const success = mission.current.startMission(missionId);
    if (success) {
      physics.current.reset({ x: 0, y: 1, z: 0 });
      audioSystem.playEffect('arm');
    }
    return success;
  }, []);

  // Stop current mission
  const stopMission = useCallback(() => {
    mission.current.abortMission();
    audioSystem.playEffect('disarm');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioSystem.dispose();
    };
  }, []);

  return {
    physics: physics.current,
    tutorial: tutorial.current,
    mission: mission.current,
    update,
    reset,
    startTutorial,
    startMission,
    stopMission,
    initAudio,
  };
}
