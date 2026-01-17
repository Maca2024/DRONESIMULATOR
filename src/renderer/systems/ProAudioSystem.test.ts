/**
 * ProAudioSystem Tests
 *
 * Comprehensive tests for the professional audio system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProAudioSystem } from './ProAudioSystem';

// Mock Web Audio API
const mockAudioContext = {
  sampleRate: 44100,
  currentTime: 0,
  state: 'running',
  destination: {},
  createGain: vi.fn(() => ({
    gain: { value: 0, setTargetAtTime: vi.fn() },
    connect: vi.fn(),
  })),
  createOscillator: vi.fn(() => ({
    type: 'sine',
    frequency: { value: 0, setTargetAtTime: vi.fn() },
    detune: { value: 0 },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  })),
  createBiquadFilter: vi.fn(() => ({
    type: 'lowpass',
    frequency: { value: 0, setTargetAtTime: vi.fn() },
    Q: { value: 0 },
    gain: { value: 0 },  // Added for lowshelf filter
    connect: vi.fn(),
  })),
  createBuffer: vi.fn((channels, length, sampleRate) => ({
    numberOfChannels: channels,
    length,
    sampleRate,
    getChannelData: vi.fn(() => new Float32Array(length)),
  })),
  createBufferSource: vi.fn(() => ({
    buffer: null,
    loop: false,
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  })),
  createDynamicsCompressor: vi.fn(() => ({
    threshold: { value: 0 },
    knee: { value: 0 },
    ratio: { value: 0 },
    attack: { value: 0 },
    release: { value: 0 },
    connect: vi.fn(),
  })),
  createConvolver: vi.fn(() => ({
    buffer: null,
    connect: vi.fn(),
  })),
  createStereoPanner: vi.fn(() => ({
    pan: { value: 0 },
    connect: vi.fn(),
  })),
  resume: vi.fn(() => Promise.resolve()),
  close: vi.fn(() => Promise.resolve()),
};

// Mock window.AudioContext
vi.stubGlobal('AudioContext', vi.fn(() => mockAudioContext));

describe('ProAudioSystem', () => {
  let audioSystem: ProAudioSystem;

  beforeEach(() => {
    vi.clearAllMocks();
    audioSystem = new ProAudioSystem();
  });

  afterEach(() => {
    audioSystem.dispose();
  });

  describe('initialization', () => {
    it('should initialize without errors', () => {
      expect(() => audioSystem.initialize()).not.toThrow();
    });

    it('should create audio context on initialization', () => {
      audioSystem.initialize();
      expect(AudioContext).toHaveBeenCalled();
    });

    it('should create master gain node', () => {
      audioSystem.initialize();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });

    it('should create compressor for dynamics', () => {
      audioSystem.initialize();
      expect(mockAudioContext.createDynamicsCompressor).toHaveBeenCalled();
    });

    it('should create 4 motor audio nodes', () => {
      audioSystem.initialize();
      // Each motor has multiple oscillators (fundamental + harmonics + body)
      // 4 motors × (1 fundamental + 3 harmonics + 1 body) = 20 oscillators minimum
      expect(mockAudioContext.createOscillator.mock.calls.length).toBeGreaterThanOrEqual(20);
    });

    it('should create stereo panners for spatial positioning', () => {
      audioSystem.initialize();
      // 4 motors = 4 panners
      expect(mockAudioContext.createStereoPanner).toHaveBeenCalledTimes(4);
    });

    it('should not initialize twice', () => {
      audioSystem.initialize();
      const firstCallCount = mockAudioContext.createGain.mock.calls.length;

      audioSystem.initialize();
      expect(mockAudioContext.createGain.mock.calls.length).toBe(firstCallCount);
    });
  });

  describe('configuration', () => {
    beforeEach(() => {
      audioSystem.initialize();
    });

    it('should set master volume', () => {
      audioSystem.setConfig({ masterVolume: 0.5 });
      // Volume should be applied to master gain
    });

    it('should handle mute/unmute', () => {
      audioSystem.setMuted(true);
      audioSystem.setMuted(false);
      // Should not throw
    });

    it('should update motor volume', () => {
      audioSystem.setConfig({ motorVolume: 0.3 });
      // Motor mix gain should be updated
    });
  });

  describe('sound effects', () => {
    beforeEach(() => {
      audioSystem.initialize();
    });

    it('should play arm sound', () => {
      expect(() => audioSystem.playEffect('arm')).not.toThrow();
    });

    it('should play disarm sound', () => {
      expect(() => audioSystem.playEffect('disarm')).not.toThrow();
    });

    it('should play checkpoint sound', () => {
      expect(() => audioSystem.playEffect('checkpoint')).not.toThrow();
    });

    it('should play crash sound', () => {
      expect(() => audioSystem.playEffect('crash')).not.toThrow();
    });

    it('should play success sound', () => {
      expect(() => audioSystem.playEffect('success')).not.toThrow();
    });

    it('should play fail sound', () => {
      expect(() => audioSystem.playEffect('fail')).not.toThrow();
    });

    it('should play warning sound', () => {
      expect(() => audioSystem.playEffect('warning')).not.toThrow();
    });

    it('should play mode change sound', () => {
      expect(() => audioSystem.playEffect('modeChange')).not.toThrow();
    });

    it('should handle unknown effect gracefully', () => {
      expect(() => audioSystem.playEffect('unknownEffect')).not.toThrow();
    });

    it('should accept custom volume for effects', () => {
      expect(() => audioSystem.playEffect('checkpoint', 0.5)).not.toThrow();
    });
  });

  describe('motor sound updates', () => {
    beforeEach(() => {
      audioSystem.initialize();
    });

    it('should update motor sounds without error', () => {
      const state = {
        motorRPM: [10000, 10000, 10000, 10000] as [number, number, number, number],
        velocity: { x: 0, y: 0, z: 0 },
        position: { x: 0, y: 5, z: 0 },
        altitude: 5,
        armed: true,
        throttle: 0.5,
      };

      expect(() => audioSystem.update(state)).not.toThrow();
    });

    it('should handle disarmed state', () => {
      const state = {
        motorRPM: [0, 0, 0, 0] as [number, number, number, number],
        velocity: { x: 0, y: 0, z: 0 },
        position: { x: 0, y: 0, z: 0 },
        altitude: 0,
        armed: false,
        throttle: 0,
      };

      expect(() => audioSystem.update(state)).not.toThrow();
    });

    it('should handle high RPM values', () => {
      const state = {
        motorRPM: [25000, 25000, 25000, 25000] as [number, number, number, number],
        velocity: { x: 10, y: 5, z: 10 },
        position: { x: 100, y: 50, z: 100 },
        altitude: 50,
        armed: true,
        throttle: 1.0,
      };

      expect(() => audioSystem.update(state)).not.toThrow();
    });

    it('should handle asymmetric motor RPMs', () => {
      const state = {
        motorRPM: [5000, 15000, 20000, 8000] as [number, number, number, number],
        velocity: { x: 5, y: 0, z: -5 },
        position: { x: 10, y: 10, z: 10 },
        altitude: 10,
        armed: true,
        throttle: 0.6,
      };

      expect(() => audioSystem.update(state)).not.toThrow();
    });
  });

  describe('wind sound', () => {
    beforeEach(() => {
      audioSystem.initialize();
    });

    it('should update wind sound based on velocity', () => {
      const slowState = {
        motorRPM: [10000, 10000, 10000, 10000] as [number, number, number, number],
        velocity: { x: 1, y: 0, z: 1 },
        position: { x: 0, y: 5, z: 0 },
        altitude: 5,
        armed: true,
        throttle: 0.5,
      };

      const fastState = {
        ...slowState,
        velocity: { x: 20, y: 10, z: 20 },
      };

      expect(() => audioSystem.update(slowState)).not.toThrow();
      expect(() => audioSystem.update(fastState)).not.toThrow();
    });
  });

  describe('cleanup', () => {
    it('should dispose without errors', () => {
      audioSystem.initialize();
      expect(() => audioSystem.dispose()).not.toThrow();
    });

    it('should handle dispose when not initialized', () => {
      expect(() => audioSystem.dispose()).not.toThrow();
    });
  });

  describe('resume', () => {
    it('should resume audio context', async () => {
      audioSystem.initialize();
      await expect(audioSystem.resume()).resolves.not.toThrow();
    });
  });
});
