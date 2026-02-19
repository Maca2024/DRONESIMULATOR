/**
 * useGameManager - Coordinates game systems
 *
 * Integrates:
 * - PhysicsEngine
 * - TutorialSystem
 * - MissionSystem
 * - ProAudioSystem (Advanced Audio)
 * - WeatherSystem (Wind & Weather)
 * - TrickDetector (Freestyle tricks)
 * - RaceSystem (Neon Race mode)
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import { PhysicsEngine } from '../core/PhysicsEngine';
import { TutorialSystem } from '../systems/TutorialSystem';
import { MissionSystem } from '../systems/MissionSystem';
import { ProAudioSystem } from '../systems/ProAudioSystem';
import { WeatherSystem } from '../systems/WeatherSystem';
import { TrickDetector } from '../systems/TrickDetector';
import { RaceSystem } from '../systems/RaceSystem';
import { useGameStore } from '../store/gameStore';
import { useInputStore } from '../store/inputStore';
import { useProgressStore } from '../store/progressStore';
import { TRICK_SCORES } from '@shared/constants';
import type { TutorialLevel, Vector3, WeatherPreset, WeatherState } from '@shared/types';

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
  toggleMusic: () => void;
  setMasterVolume: (volume: number) => void;
  isMusicPlaying: boolean;
  setWeatherPreset: (preset: WeatherPreset) => void;
  setTimeOfDay: (time: number) => void;
  getWeatherState: () => WeatherState;
  startNeonRace: () => void;
  stopRace: () => void;
}

export function useGameManager(): GameManagerState & GameManagerActions {
  const physics = useRef(new PhysicsEngine());
  const tutorial = useRef(new TutorialSystem());
  const mission = useRef(new MissionSystem());
  const audioSystem = useRef(new ProAudioSystem());
  const weatherSystem = useRef(new WeatherSystem());
  const trickDetector = useRef(new TrickDetector());
  const raceSystem = useRef(new RaceSystem());
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  const updateDrone = useGameStore((state) => state.updateDrone);
  const addScore = useGameStore((state) => state.addScore);
  const crash = useGameStore((state) => state.crash);
  const isArmed = useGameStore((state) => state.drone.isArmed);
  const currentScreen = useGameStore((state) => state.currentScreen);
  const setRaceState = useGameStore((state) => state.setRaceState);
  const showTrickPopup = useGameStore((state) => state.showTrickPopup);
  const getInput = useInputStore((state) => state.getInput);
  const recordTrick = useProgressStore((state) => state.recordTrick);

  // Wire trick detector callback
  useEffect(() => {
    let trickIdCounter = 0;
    trickDetector.current.setOnTrick((event) => {
      const trickInfo = TRICK_SCORES[event.type];
      addScore(event.score);
      showTrickPopup({
        name: trickInfo.name,
        score: event.score,
        combo: event.combo,
        multiplier: event.multiplier,
        tier: event.tier,
        id: trickIdCounter++,
      });
      recordTrick(event.combo);
      audioSystem.current.playEffect('checkpoint'); // reuse checkpoint sound for trick
    });
  }, [addScore, showTrickPopup, recordTrick]);

  // Initialize audio on first interaction
  const initAudio = useCallback(() => {
    audioSystem.current.initialize();
    void audioSystem.current.resume();
  }, []);

  // Toggle background music
  const toggleMusic = useCallback(() => {
    if (isMusicPlaying) {
      audioSystem.current.stopMusic();
      setIsMusicPlaying(false);
    } else {
      audioSystem.current.playMusic();
      setIsMusicPlaying(true);
    }
  }, [isMusicPlaying]);

  // Set master volume
  const setMasterVolume = useCallback((volume: number) => {
    audioSystem.current.setConfig({ masterVolume: volume });
  }, []);

  // Weather controls
  const setWeatherPreset = useCallback((preset: WeatherPreset) => {
    weatherSystem.current.setPreset(preset);
  }, []);

  const setTimeOfDay = useCallback((time: number) => {
    weatherSystem.current.setTimeOfDay(time);
  }, []);

  const getWeatherState = useCallback(() => {
    return weatherSystem.current.getState();
  }, []);

  // Race controls
  const startNeonRace = useCallback(() => {
    const course = RaceSystem.getDefaultCourse();
    raceSystem.current.startRace(course);
    setRaceState(raceSystem.current.getState());
  }, [setRaceState]);

  const stopRace = useCallback(() => {
    raceSystem.current.stopRace();
    setRaceState(null);
  }, [setRaceState]);

  // Listen for M key to toggle music
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.code === 'KeyM' && !e.repeat) {
        toggleMusic();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleMusic]);

  // Auto-start race when entering neonRace mode
  useEffect(() => {
    if (currentScreen === 'neonRace') {
      startNeonRace();
      trickDetector.current.reset();
    } else if (currentScreen === 'freestyle') {
      trickDetector.current.reset();
    }
  }, [currentScreen, startNeonRace]);

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

      // Update weather system
      weatherSystem.current.update(dt);
      const windForce = weatherSystem.current.getWindForce();

      // Run physics at higher frequency for stability
      const physicsSteps = 4;
      const physicsStep = dt / physicsSteps;
      for (let i = 0; i < physicsSteps; i++) {
        physics.current.update(input, physicsStep, undefined, windForce);
      }

      // Get physics state
      const physicsState = physics.current.getState();
      const euler = physics.current.getEulerAngles();

      // Update drone state in store
      updateDrone({
        position: physicsState.position,
        velocity: physicsState.velocity,
        rotation: physicsState.rotation,
        angularVelocity: physicsState.angularVelocity,
        motorRPM: physicsState.motorRPM,
      });

      // Feed trick detector in freestyle and neonRace modes
      if (currentScreen === 'freestyle' || currentScreen === 'neonRace' || currentScreen === 'freePlay') {
        trickDetector.current.addFrame({
          timestamp: performance.now(),
          position: physicsState.position,
          velocity: physicsState.velocity,
          euler,
          altitude: physicsState.position.y,
        });
      }

      // Update race system in neonRace mode
      if (currentScreen === 'neonRace') {
        const raceResult = raceSystem.current.update(dt, physicsState.position, euler);
        setRaceState(raceSystem.current.getState());

        if (raceResult.checkpointPassed) {
          audioSystem.current.playEffect('checkpoint');
          addScore(200);
        }
        if (raceResult.lapComplete) {
          audioSystem.current.playEffect('success');
          addScore(1000);
        }
        if (raceResult.raceComplete) {
          audioSystem.current.playEffect('success');
        }
      }

      // Update professional audio system
      audioSystem.current.update({
        motorRPM: physicsState.motorRPM,
        velocity: physicsState.velocity,
        position: physicsState.position,
        altitude: physicsState.position.y,
        armed: true,
        throttle: input.throttle,
      });

      // Reactive audio: adjust intensity based on flight dynamics
      const speed = Math.sqrt(
        physicsState.velocity.x ** 2 +
        physicsState.velocity.y ** 2 +
        physicsState.velocity.z ** 2
      );
      const speedFactor = Math.min(speed / 30, 1);
      const altFactor = Math.min(physicsState.position.y / 50, 1);
      const intensity = speedFactor * 0.6 + altFactor * 0.2 + input.throttle * 0.2;
      audioSystem.current.setGameIntensity(intensity);

      // Update wind audio
      audioSystem.current.setWindOverride(weatherSystem.current.getWindSpeed());

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
          audioSystem.current.playEffect('checkpoint');
          addScore(100);
        }
      }

      // Check for crash
      if (physics.current.isCrashed()) {
        audioSystem.current.playEffect('crash');
        crash(physicsState.position);
        mission.current.recordCrash();
      }

      return {
        physicsState,
        euler,
      };
    },
    [getInput, updateDrone, addScore, crash, isArmed, currentScreen, setRaceState]
  );

  // Reset physics
  const reset = useCallback((position?: { x: number; y: number; z: number }) => {
    physics.current.reset(position);
    trickDetector.current.reset();
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
      audioSystem.current.playEffect('arm');
    }
    return success;
  }, []);

  // Stop current mission
  const stopMission = useCallback(() => {
    mission.current.abortMission();
    audioSystem.current.playEffect('disarm');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioSystem.current.dispose();
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
    toggleMusic,
    setMasterVolume,
    isMusicPlaying,
    setWeatherPreset,
    setTimeOfDay,
    getWeatherState,
    startNeonRace,
    stopRace,
  };
}
