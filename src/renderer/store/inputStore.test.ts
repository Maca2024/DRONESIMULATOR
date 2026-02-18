import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useInputStore } from './inputStore';

// Access the mock time helpers from setup.ts
const setMockTime = (t: number): void => {
  const fn = (global as Record<string, unknown>).__setMockTime as ((t: number) => void) | undefined;
  fn?.(t);
};

describe('InputStore', () => {
  beforeEach(() => {
    setMockTime(0);

    // Reset store state
    useInputStore.setState({
      input: {
        throttle: 0,
        yaw: 0,
        pitch: 0,
        roll: 0,
        aux1: false,
        aux2: 0,
        aux3: 0,
        timestamp: 0,
        source: 'keyboard',
      },
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
    });

    // Clean up any previous initialization
    (window as Window & { __inputInitialized?: boolean }).__inputInitialized = false;
    delete (window as Window & { __inputCleanup?: () => void }).__inputCleanup;
  });

  afterEach(() => {
    const cleanup = (window as Window & { __inputCleanup?: () => void }).__inputCleanup;
    if (cleanup) cleanup();
    (window as Window & { __inputInitialized?: boolean }).__inputInitialized = false;
  });

  describe('initial state', () => {
    it('should have zero input values', () => {
      const state = useInputStore.getState();
      expect(state.input.throttle).toBe(0);
      expect(state.input.yaw).toBe(0);
      expect(state.input.pitch).toBe(0);
      expect(state.input.roll).toBe(0);
    });

    it('should use keyboard as default source', () => {
      expect(useInputStore.getState().activeSource).toBe('keyboard');
    });

    it('should have default config', () => {
      const config = useInputStore.getState().config;
      expect(config.sensitivity).toBe(1.0);
      expect(config.deadzone).toBe(0.02);
      expect(config.expo).toBe(0.3);
    });

    it('should have no inversions by default', () => {
      const { inverted } = useInputStore.getState().config;
      expect(inverted.pitch).toBe(false);
      expect(inverted.roll).toBe(false);
      expect(inverted.yaw).toBe(false);
      expect(inverted.throttle).toBe(false);
    });
  });

  describe('initialize', () => {
    it('should register event listeners', () => {
      const addSpy = vi.spyOn(window, 'addEventListener');
      useInputStore.getState().initialize();
      expect(addSpy).toHaveBeenCalled();
      addSpy.mockRestore();
    });

    it('should prevent double initialization', () => {
      const addSpy = vi.spyOn(window, 'addEventListener');
      useInputStore.getState().initialize();
      const callCount = addSpy.mock.calls.length;
      useInputStore.getState().initialize();
      expect(addSpy.mock.calls.length).toBe(callCount);
      addSpy.mockRestore();
    });
  });

  describe('cleanup', () => {
    it('should remove event listeners', () => {
      useInputStore.getState().initialize();
      const removeSpy = vi.spyOn(window, 'removeEventListener');
      useInputStore.getState().cleanup();
      expect(removeSpy).toHaveBeenCalled();
      removeSpy.mockRestore();
    });
  });

  describe('keyboard input processing', () => {
    it('should handle key press', () => {
      useInputStore.getState().initialize();
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }));

      const keys = useInputStore.getState().keys;
      const spaceState = keys.get('Space');
      expect(spaceState).toBeDefined();
      expect(spaceState!.pressed).toBe(true);
    });

    it('should handle key release', () => {
      useInputStore.getState().initialize();
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }));
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', bubbles: true }));

      const spaceState = useInputStore.getState().keys.get('Space');
      expect(spaceState).toBeDefined();
      expect(spaceState!.pressed).toBe(false);
    });

    it('should set active source to keyboard on key press', () => {
      useInputStore.getState().initialize();
      useInputStore.setState({ activeSource: 'mouse' });
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', bubbles: true }));
      expect(useInputStore.getState().activeSource).toBe('keyboard');
    });
  });

  describe('mouse input', () => {
    it('should track mouse position', () => {
      useInputStore.getState().initialize();
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 200 }));
      const pos = useInputStore.getState().mousePosition;
      expect(pos.x).toBe(100);
      expect(pos.y).toBe(200);
    });

    it('should not change active source on mouse move', () => {
      useInputStore.getState().initialize();
      useInputStore.setState({ activeSource: 'keyboard' });
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 200 }));
      expect(useInputStore.getState().activeSource).toBe('keyboard');
    });

    it('should set active source to mouse on click', () => {
      useInputStore.getState().initialize();
      window.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
      expect(useInputStore.getState().activeSource).toBe('mouse');
    });

    it('should track mouse button state', () => {
      useInputStore.getState().initialize();
      window.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
      expect(useInputStore.getState().mouseButtons.get(0)).toBe(true);
      window.dispatchEvent(new MouseEvent('mouseup', { button: 0 }));
      expect(useInputStore.getState().mouseButtons.get(0)).toBe(false);
    });
  });

  describe('update - normalized input calculation', () => {
    it('should produce zero throttle with no keys pressed', () => {
      useInputStore.getState().update(0.016);
      expect(useInputStore.getState().input.throttle).toBe(0);
    });

    it('should produce positive throttle when Space is held long enough', () => {
      // Press Space at time 0, then advance time so holdTime > HOLD_RAMP_SPEED (150ms)
      const keys = new Map();
      keys.set('Space', { pressed: true, pressTime: 0, value: 0.15 });
      useInputStore.setState({ keys, activeSource: 'keyboard' });

      setMockTime(200); // 200ms hold time -> should ramp to full value
      useInputStore.getState().update(0.016);
      const input = useInputStore.getState().input;
      expect(input.throttle).toBeGreaterThan(0);
    });

    it('should produce yaw when E is held', () => {
      const keys = new Map();
      keys.set('KeyE', { pressed: true, pressTime: 0, value: 0.15 });
      useInputStore.setState({ keys, activeSource: 'keyboard' });

      setMockTime(200);
      useInputStore.getState().update(0.016);
      expect(useInputStore.getState().input.yaw).toBeGreaterThan(0);
    });

    it('should produce negative yaw when Q is held', () => {
      const keys = new Map();
      keys.set('KeyQ', { pressed: true, pressTime: 0, value: 0.15 });
      useInputStore.setState({ keys, activeSource: 'keyboard' });

      setMockTime(200);
      useInputStore.getState().update(0.016);
      expect(useInputStore.getState().input.yaw).toBeLessThan(0);
    });

    it('should produce pitch when S is held', () => {
      const keys = new Map();
      keys.set('KeyS', { pressed: true, pressTime: 0, value: 0.15 });
      useInputStore.setState({ keys, activeSource: 'keyboard' });

      setMockTime(200);
      useInputStore.getState().update(0.016);
      expect(useInputStore.getState().input.pitch).toBeGreaterThan(0);
    });

    it('should produce roll when D is held', () => {
      const keys = new Map();
      keys.set('KeyD', { pressed: true, pressTime: 0, value: 0.15 });
      useInputStore.setState({ keys, activeSource: 'keyboard' });

      setMockTime(200);
      useInputStore.getState().update(0.016);
      expect(useInputStore.getState().input.roll).toBeGreaterThan(0);
    });

    it('should clamp throttle to 0-1', () => {
      const keys = new Map();
      keys.set('Space', { pressed: true, pressTime: 0, value: 0.15 });
      useInputStore.setState({ keys, activeSource: 'keyboard' });

      setMockTime(500);
      useInputStore.getState().update(0.016);
      const input = useInputStore.getState().input;
      expect(input.throttle).toBeLessThanOrEqual(1);
      expect(input.throttle).toBeGreaterThanOrEqual(0);
    });

    it('should clamp yaw/pitch/roll to -1 to 1', () => {
      useInputStore.getState().update(0.016);
      const input = useInputStore.getState().input;
      expect(input.yaw).toBeGreaterThanOrEqual(-1);
      expect(input.yaw).toBeLessThanOrEqual(1);
      expect(input.pitch).toBeGreaterThanOrEqual(-1);
      expect(input.pitch).toBeLessThanOrEqual(1);
      expect(input.roll).toBeGreaterThanOrEqual(-1);
      expect(input.roll).toBeLessThanOrEqual(1);
    });
  });

  describe('config', () => {
    it('should apply sensitivity', () => {
      useInputStore.getState().setConfig({ sensitivity: 2.0 });
      expect(useInputStore.getState().config.sensitivity).toBe(2.0);
    });

    it('should merge partial config', () => {
      useInputStore.getState().setConfig({ deadzone: 0.1 });
      const config = useInputStore.getState().config;
      expect(config.deadzone).toBe(0.1);
      expect(config.sensitivity).toBe(1.0);
    });
  });

  describe('setActiveSource', () => {
    it('should change active source', () => {
      useInputStore.getState().setActiveSource('gamepad');
      expect(useInputStore.getState().activeSource).toBe('gamepad');
    });
  });

  describe('getInput', () => {
    it('should return current input state', () => {
      const input = useInputStore.getState().getInput();
      expect(input).toBeDefined();
      expect(typeof input.throttle).toBe('number');
      expect(typeof input.yaw).toBe('number');
      expect(typeof input.pitch).toBe('number');
      expect(typeof input.roll).toBe('number');
    });
  });

  describe('keyboard analog simulation', () => {
    it('should ramp up value while held', () => {
      const keys = new Map();
      keys.set('Space', { pressed: true, pressTime: 0, value: 0.15 });
      useInputStore.setState({ keys });

      // Advance time so ramp calculation gives higher value
      setMockTime(100);
      useInputStore.getState().update(0.016);

      const spaceState = useInputStore.getState().keys.get('Space');
      expect(spaceState!.value).toBeGreaterThan(0.15);
    });

    it('should decay value when released', () => {
      const keys = new Map();
      keys.set('Space', { pressed: false, pressTime: 0, value: 0.5 });
      useInputStore.setState({ keys });

      useInputStore.getState().update(0.016);
      const spaceState = useInputStore.getState().keys.get('Space');
      expect(spaceState!.value).toBeLessThan(0.5);
    });

    it('should decay value to zero over time', () => {
      const keys = new Map();
      keys.set('Space', { pressed: false, pressTime: 0, value: 0.1 });
      useInputStore.setState({ keys });

      // AUTO_CENTER_SPEED = 50ms. decay = deltaTime / 50.
      // With deltaTime 0.016s, decay = 0.00032 per update.
      // Need ~313 iterations for value 0.1 to reach 0. Use 500 to be safe.
      for (let i = 0; i < 500; i++) {
        useInputStore.getState().update(0.016);
      }

      const spaceState = useInputStore.getState().keys.get('Space');
      expect(spaceState!.value).toBe(0);
    });
  });

  describe('inversion', () => {
    it('should invert throttle when configured', () => {
      // Set pressTime far in the past so holdTime ramps value to 1.0
      const keys = new Map();
      keys.set('Space', { pressed: true, pressTime: 0, value: 1.0 });
      useInputStore.setState({
        keys,
        activeSource: 'keyboard',
        config: {
          sensitivity: 1.0,
          deadzone: 0.02,
          expo: 0.3,
          inverted: { pitch: false, roll: false, yaw: false, throttle: true },
        },
      });

      // Advance mock time so holdTime > 150ms -> value reaches 1.0
      setMockTime(300);
      useInputStore.getState().update(0.016);
      const input = useInputStore.getState().input;
      // With throttle inverted, throttle = 1 - 1 = 0
      expect(input.throttle).toBe(0);
    });
  });

  describe('arm control', () => {
    it('should set aux1 when arm key is held long enough', () => {
      const keys = new Map();
      keys.set('KeyR', { pressed: true, pressTime: 0, value: 0.15 });
      useInputStore.setState({ keys, activeSource: 'keyboard' });

      // Advance time so value ramps past 0.5
      setMockTime(200);
      useInputStore.getState().update(0.016);
      expect(useInputStore.getState().input.aux1).toBe(true);
    });
  });

  describe('gamepad handling', () => {
    it('should handle gamepad connected', () => {
      useInputStore.getState().initialize();

      const mockGamepad = {
        index: 0,
        id: 'Test Gamepad',
        connected: true,
        axes: [0, 0, 0, 0],
        buttons: [],
        mapping: 'standard',
        timestamp: 0,
        hapticActuators: [],
        vibrationActuator: null,
      } as unknown as Gamepad;

      const event = new Event('gamepadconnected') as GamepadEvent;
      Object.defineProperty(event, 'gamepad', { value: mockGamepad });
      window.dispatchEvent(event);

      const state = useInputStore.getState();
      expect(state.activeSource).toBe('gamepad');
      expect(state.activeGamepadIndex).toBe(0);
      expect(state.gamepads.get(0)).toBeDefined();
    });

    it('should handle gamepad disconnected', () => {
      useInputStore.getState().initialize();

      // First connect
      const mockGamepad = {
        index: 0,
        id: 'Test Gamepad',
        connected: true,
        axes: [0, 0, 0, 0],
        buttons: [],
        mapping: 'standard',
        timestamp: 0,
        hapticActuators: [],
        vibrationActuator: null,
      } as unknown as Gamepad;

      const connectEvent = new Event('gamepadconnected') as GamepadEvent;
      Object.defineProperty(connectEvent, 'gamepad', { value: mockGamepad });
      window.dispatchEvent(connectEvent);

      // Then disconnect
      const disconnectEvent = new Event('gamepaddisconnected') as GamepadEvent;
      Object.defineProperty(disconnectEvent, 'gamepad', { value: mockGamepad });
      window.dispatchEvent(disconnectEvent);

      const state = useInputStore.getState();
      expect(state.gamepads.size).toBe(0);
      expect(state.activeGamepadIndex).toBeNull();
    });
  });

  describe('wheel input', () => {
    it('should handle wheel events for throttle', () => {
      useInputStore.getState().initialize();

      // Set a starting throttle value in the input
      useInputStore.setState({
        input: { ...useInputStore.getState().input, throttle: 0.5 },
      });

      const wheelEvent = new WheelEvent('wheel', {
        deltaY: -100, // scroll up
        bubbles: true,
        cancelable: true,
      });
      window.dispatchEvent(wheelEvent);

      const state = useInputStore.getState();
      expect(state.activeSource).toBe('mouse');
      expect(state.mouseWheel).toBeGreaterThanOrEqual(0);
      expect(state.mouseWheel).toBeLessThanOrEqual(1);
    });
  });

  describe('gamepad input calculation', () => {
    it('should calculate input from gamepad axes', () => {
      const mockGamepad = {
        index: 0,
        id: 'Test',
        axes: [0.5, -0.3, 0.2, 0.1],
        buttons: [
          { pressed: false, value: 0, touched: false },
          { pressed: false, value: 0, touched: false },
          { pressed: false, value: 0, touched: false },
        ],
      } as unknown as Gamepad;

      const gamepads = new Map();
      gamepads.set(0, mockGamepad);

      useInputStore.setState({
        activeSource: 'gamepad',
        activeGamepadIndex: 0,
        gamepads,
        keys: new Map(),
      });

      useInputStore.getState().update(0.016);
      const input = useInputStore.getState().input;
      expect(input.source).toBe('gamepad');
      expect(input.throttle).toBeGreaterThanOrEqual(0);
      expect(input.throttle).toBeLessThanOrEqual(1);
    });

    it('should handle gamepad button presses', () => {
      const mockGamepad = {
        index: 0,
        id: 'Test',
        axes: [0, 0, 0, 0],
        buttons: [
          { pressed: true, value: 1, touched: true },  // aux1 = true
          { pressed: true, value: 1, touched: true },   // aux2 = 1
          { pressed: false, value: 0, touched: false },
        ],
      } as unknown as Gamepad;

      const gamepads = new Map();
      gamepads.set(0, mockGamepad);

      useInputStore.setState({
        activeSource: 'gamepad',
        activeGamepadIndex: 0,
        gamepads,
        keys: new Map(),
      });

      useInputStore.getState().update(0.016);
      const input = useInputStore.getState().input;
      expect(input.aux1).toBe(true);
      expect(input.aux2).toBe(1);
    });
  });

  describe('mouse throttle input', () => {
    it('should use mouseWheel for throttle when mouse is active source', () => {
      useInputStore.setState({
        activeSource: 'mouse',
        mouseWheel: 0.7,
        keys: new Map(),
      });

      useInputStore.getState().update(0.016);
      const input = useInputStore.getState().input;
      expect(input.throttle).toBeCloseTo(0.7, 1);
    });
  });

  describe('flight mode controls', () => {
    it('should set aux2 to 0 for angle mode', () => {
      const keys = new Map();
      keys.set('Digit1', { pressed: true, pressTime: 0, value: 0.15 });
      useInputStore.setState({ keys, activeSource: 'keyboard' });

      setMockTime(200);
      useInputStore.getState().update(0.016);
      expect(useInputStore.getState().input.aux2).toBe(0);
    });

    it('should set aux2 to 1 for horizon mode', () => {
      const keys = new Map();
      keys.set('Digit2', { pressed: true, pressTime: 0, value: 0.15 });
      useInputStore.setState({ keys, activeSource: 'keyboard' });

      setMockTime(200);
      useInputStore.getState().update(0.016);
      expect(useInputStore.getState().input.aux2).toBe(1);
    });

    it('should set aux2 to 2 for acro mode', () => {
      const keys = new Map();
      keys.set('Digit3', { pressed: true, pressTime: 0, value: 0.15 });
      useInputStore.setState({ keys, activeSource: 'keyboard' });

      setMockTime(200);
      useInputStore.getState().update(0.016);
      expect(useInputStore.getState().input.aux2).toBe(2);
    });
  });
});
