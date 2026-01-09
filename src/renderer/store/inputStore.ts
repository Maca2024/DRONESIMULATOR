import { create } from 'zustand';
import type { NormalizedInput, InputSource, InputConfig } from '@shared/types';
import { INPUT, DEFAULT_KEY_BINDINGS } from '@shared/constants';

interface KeyState {
  pressed: boolean;
  pressTime: number;
  value: number; // 0-1 analog simulation
}

interface InputState {
  // Current normalized input
  input: NormalizedInput;

  // Active input source
  activeSource: InputSource;

  // Keyboard state
  keys: Map<string, KeyState>;

  // Mouse state
  mousePosition: { x: number; y: number };
  mouseButtons: Map<number, boolean>;
  mouseWheel: number;

  // Gamepad state
  gamepads: Map<number, Gamepad>;
  activeGamepadIndex: number | null;

  // Configuration
  config: InputConfig;
  keyBindings: typeof DEFAULT_KEY_BINDINGS;

  // Actions
  initialize: () => void;
  cleanup: () => void;
  update: (deltaTime: number) => void;
  setActiveSource: (source: InputSource) => void;
  setConfig: (config: Partial<InputConfig>) => void;
  getInput: () => NormalizedInput;
}

const createEmptyInput = (): NormalizedInput => ({
  throttle: 0,
  yaw: 0,
  pitch: 0,
  roll: 0,
  aux1: false,
  aux2: 0,
  aux3: 0,
  timestamp: performance.now(),
  source: 'keyboard',
});

