import { create } from 'zustand';
import type {
  GameScreen,
  DroneState,
  Mission,
  FlightMode,
  Vector3,
} from '@shared/types';

interface GameState {
  // Screen state
  currentScreen: GameScreen;
  previousScreen: GameScreen | null;

  // Game state
  isPlaying: boolean;
  isPaused: boolean;
  gameTime: number;

  // Drone state
  drone: DroneState;

  // Mission state
  currentMission: Mission | null;
  missionTime: number;
  score: number;
  comboMultiplier: number;

  // Actions
  setScreen: (screen: GameScreen) => void;
  goBack: () => void;
  startGame: (mode: 'freePlay' | 'mission', mission?: Mission) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: () => void;
  updateDrone: (state: Partial<DroneState>) => void;
  setFlightMode: (mode: FlightMode) => void;
  toggleArm: () => void;
  addScore: (points: number) => void;
  incrementCombo: () => void;
  resetCombo: () => void;
  crash: (position: Vector3) => void;
  tick: (deltaTime: number) => void;
}

const initialDroneState: DroneState = {
  position: { x: 0, y: 1, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  velocity: { x: 0, y: 0, z: 0 },
  angularVelocity: { x: 0, y: 0, z: 0 },
  motorRPM: [0, 0, 0, 0],
  batteryLevel: 100,
  isArmed: false,
  flightMode: 'angle',
};

export const useGameStore = create<GameState>((set) => ({
  // Initial state
  currentScreen: 'mainMenu',
  previousScreen: null,
  isPlaying: false,
  isPaused: false,
  gameTime: 0,
  drone: { ...initialDroneState },
  currentMission: null,
  missionTime: 0,
  score: 0,
  comboMultiplier: 1,

  // Screen navigation
  setScreen: (screen) =>
    set((state) => ({
      previousScreen: state.currentScreen,
      currentScreen: screen,
    })),

  goBack: () =>
    set((state) => ({
      currentScreen: state.previousScreen || 'mainMenu',
      previousScreen: null,
    })),

  // Game flow
  startGame: (mode, mission) =>
    set({
      currentScreen: mode === 'freePlay' ? 'freePlay' : 'mission',
      isPlaying: true,
      isPaused: false,
      gameTime: 0,
      missionTime: 0,
      score: 0,
      comboMultiplier: 1,
      currentMission: mission || null,
      drone: { ...initialDroneState, isArmed: true }, // Auto-arm drone on start
    }),

  pauseGame: () =>
    set({
      isPaused: true,
      currentScreen: 'pause',
    }),

  resumeGame: () =>
    set((state) => ({
      isPaused: false,
      currentScreen: state.currentMission ? 'mission' : 'freePlay',
    })),

  endGame: () =>
    set({
      isPlaying: false,
      isPaused: false,
      currentScreen: 'mainMenu',
      currentMission: null,
      drone: { ...initialDroneState },
    }),

  // Drone controls
  updateDrone: (droneState) =>
    set((state) => ({
      drone: { ...state.drone, ...droneState },
    })),

  setFlightMode: (mode) =>
    set((state) => ({
      drone: { ...state.drone, flightMode: mode },
    })),

  toggleArm: () =>
    set((state) => ({
      drone: { ...state.drone, isArmed: !state.drone.isArmed },
    })),

  // Scoring
  addScore: (points) =>
    set((state) => ({
      score: state.score + Math.floor(points * state.comboMultiplier),
    })),

  incrementCombo: () =>
    set((state) => ({
      comboMultiplier: Math.min(state.comboMultiplier + 0.5, 2.0),
    })),

  resetCombo: () =>
    set({
      comboMultiplier: 1,
    }),

  crash: (_position) =>
    set((state) => ({
      score: Math.max(0, state.score - 500),
      comboMultiplier: 1,
    })),

  // Time update
  tick: (deltaTime) =>
    set((state) => ({
      gameTime: state.gameTime + deltaTime,
      missionTime: state.isPlaying && !state.isPaused ? state.missionTime + deltaTime : state.missionTime,
    })),
}));

// Selectors
export const selectDronePosition = (state: GameState): Vector3 => state.drone.position;
export const selectIsArmed = (state: GameState): boolean => state.drone.isArmed;
export const selectFlightMode = (state: GameState): FlightMode => state.drone.flightMode;
