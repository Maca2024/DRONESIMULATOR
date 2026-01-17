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

  const updateDrone = useGameStore((state) => state.updateDrone);
  const addScore = useGameStore((state) => state.addScore);
  const crash = useGameStore((state) => state.crash);
  const isArmed = useGameStore((state) => state.drone.isArmed);
  const getInput = useInputStore((state) => state.getInput);

  // Initialize audio on first interaction
  const initAudio = useCallback(() => {
    audioSystem.initialize();
    // Resume the audio context - required by Web Audio API after user interaction
    void audioSystem.resume();
  }, []);

  // Main update loop
  const update = useCallback(
    (dt: number) => {
      const rawInput = getInput();

      // When disarmed, zero out all control inputs (drone should not respond)
      const input = isArmed ? rawInput : {
        ...rawInput,
        throttle: 0,
        yaw: 0,
        pitch: 0,
        roll: 0,
      };

      // Run physics at higher frequency for stability
      const physicsSteps = 4;
      const physicsStep = dt / physicsSteps;
      for (let i = 0; i < physicsSteps; i++) {
        physics.current.update(input, physicsStep);
      }

      // Get physics state
      const physicsState = physics.current.getState();

      // Update drone state in store
      updateDrone({
        position: physicsState.position,
        velocity: physicsState.velocity,
        rotation: physicsState.rotation,
        angularVelocity: physicsState.angularVelocity,
        motorRPM: physicsState.motorRPM,
      });

      // Update audio motor sounds
      audioSystem.updateMotorSounds(physicsState.motorRPM);

      // Update tutorial if active
      const tutorialProgress = tutorial.current.getProgress();
      if (tutorialProgress.currentTaskIndex >= 0) {
        tutorial.current.update(
          { ...physicsState, batteryLevel: 100, isArmed: true, flightMode: 'angle' },
          input,
          dt
        );
      }

      // Update mission if active
      const missionState = mission.current.getCurrentMissionState();
      if (missionState && !missionState.isComplete) {
        const prevCompleted = missionState.objectivesCompleted;
        mission.current.update(
          { ...physicsState, batteryLevel: 100, isArmed: true, flightMode: 'angle' },
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
    [getInput, updateDrone, addScore, crash, isArmed]
  );

  // Reset physics
  const reset = useCallback((position?: { x: number; y: number; z: number }) => {
    physics.current.reset(position);
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
