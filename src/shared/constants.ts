/**
 * Game constants for Aetherwing Drone Simulator
 */

// ============================================================================
// PHYSICS CONSTANTS
// ============================================================================

export const PHYSICS = {
  TIMESTEP: 1 / 500, // 500Hz physics
  GRAVITY: 9.81, // m/s²
  AIR_DENSITY: 1.225, // kg/m³
  GROUND_LEVEL: 0,
  MAX_ALTITUDE: 500, // meters
} as const;

// ============================================================================
// DRONE PRESETS
// ============================================================================

export const DRONE_PRESETS = {
  BEGINNER: {
    mass: 0.5,
    thrustMultiplier: 1.2,
    dragCoefficient: 0.3,
    rates: { roll: 200, pitch: 200, yaw: 150 },
    expo: { roll: 0.5, pitch: 0.5, yaw: 0.3 },
  },
  INTERMEDIATE: {
    mass: 0.4,
    thrustMultiplier: 1.5,
    dragCoefficient: 0.25,
    rates: { roll: 400, pitch: 400, yaw: 250 },
    expo: { roll: 0.3, pitch: 0.3, yaw: 0.2 },
  },
  RACING: {
    mass: 0.35,
    thrustMultiplier: 2.0,
    dragCoefficient: 0.2,
    rates: { roll: 600, pitch: 600, yaw: 400 },
    expo: { roll: 0.2, pitch: 0.2, yaw: 0.1 },
  },
  FREESTYLE: {
    mass: 0.45,
    thrustMultiplier: 1.8,
    dragCoefficient: 0.22,
    rates: { roll: 500, pitch: 500, yaw: 350 },
    expo: { roll: 0.25, pitch: 0.25, yaw: 0.15 },
  },
} as const;

// ============================================================================
// INPUT CONSTANTS
// ============================================================================

export const INPUT = {
  // Keyboard timing
  TAP_DURATION: 100, // ms
  TAP_INPUT_PERCENT: 0.15, // 15%
  HOLD_RAMP_SPEED: 150, // ms to reach 100%
  AUTO_CENTER_SPEED: 50, // ms to return to 0

  // Mouse
  SCROLL_THROTTLE_STEP: 0.1, // 10% per tick
  FINE_THROTTLE_PIXELS: 5, // pixels per 1%

  // Trackpad
  GESTURE_QUEUE_MAX: 3,
  ASSISTED_HOVER_DELAY: 200, // ms

  // Controller
  CONTROLLER_DEADZONE_DEFAULT: 0.02,
  GAMEPAD_DEADZONE_DEFAULT: 0.05,
  EXPO_DEFAULT: 0.3,

  // Latency targets
  CONTROLLER_LATENCY_TARGET: 16, // ms
  KEYBOARD_LATENCY_TARGET: 8, // ms
} as const;

// ============================================================================
// DEFAULT KEY BINDINGS
// ============================================================================

export const DEFAULT_KEY_BINDINGS = {
  moveUp: ['KeyW', 'ArrowUp'],
  moveDown: ['KeyS', 'ArrowDown'],
  moveLeft: ['KeyA', 'ArrowLeft'],
  moveRight: ['KeyD', 'ArrowRight'],
  thrustUp: ['Space'],
  thrustDown: ['ShiftLeft', 'ShiftRight'],
  yawLeft: ['KeyQ'],
  yawRight: ['KeyE'],
  arm: ['KeyR'],
  disarm: ['KeyT'],
  modeAngle: ['Digit1'],
  modeHorizon: ['Digit2'],
  modeAcro: ['Digit3'],
  cameraUp: ['KeyZ'],
  cameraDown: ['KeyX'],
  pause: ['KeyP', 'Escape'],
} as const;

// ============================================================================
// TUTORIAL PROGRESSION
// ============================================================================

export const TUTORIAL_LEVELS = {
  novice: {
    name: 'Novice',
    description: 'Learn basic throttle control',
    unlocks: ['freePlay', 'basicDrones'],
    tasks: ['throttleControl', 'hoverChallenge'],
  },
  beginner: {
    name: 'Beginner',
    description: 'Master yaw and movement',
    unlocks: ['trainingCourses', 'sportDrones'],
    tasks: ['yawRotation', 'forwardBackward', 'fourPointNav'],
  },
  intermediate: {
    name: 'Intermediate',
    description: 'Banking turns and FPV',
    unlocks: ['raceTracks', 'fpvDrones', 'multiplayer'],
    tasks: ['bankingTurns', 'fpvIntro', 'figureEight', 'precisionLanding'],
  },
  advanced: {
    name: 'Advanced',
    description: 'Acro mode basics',
    unlocks: ['freestyleMaps', 'racingLeague'],
    tasks: ['acroBasics', 'firstFlip', 'threeGatesAcro'],
  },
  expert: {
    name: 'Expert',
    description: 'Master advanced maneuvers',
    unlocks: ['allContent', 'competitionEntry'],
    tasks: ['powerLoops', 'splitS', 'freestyleCombo'],
  },
} as const;

