/**
 * Shared types for Aetherwing Drone Simulator
 */

// ============================================================================
// INPUT TYPES
// ============================================================================

export type InputSource = 'keyboard' | 'mouse' | 'trackpad' | 'gamepad' | 'rc';

export interface NormalizedInput {
  throttle: number; // 0 to 1
  yaw: number; // -1 to 1
  pitch: number; // -1 to 1
  roll: number; // -1 to 1
  aux1: boolean; // Arm/Disarm
  aux2: number; // Flight mode (0, 1, 2)
  aux3: number; // Camera tilt (-1 to 1)
  timestamp: number;
  source: InputSource;
}

export interface InputConfig {
  sensitivity: number; // 0.3 to 3.0
  deadzone: number; // 0 to 0.25
  expo: number; // 0 to 1
  inverted: {
    pitch: boolean;
    roll: boolean;
    yaw: boolean;
    throttle: boolean;
  };
}

export interface KeyBindings {
  moveUp: readonly string[] | string[];
  moveDown: readonly string[] | string[];
  moveLeft: readonly string[] | string[];
  moveRight: readonly string[] | string[];
  thrustUp: readonly string[] | string[];
  thrustDown: readonly string[] | string[];
  yawLeft: readonly string[] | string[];
  yawRight: readonly string[] | string[];
  arm: readonly string[] | string[];
  disarm: readonly string[] | string[];
  modeAngle: readonly string[] | string[];
  modeHorizon: readonly string[] | string[];
  modeAcro: readonly string[] | string[];
  cameraUp: readonly string[] | string[];
  cameraDown: readonly string[] | string[];
  pause: readonly string[] | string[];
}

// ============================================================================
// DRONE TYPES
// ============================================================================

export type FlightMode = 'angle' | 'horizon' | 'acro';

export interface DroneConfig {
  mass: number; // kg (0.25 - 1.0)
  thrustMultiplier: number;
  dragCoefficient: number;
  rates: {
    roll: number; // deg/sec
    pitch: number; // deg/sec
    yaw: number; // deg/sec
  };
  expo: {
    roll: number;
    pitch: number;
    yaw: number;
  };
}

export interface DroneState {
  position: Vector3;
  rotation: Quaternion;
  velocity: Vector3;
  angularVelocity: Vector3;
  motorRPM: [number, number, number, number];
  batteryLevel: number;
  isArmed: boolean;
  flightMode: FlightMode;
}

// ============================================================================
// GAME TYPES
// ============================================================================

export type GameScreen = 'mainMenu' | 'settings' | 'tutorial' | 'freePlay' | 'mission' | 'pause' | 'neonRace' | 'freestyle';

// ============================================================================
// WEATHER TYPES
// ============================================================================

export type WeatherPreset = 'clear' | 'windy' | 'stormy' | 'foggy' | 'rain';

export interface WindState {
  direction: Vector3; // normalized direction
  baseSpeed: number; // m/s
  gustSpeed: number; // current gust addition m/s
  gustFrequency: number; // Hz
}

export interface WeatherState {
  preset: WeatherPreset;
  wind: WindState;
  fogDensity: number; // 0-1
  rainIntensity: number; // 0-1
  timeOfDay: number; // 0-24 continuous
}

// ============================================================================
// TRICK TYPES
// ============================================================================

export type TrickType =
  | 'FLIP_FORWARD'
  | 'FLIP_BACKWARD'
  | 'FLIP_LEFT'
  | 'FLIP_RIGHT'
  | 'ROLL_LEFT'
  | 'ROLL_RIGHT'
  | 'YAW_SPIN_360'
  | 'YAW_SPIN_720'
  | 'POWER_LOOP'
  | 'INVERTED_HANG';

export type TrickTier = 'basic' | 'advanced' | 'expert';

export interface TrickEvent {
  type: TrickType;
  tier: TrickTier;
  score: number;
  combo: number;
  multiplier: number;
  timestamp: number;
}

export interface TrickPopupData {
  name: string;
  score: number;
  combo: number;
  multiplier: number;
  tier: TrickTier;
  id: number;
}

// ============================================================================
// RACE TYPES
// ============================================================================

export interface GhostFrame {
  timestamp: number;
  position: Vector3;
  rotation: { roll: number; pitch: number; yaw: number };
}

