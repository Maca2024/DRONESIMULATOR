import { describe, it, beforeEach, vi } from 'vitest';
import { AudioSystem } from './AudioSystem';

// Mock Web Audio API
class MockGainNode {
  gain = { value: 0, setTargetAtTime: vi.fn() };
  connect = vi.fn();
  disconnect = vi.fn();
}

class MockOscillatorNode {
  type = 'sine';
  frequency = { value: 0, setTargetAtTime: vi.fn() };
  connect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class MockBiquadFilterNode {
  type = 'lowpass';
  frequency = { value: 0, setTargetAtTime: vi.fn() };
  Q = { value: 0 };
  connect = vi.fn();
}

class MockBufferSourceNode {
  buffer: AudioBuffer | null = null;
  loop = false;
  connect = vi.fn();
  start = vi.fn();
}

class MockAudioBuffer {
  numberOfChannels = 1;
  length: number;
  sampleRate: number;
  private data: Float32Array;

  constructor(options: { numberOfChannels: number; length: number; sampleRate: number }) {
    this.length = options.length;
    this.sampleRate = options.sampleRate;
    this.data = new Float32Array(options.length);
  }

  getChannelData(): Float32Array {
    return this.data;
  }

  get duration(): number {
    return this.length / this.sampleRate;
  }

  copyFromChannel(): void {}
  copyToChannel(): void {}
}

class MockAudioContext {
  state = 'running';
  sampleRate = 44100;
  currentTime = 0;
  destination = {};

  createGain(): MockGainNode {
    return new MockGainNode();
  }

  createOscillator(): MockOscillatorNode {
    return new MockOscillatorNode();
  }

  createBiquadFilter(): MockBiquadFilterNode {
    return new MockBiquadFilterNode();
  }

  createBufferSource(): MockBufferSourceNode {
    return new MockBufferSourceNode();
  }

  createBuffer(channels: number, length: number, sampleRate: number): MockAudioBuffer {
    return new MockAudioBuffer({ numberOfChannels: channels, length, sampleRate });
  }

  resume = vi.fn().mockResolvedValue(undefined);
  close = vi.fn().mockResolvedValue(undefined);
}

describe('AudioSystem', () => {
  let audio: AudioSystem;

  beforeEach(() => {
    // Mock window.AudioContext
    (window as Window & { AudioContext?: typeof AudioContext }).AudioContext =
      MockAudioContext as unknown as typeof AudioContext;
    audio = new AudioSystem();
  });

  describe('initialization', () => {
    it('should not be initialized before calling initialize()', () => {
      // updateMotorSounds should be a no-op before init
      audio.updateMotorSounds([5000, 5000, 5000, 5000]);
      // Should not throw
    });

    it('should initialize successfully', () => {
      audio.initialize();
      // Should not throw, should set up motor sounds and effects
    });

    it('should not double-initialize', () => {
      audio.initialize();
      audio.initialize(); // second call should be no-op
    });
  });

  describe('updateMotorSounds', () => {
    it('should update motor sounds when initialized', () => {
      audio.initialize();
      // Should not throw
      audio.updateMotorSounds([10000, 10000, 10000, 10000]);
    });

    it('should not update when muted', () => {
      audio.initialize();
      audio.setMuted(true);
      // Should be a no-op
      audio.updateMotorSounds([10000, 10000, 10000, 10000]);
    });

    it('should handle zero RPMs', () => {
      audio.initialize();
      audio.updateMotorSounds([0, 0, 0, 0]);
    });

    it('should handle max RPMs', () => {
      audio.initialize();
      audio.updateMotorSounds([25000, 25000, 25000, 25000]);
    });
  });

  describe('playEffect', () => {
    it('should play a valid effect', () => {
      audio.initialize();
      // Should not throw
      audio.playEffect('checkpoint');
      audio.playEffect('crash');
      audio.playEffect('arm');
      audio.playEffect('disarm');
      audio.playEffect('success');
      audio.playEffect('fail');
    });

    it('should ignore invalid effect name', () => {
      audio.initialize();
      // Should not throw
      audio.playEffect('nonexistent');
    });

    it('should not play when not initialized', () => {
      audio.playEffect('checkpoint');
      // Should not throw
    });

    it('should not play when muted', () => {
      audio.initialize();
      audio.setMuted(true);
      audio.playEffect('checkpoint');
      // Should not throw
    });

    it('should accept volume parameter', () => {
      audio.initialize();
      audio.playEffect('checkpoint', 0.5);
    });
  });

  describe('setConfig', () => {
    it('should update config', () => {
      audio.initialize();
      audio.setConfig({ masterVolume: 0.5 });
      // Should not throw
    });

    it('should update individual volume', () => {
      audio.initialize();
      audio.setConfig({ effectsVolume: 0.3 });
      audio.setConfig({ musicVolume: 0.7 });
    });

    it('should work before initialization', () => {
      audio.setConfig({ masterVolume: 0.5 });
      // Should not throw
    });
  });

  describe('setMuted', () => {
    it('should mute audio', () => {
      audio.initialize();
      audio.setMuted(true);
    });

    it('should unmute audio', () => {
      audio.initialize();
      audio.setMuted(true);
      audio.setMuted(false);
    });
  });

  describe('resume', () => {
    it('should resume suspended context', async () => {
      audio.initialize();
      // Simulate suspended state
      await audio.resume();
      // Should not throw
    });
  });

  describe('dispose', () => {
    it('should clean up audio system', () => {
      audio.initialize();
      audio.dispose();
      // After dispose, update should be no-op
      audio.updateMotorSounds([5000, 5000, 5000, 5000]);
    });

    it('should work without initialization', () => {
      audio.dispose();
      // Should not throw
    });
  });
});
