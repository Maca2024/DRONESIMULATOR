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

  // Combined input mode - uses all sources together
  combinedInputMode: boolean;

  // Active input source (for display purposes)
  activeSource: InputSource;

  // Keyboard state
  keys: Map<string, KeyState>;

  // Mouse state
  mousePosition: { x: number; y: number };
  mouseDelta: { x: number; y: number };
  mouseVelocity: { x: number; y: number };  // Smoothed velocity
  mouseButtons: Map<number, boolean>;
  mouseThrottle: number;
  mouseFlightEnabled: boolean;
  pointerLocked: boolean;
  lastMouseMoveTime: number;

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
  enableMouseFlight: (enable: boolean) => void;
  requestPointerLock: () => void;
  setCombinedInputMode: (enabled: boolean) => void;
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
  combinedInputMode: true,  // Use both keyboard and mouse together
  activeSource: 'keyboard',
  keys: new Map(),
  mousePosition: { x: 0, y: 0 },
  mouseDelta: { x: 0, y: 0 },
  mouseVelocity: { x: 0, y: 0 },
  mouseButtons: new Map(),
  mouseThrottle: 0.5,  // Start at 50% throttle
  mouseFlightEnabled: true,
  pointerLocked: false,
  lastMouseMoveTime: 0,
  gamepads: new Map(),
  activeGamepadIndex: null,
  config: {
    sensitivity: 1.0,
    deadzone: 0.05,  // Slightly higher deadzone for stability
    expo: 0.4,       // More expo for better center control
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

    // Mouse events for full flight control
    const handleMouseMove = (e: MouseEvent): void => {
      const state = get();
      const now = performance.now();

      if (state.pointerLocked) {
        // Use movement delta for flight control when pointer is locked
        // Direct velocity from mouse movement (will decay in update)
        const sensitivity = 0.003;
        set({
          mouseVelocity: {
            x: Math.max(-1, Math.min(1, e.movementX * sensitivity)),
            y: Math.max(-1, Math.min(1, e.movementY * sensitivity))
          },
          lastMouseMoveTime: now,
          activeSource: 'mouse',
        });
      } else {
        // Use screen position when not locked - position-based control
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const normalizedX = (e.clientX - centerX) / centerX;
        const normalizedY = (e.clientY - centerY) / centerY;

        set({
          mousePosition: { x: e.clientX, y: e.clientY },
          mouseDelta: { x: normalizedX, y: normalizedY },
          mouseVelocity: { x: normalizedX, y: normalizedY },
          lastMouseMoveTime: now,
          activeSource: 'mouse',
        });
      }
    };

    const handleMouseDown = (e: MouseEvent): void => {
      const state = get();
      const newButtons = new Map(state.mouseButtons);
      newButtons.set(e.button, true);
      set({ mouseButtons: newButtons, activeSource: 'mouse' });

      // Right click to lock pointer for flight
      if (e.button === 2 && state.mouseFlightEnabled) {
        document.body.requestPointerLock();
      }
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
        mouseThrottle: Math.max(0, Math.min(1, state.mouseThrottle - delta)),
        activeSource: 'mouse',
      }));
      e.preventDefault();
    };

    // Pointer lock change handler
    const handlePointerLockChange = (): void => {
      const locked = document.pointerLockElement === document.body;
      set({ pointerLocked: locked });
      if (!locked) {
        // Reset mouse delta when unlocking
        set({ mouseDelta: { x: 0, y: 0 } });
      }
    };

    // Context menu prevention
    const handleContextMenu = (e: MouseEvent): void => {
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
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    window.addEventListener('contextmenu', handleContextMenu);

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
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      window.removeEventListener('contextmenu', handleContextMenu);
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
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

    // Update mouse velocity with decay (auto-center when not moving)
    const timeSinceMouseMove = now - state.lastMouseMoveTime;
    if (timeSinceMouseMove > 50) {  // Start decay after 50ms of no movement
      const decayRate = 0.15;  // Smooth decay
      const newVelocity = {
        x: state.mouseVelocity.x * (1 - decayRate),
        y: state.mouseVelocity.y * (1 - decayRate)
      };
      // Zero out very small values
      if (Math.abs(newVelocity.x) < 0.01) newVelocity.x = 0;
      if (Math.abs(newVelocity.y) < 0.01) newVelocity.y = 0;

      set({ mouseVelocity: newVelocity });
    }

    // Smooth mouse delta towards velocity (for position-based control)
    const smoothing = 0.2;
    const newDelta = {
      x: state.mouseDelta.x + (state.mouseVelocity.x - state.mouseDelta.x) * smoothing,
      y: state.mouseDelta.y + (state.mouseVelocity.y - state.mouseDelta.y) * smoothing
    };
    set({ mouseDelta: newDelta });

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

  enableMouseFlight: (enable) => set({ mouseFlightEnabled: enable }),

  requestPointerLock: () => {
    if (get().mouseFlightEnabled) {
      document.body.requestPointerLock();
    }
  },

  setCombinedInputMode: (enabled) => set({ combinedInputMode: enabled }),
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
  const {
    keys, keyBindings, config, activeSource, gamepads, activeGamepadIndex,
    mouseThrottle, mouseVelocity, mouseButtons, mouseFlightEnabled, combinedInputMode
  } = state;

  // Start with zero inputs
  let throttle = 0;
  let yaw = 0;
  let pitch = 0;
  let roll = 0;
  let aux1 = false;
  let aux2 = 0;
  let aux3 = 0;

  // === KEYBOARD INPUT ===
  const keyboardActive = combinedInputMode || activeSource === 'keyboard';
  if (keyboardActive) {
    // Throttle: Space increases, Shift decreases from current mouse throttle
    const thrustUp = getKeyValue(keys, keyBindings.thrustUp);
    const thrustDown = getKeyValue(keys, keyBindings.thrustDown);

    if (thrustUp > 0 || thrustDown > 0) {
      // Keyboard directly controls throttle
      throttle = thrustUp - thrustDown * 0.8;
      throttle = Math.max(0, Math.min(1, throttle));
    }

    // Yaw
    const yawLeft = getKeyValue(keys, keyBindings.yawLeft);
    const yawRight = getKeyValue(keys, keyBindings.yawRight);
    yaw += yawRight - yawLeft;

    // Pitch
    const pitchUp = getKeyValue(keys, keyBindings.moveUp);
    const pitchDown = getKeyValue(keys, keyBindings.moveDown);
    pitch += pitchDown - pitchUp;

    // Roll
    const rollLeft = getKeyValue(keys, keyBindings.moveLeft);
    const rollRight = getKeyValue(keys, keyBindings.moveRight);
    roll += rollRight - rollLeft;

    // Arm with R key
    if (getKeyValue(keys, keyBindings.arm) > 0.5) aux1 = true;

    // Flight modes
    if (getKeyValue(keys, keyBindings.modeAngle) > 0.5) aux2 = 0;
    if (getKeyValue(keys, keyBindings.modeHorizon) > 0.5) aux2 = 1;
    if (getKeyValue(keys, keyBindings.modeAcro) > 0.5) aux2 = 2;

    // Camera
    const camUp = getKeyValue(keys, keyBindings.cameraUp);
    const camDown = getKeyValue(keys, keyBindings.cameraDown);
    aux3 = camUp - camDown;
  }

  // === MOUSE INPUT ===
  const mouseActive = mouseFlightEnabled && (combinedInputMode || activeSource === 'mouse');
  if (mouseActive) {
    // Use mouse throttle if keyboard isn't controlling it
    const thrustUp = getKeyValue(keys, keyBindings.thrustUp);
    const thrustDown = getKeyValue(keys, keyBindings.thrustDown);
    if (thrustUp === 0 && thrustDown === 0) {
      throttle = mouseThrottle;
    }

    // Mouse velocity controls roll/pitch (only if keyboard isn't active for those)
    const hasKeyboardPitch = getKeyValue(keys, keyBindings.moveUp) > 0 || getKeyValue(keys, keyBindings.moveDown) > 0;
    const hasKeyboardRoll = getKeyValue(keys, keyBindings.moveLeft) > 0 || getKeyValue(keys, keyBindings.moveRight) > 0;

    if (!hasKeyboardRoll) {
      roll += mouseVelocity.x * 2;  // Amplify mouse for responsiveness
    }
    if (!hasKeyboardPitch) {
      pitch += mouseVelocity.y * 2;
    }

    // Left click for arm
    if (mouseButtons.get(0)) {
      aux1 = true;
      // While left click held, X becomes yaw
      if (!hasKeyboardRoll) {
        yaw += mouseVelocity.x;
        roll -= mouseVelocity.x * 2;  // Remove from roll
      }
    }
  }

  // === GAMEPAD INPUT ===
  if (activeGamepadIndex !== null && (combinedInputMode || activeSource === 'gamepad')) {
    const gamepad = gamepads.get(activeGamepadIndex);
    if (gamepad) {
      // Standard gamepad mapping (Mode 2)
      const gpThrottle = (-gamepad.axes[1] + 1) / 2;
      const gpYaw = gamepad.axes[0] ?? 0;
      const gpPitch = gamepad.axes[3] ?? 0;
      const gpRoll = gamepad.axes[2] ?? 0;

      // Add gamepad input
      throttle = Math.max(throttle, gpThrottle);
      yaw += gpYaw;
      pitch += gpPitch;
      roll += gpRoll;

      if (gamepad.buttons[0]?.pressed) aux1 = true;
      if (gamepad.buttons[1]?.pressed) aux2 = 1;
      if (gamepad.buttons[2]?.pressed) aux2 = 2;
    }
  }

  // === POST-PROCESSING ===

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

  // Clamp final values
  throttle = Math.max(0, Math.min(1, throttle));
  yaw = Math.max(-1, Math.min(1, yaw));
  pitch = Math.max(-1, Math.min(1, pitch));
  roll = Math.max(-1, Math.min(1, roll));
  aux3 = Math.max(-1, Math.min(1, aux3));

  // Determine primary source for display
  let source: InputSource = 'keyboard';
  if (activeSource === 'gamepad' && activeGamepadIndex !== null) source = 'gamepad';
  else if (activeSource === 'mouse' && mouseFlightEnabled) source = 'mouse';

  return {
    throttle,
    yaw,
    pitch,
    roll,
    aux1,
    aux2,
    aux3,
    timestamp: performance.now(),
    source,
  };
}