export const useInputStore = create<InputState>((set, get) => ({
  input: createEmptyInput(),
  activeSource: 'keyboard',
  keys: new Map(),
  mousePosition: { x: 0, y: 0 },
  mouseButtons: new Map(),
  mouseWheel: 0,
  gamepads: new Map(),
  activeGamepadIndex: null,
  config: {
    sensitivity: 1.0,
    deadzone: 0.02,
    expo: 0.3,
    inverted: {
      pitch: false,
      roll: false,
      yaw: false,
      throttle: false,
    },
  },
  keyBindings: { ...DEFAULT_KEY_BINDINGS },

  initialize: () => {
    // Keyboard events
    const handleKeyDown = (e: KeyboardEvent): void => {
      const state = get();
      const keyState = state.keys.get(e.code);

      if (!keyState || !keyState.pressed) {
        const newKeys = new Map(state.keys);
        newKeys.set(e.code, {
          pressed: true,
          pressTime: performance.now(),
          value: INPUT.TAP_INPUT_PERCENT,
        });
        set({ keys: newKeys, activeSource: 'keyboard' });
      }

      // Prevent default for game keys
      if (isGameKey(e.code, state.keyBindings)) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent): void => {
      const state = get();
      const newKeys = new Map(state.keys);
      newKeys.set(e.code, {
        pressed: false,
        pressTime: 0,
        value: 0,
      });
      set({ keys: newKeys });
    };

    // Mouse events
    const handleMouseMove = (e: MouseEvent): void => {
      set({
        mousePosition: { x: e.clientX, y: e.clientY },
        activeSource: 'mouse',
      });
    };

    const handleMouseDown = (e: MouseEvent): void => {
      const state = get();
      const newButtons = new Map(state.mouseButtons);
      newButtons.set(e.button, true);
      set({ mouseButtons: newButtons, activeSource: 'mouse' });
    };

    const handleMouseUp = (e: MouseEvent): void => {
      const state = get();
      const newButtons = new Map(state.mouseButtons);
      newButtons.set(e.button, false);
      set({ mouseButtons: newButtons });
    };

    const handleWheel = (e: WheelEvent): void => {
      const delta = Math.sign(e.deltaY) * INPUT.SCROLL_THROTTLE_STEP;
      set((state) => ({
        mouseWheel: Math.max(0, Math.min(1, state.input.throttle - delta)),
        activeSource: 'mouse',
      }));
      e.preventDefault();
    };

    // Gamepad events
    const handleGamepadConnected = (e: GamepadEvent): void => {
      const state = get();
      const newGamepads = new Map(state.gamepads);
      newGamepads.set(e.gamepad.index, e.gamepad);
      set({
        gamepads: newGamepads,
        activeGamepadIndex: e.gamepad.index,
        activeSource: 'gamepad',
      });
      console.info(`Gamepad connected: ${e.gamepad.id}`);
    };

    const handleGamepadDisconnected = (e: GamepadEvent): void => {
      const state = get();
      const newGamepads = new Map(state.gamepads);
      newGamepads.delete(e.gamepad.index);

      const newActiveIndex =
        state.activeGamepadIndex === e.gamepad.index
          ? newGamepads.size > 0
            ? newGamepads.keys().next().value
            : null
          : state.activeGamepadIndex;

      set({
        gamepads: newGamepads,
        activeGamepadIndex: newActiveIndex,
      });
      console.info(`Gamepad disconnected: ${e.gamepad.id}`);
    };

    // Register events
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('gamepadconnected', handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);

    // Store cleanup function
    const cleanup = (): void => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('gamepadconnected', handleGamepadConnected);
      window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected);
    };

    // Store cleanup in window for later
    (window as Window & { __inputCleanup?: () => void }).__inputCleanup = cleanup;
  },

  cleanup: () => {
    const cleanup = (window as Window & { __inputCleanup?: () => void }).__inputCleanup;
    if (cleanup) {
      cleanup();
    }
  },

  update: (deltaTime) => {
    const state = get();
    const now = performance.now();

    // Update keyboard analog simulation
    const newKeys = new Map(state.keys);
    let keysChanged = false;

    newKeys.forEach((keyState, code) => {
      if (keyState.pressed) {
        const holdTime = now - keyState.pressTime;
        const newValue = Math.min(1, INPUT.TAP_INPUT_PERCENT + (holdTime / INPUT.HOLD_RAMP_SPEED) * (1 - INPUT.TAP_INPUT_PERCENT));

        if (keyState.value !== newValue) {
          newKeys.set(code, { ...keyState, value: newValue });
          keysChanged = true;
        }
      } else if (keyState.value > 0) {
        const decay = deltaTime / INPUT.AUTO_CENTER_SPEED;
        const newValue = Math.max(0, keyState.value - decay);
        newKeys.set(code, { ...keyState, value: newValue });
        keysChanged = true;
      }
    });

    if (keysChanged) {
      set({ keys: newKeys });
    }

    // Update gamepad state
    const gamepads = navigator.getGamepads();
    if (gamepads) {
      const newGamepads = new Map(state.gamepads);
      for (const gp of gamepads) {
        if (gp) {
          newGamepads.set(gp.index, gp);
        }
      }
      set({ gamepads: newGamepads });
    }

    // Calculate normalized input
    const input = calculateNormalizedInput(get());
    set({ input });
  },

  setActiveSource: (source) => set({ activeSource: source }),

  setConfig: (newConfig) =>
    set((state) => ({
      config: { ...state.config, ...newConfig },
    })),

  getInput: () => get().input,
}));

// Helper functions
function isGameKey(code: string, bindings: typeof DEFAULT_KEY_BINDINGS): boolean {
  return Object.values(bindings).some((keys) => (keys as readonly string[]).includes(code));
}

function getKeyValue(keys: Map<string, KeyState>, codes: readonly string[]): number {
  let maxValue = 0;
  for (const code of codes) {
    const keyState = keys.get(code);
    if (keyState && keyState.value > maxValue) {
      maxValue = keyState.value;
    }
  }
  return maxValue;
}

function applyExpo(value: number, expo: number): number {
  const sign = Math.sign(value);
  const abs = Math.abs(value);
  return sign * (abs * (1 - expo) + abs * abs * abs * expo);
}

function applyDeadzone(value: number, deadzone: number): number {
  const abs = Math.abs(value);
  if (abs < deadzone) return 0;
  const sign = Math.sign(value);
  return sign * ((abs - deadzone) / (1 - deadzone));
}