export interface RaceCheckpoint {
  position: Vector3;
  radius: number;
  passed: boolean;
}

export interface RaceConfig {
  checkpoints: RaceCheckpoint[];
  laps: number;
  name: string;
}

export interface RaceState {
  isActive: boolean;
  currentCheckpoint: number;
  currentLap: number;
  lapTime: number;
  totalTime: number;
  splitTimes: number[];
  bestLapTime: number;
  ghostData: GhostFrame[];
  isRecording: boolean;
}

export type MissionType =
  | 'timeTrial'
  | 'precision'
  | 'ctf'
  | 'search'
  | 'survival'
  | 'delivery';

export interface Mission {
  id: string;
  type: MissionType;
  name: string;
  description: string;
  parTime: number; // seconds
  objectives: MissionObjective[];
  rewards: MissionReward;
}

export interface MissionObjective {
  id: string;
  type: 'checkpoint' | 'collect' | 'hover' | 'land' | 'photograph';
  position: Vector3;
  radius: number;
  completed: boolean;
  required: boolean;
}

export interface MissionReward {
  xp: number;
  unlocks: string[];
}

export interface MissionResult {
  missionId: string;
  completed: boolean;
  time: number;
  score: number;
  objectives: { id: string; completed: boolean }[];
  crashes: number;
}

// ============================================================================
// PROGRESSION TYPES
// ============================================================================

export type TutorialLevel = 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface PlayerProgress {
  level: number;
  xp: number;
  tutorialProgress: Record<TutorialLevel, boolean>;
  completedMissions: string[];
  achievements: string[];
  totalFlightTime: number;
  statistics: PlayerStatistics;
}

export interface PlayerStatistics {
  totalFlights: number;
  totalCrashes: number;
  totalDistance: number;
  bestLapTimes: Record<string, number>;
  tricksPerformed: number;
}

// ============================================================================
// SETTINGS TYPES
// ============================================================================

export interface GameSettings {
  graphics: GraphicsSettings;
  audio: AudioSettings;
  controls: ControlSettings;
  accessibility: AccessibilitySettings;
}

export interface GraphicsSettings {
  resolution: [number, number];
  quality: 'low' | 'medium' | 'high' | 'ultra';
  vsync: boolean;
  fpsLimit: number;
  shadows: boolean;
  postProcessing: boolean;
  motionBlur: boolean;
}

export interface AudioSettings {
  masterVolume: number;
  effectsVolume: number;
  musicVolume: number;
  spatialAudio: boolean;
}

export interface ControlSettings {
  inputMethod: InputSource;
  keyBindings: KeyBindings;
  inputConfig: InputConfig;
  controllerProfile: string | null;
}

export interface AccessibilitySettings {
  // Motor accessibility
  oneHandedMode: boolean;
  extendedDeadzone: boolean;
  inputSmoothing: number; // 0-100ms
  holdToConfirm: boolean;
  autoStabilization: number; // 0-100%

  // Visual accessibility
  colorblindMode: 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';
  highContrast: boolean;
  uiScale: number; // 1.0 - 3.0
  largeText: boolean;
  reduceMotion: boolean;
  disableScreenShake: boolean;
  brightnessLimit: number;

  // Audio accessibility
  visualAudioCues: boolean;
  subtitles: boolean;
  monoAudio: boolean;

  // Cognitive accessibility
  simplifiedHUD: boolean;
  extendedTimeLimits: boolean;
  visualGuides: boolean;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface Transform {
  position: Vector3;
  rotation: Quaternion;
  scale: Vector3;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export type GameEvent =
  | { type: 'CHECKPOINT_REACHED'; checkpointId: string; time: number }
  | { type: 'MISSION_COMPLETE'; result: MissionResult }
  | { type: 'CRASH'; position: Vector3; velocity: number }
  | { type: 'ARM_STATE_CHANGED'; armed: boolean }
  | { type: 'FLIGHT_MODE_CHANGED'; mode: FlightMode }
  | { type: 'TRICK_PERFORMED'; trick: TrickType; score: number; combo: number }
  | { type: 'RACE_CHECKPOINT'; checkpoint: number; time: number }
  | { type: 'RACE_LAP_COMPLETE'; lap: number; lapTime: number }
  | { type: 'RACE_COMPLETE'; totalTime: number; bestLap: number };