// ============================================================================
// SCORING
// ============================================================================

export const SCORING = {
  TIME_BONUS_MULTIPLIER: 100,
  TIME_BONUS_MAX: 5000,
  PRECISION_BONUS_BASE: 1000,
  OBJECTIVE_POINTS: 1000,
  COMBO_MULTIPLIER_INCREMENT: 0.5,
  COMBO_MULTIPLIER_MAX: 2.0,
  CRASH_PENALTY_COLLISION: -500,
  CRASH_PENALTY_RESET: -1000,
} as const;

// ============================================================================
// CAMERA SETTINGS
// ============================================================================

export const CAMERA = {
  FPV: {
    fov: 120,
    near: 0.1,
    far: 1000,
    defaultAngle: 30, // degrees
  },
  CHASE: {
    fov: 75,
    near: 0.1,
    far: 2000,
    distance: 5,
    height: 2,
    smoothing: 0.1,
  },
  LOS: {
    fov: 60,
    near: 0.1,
    far: 5000,
  },
} as const;

// ============================================================================
// UI CONSTANTS
// ============================================================================

export const UI = {
  HUD_UPDATE_RATE: 30, // Hz
  MENU_TRANSITION_DURATION: 300, // ms
  TOAST_DURATION: 3000, // ms
  MIN_UI_SCALE: 1.0,
  MAX_UI_SCALE: 3.0,
} as const;

// ============================================================================
// WEATHER PRESETS
// ============================================================================

export const WEATHER_PRESETS = {
  CALM: { windMin: 0, windMax: 2, fogDensity: 0, rainIntensity: 0 },
  BREEZY: { windMin: 3, windMax: 6, fogDensity: 0, rainIntensity: 0 },
  WINDY: { windMin: 7, windMax: 12, fogDensity: 0.1, rainIntensity: 0 },
  STORMY: { windMin: 13, windMax: 20, fogDensity: 0.3, rainIntensity: 0.8 },
  FOGGY: { windMin: 0, windMax: 3, fogDensity: 0.7, rainIntensity: 0 },
  RAINY: { windMin: 4, windMax: 8, fogDensity: 0.2, rainIntensity: 0.6 },
} as const;

// ============================================================================
// TRICK SCORES
// ============================================================================

export const TRICK_SCORES: Record<string, { score: number; tier: 'basic' | 'advanced' | 'expert'; name: string }> = {
  FLIP_FORWARD: { score: 300, tier: 'basic', name: 'Forward Flip' },
  FLIP_BACKWARD: { score: 300, tier: 'basic', name: 'Backward Flip' },
  FLIP_LEFT: { score: 300, tier: 'basic', name: 'Left Flip' },
  FLIP_RIGHT: { score: 300, tier: 'basic', name: 'Right Flip' },
  ROLL_LEFT: { score: 400, tier: 'advanced', name: 'Left Roll' },
  ROLL_RIGHT: { score: 400, tier: 'advanced', name: 'Right Roll' },
  YAW_SPIN_360: { score: 500, tier: 'advanced', name: '360 Spin' },
  YAW_SPIN_720: { score: 800, tier: 'expert', name: '720 Spin' },
  POWER_LOOP: { score: 1000, tier: 'expert', name: 'Power Loop' },
  INVERTED_HANG: { score: 600, tier: 'expert', name: 'Inverted Hang' },
} as const;

// ============================================================================
// MAP PRESETS
// ============================================================================

export const MAP_PRESETS = {
  GRASSLANDS: { terrain: 'grass' as const, heightScale: 3, hasWater: true, waterLevel: -0.5 },
  MOUNTAINS: { terrain: 'snow' as const, heightScale: 8, hasWater: false, waterLevel: 0 },
  CANYON: { terrain: 'desert' as const, heightScale: 6, hasWater: false, waterLevel: 0 },
  ISLAND: { terrain: 'grass' as const, heightScale: 4, hasWater: true, waterLevel: 0.5 },
  CITY: { terrain: 'urban' as const, heightScale: 1, hasWater: false, waterLevel: 0 },
} as const;

// ============================================================================
// RACE CONSTANTS
// ============================================================================

export const RACE = {
  GHOST_RECORD_INTERVAL: 3, // record every 3rd frame
  COUNTDOWN_SECONDS: 3,
  CHECKPOINT_RADIUS: 3,
  NEON_GATE_COLORS: ['#00ffff', '#ff00ff', '#ffff00', '#00ff88'] as readonly string[],
} as const;