function calculateNormalizedInput(state: InputState): NormalizedInput {
  const { keys, keyBindings, config, activeSource, gamepads, activeGamepadIndex, mouseWheel } = state;

  let throttle = 0;
  let yaw = 0;
  let pitch = 0;
  let roll = 0;
  let aux1 = false;
  let aux2 = 0;
  let aux3 = 0;

  if (activeSource === 'keyboard') {
    // Calculate from keyboard
    const thrustUp = getKeyValue(keys, keyBindings.thrustUp);
    const thrustDown = getKeyValue(keys, keyBindings.thrustDown);
    throttle = thrustUp - thrustDown * 0.5;
    throttle = Math.max(0, Math.min(1, (throttle + 1) / 2));

    const yawLeft = getKeyValue(keys, keyBindings.yawLeft);
    const yawRight = getKeyValue(keys, keyBindings.yawRight);
    yaw = yawRight - yawLeft;

    const pitchUp = getKeyValue(keys, keyBindings.moveUp);
    const pitchDown = getKeyValue(keys, keyBindings.moveDown);
    pitch = pitchDown - pitchUp;

    const rollLeft = getKeyValue(keys, keyBindings.moveLeft);
    const rollRight = getKeyValue(keys, keyBindings.moveRight);
    roll = rollRight - rollLeft;

    aux1 = getKeyValue(keys, keyBindings.arm) > 0.5;

    if (getKeyValue(keys, keyBindings.modeAngle) > 0.5) aux2 = 0;
    if (getKeyValue(keys, keyBindings.modeHorizon) > 0.5) aux2 = 1;
    if (getKeyValue(keys, keyBindings.modeAcro) > 0.5) aux2 = 2;

    const camUp = getKeyValue(keys, keyBindings.cameraUp);
    const camDown = getKeyValue(keys, keyBindings.cameraDown);
    aux3 = camUp - camDown;
  } else if (activeSource === 'mouse') {
    throttle = Math.max(0, Math.min(1, mouseWheel));
  } else if (activeSource === 'gamepad' && activeGamepadIndex !== null) {
    const gamepad = gamepads.get(activeGamepadIndex);
    if (gamepad) {
      // Standard gamepad mapping (Mode 2)
      throttle = (gamepad.axes[1] !== undefined ? -gamepad.axes[1] : 0 + 1) / 2;
      yaw = gamepad.axes[0] ?? 0;
      pitch = gamepad.axes[3] ?? 0;
      roll = gamepad.axes[2] ?? 0;

      aux1 = gamepad.buttons[0]?.pressed ?? false;
      aux2 = gamepad.buttons[1]?.pressed ? 1 : gamepad.buttons[2]?.pressed ? 2 : 0;
    }
  }

  // Apply deadzone and expo
  yaw = applyDeadzone(yaw, config.deadzone);
  pitch = applyDeadzone(pitch, config.deadzone);
  roll = applyDeadzone(roll, config.deadzone);

  yaw = applyExpo(yaw, config.expo);
  pitch = applyExpo(pitch, config.expo);
  roll = applyExpo(roll, config.expo);

  // Apply sensitivity
  yaw *= config.sensitivity;
  pitch *= config.sensitivity;
  roll *= config.sensitivity;

  // Apply inversion
  if (config.inverted.yaw) yaw = -yaw;
  if (config.inverted.pitch) pitch = -pitch;
  if (config.inverted.roll) roll = -roll;
  if (config.inverted.throttle) throttle = 1 - throttle;

  // Clamp values
  throttle = Math.max(0, Math.min(1, throttle));
  yaw = Math.max(-1, Math.min(1, yaw));
  pitch = Math.max(-1, Math.min(1, pitch));
  roll = Math.max(-1, Math.min(1, roll));
  aux3 = Math.max(-1, Math.min(1, aux3));

  return {
    throttle,
    yaw,
    pitch,
    roll,
    aux1,
    aux2,
    aux3,
    timestamp: performance.now(),
    source: activeSource,
  };
}
