/**
 * AudioSystem - Drone motor sounds and game audio
 *
 * Uses Web Audio API for:
 * - Procedural motor sound synthesis
 * - Spatial audio positioning
 * - Sound effects
 * - Background music
 */

export interface AudioConfig {
  masterVolume: number;
  effectsVolume: number;
  musicVolume: number;
  spatialAudio: boolean;
  monoAudio: boolean;
}

export class AudioSystem {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private effectsGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  // Motor sound nodes
  private motorOscillators: OscillatorNode[] = [];
  private motorGains: GainNode[] = [];
  private motorFilters: BiquadFilterNode[] = [];

  // Effect sounds
  private effectBuffers: Map<string, AudioBuffer> = new Map();

  private config: AudioConfig = {
    masterVolume: 0.8,
    effectsVolume: 0.8,
    musicVolume: 0.5,
    spatialAudio: true,
    monoAudio: false,
  };

  private isInitialized = false;
  private isMuted = false;

  /**
   * Initialize audio system (must be called after user interaction)
   */
  initialize(): void {
    if (this.isInitialized) return;

    try {
      this.context = new (window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();

      // Create gain nodes
      this.masterGain = this.context.createGain();
      this.masterGain.connect(this.context.destination);
      this.masterGain.gain.value = this.config.masterVolume;

      this.effectsGain = this.context.createGain();
      this.effectsGain.connect(this.masterGain);
      this.effectsGain.gain.value = this.config.effectsVolume;

      this.musicGain = this.context.createGain();
      this.musicGain.connect(this.masterGain);
      this.musicGain.gain.value = this.config.musicVolume;

      // Initialize motor sounds
      this.initializeMotorSounds();

      // Generate procedural sound effects
      this.generateSoundEffects();

      this.isInitialized = true;
      console.info('Audio system initialized');
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }

  /**
   * Initialize procedural motor sounds
   */
  private initializeMotorSounds(): void {
    if (!this.context || !this.effectsGain) return;

    // Create 4 motor sound sources (one per motor)
    for (let i = 0; i < 4; i++) {
      // Create oscillator for base frequency
      const osc = this.context.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 100; // Base frequency

      // Create filter for motor character
      const filter = this.context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2000;
      filter.Q.value = 1;

      // Create gain for individual motor volume
      const gain = this.context.createGain();
      gain.gain.value = 0;

      // Connect: osc -> filter -> gain -> effects
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.effectsGain);

      osc.start();

      this.motorOscillators.push(osc);
      this.motorFilters.push(filter);
      this.motorGains.push(gain);
    }

    // Add noise for motor texture
    this.addMotorNoise();
  }

  /**
   * Add noise component to motor sound
   */
  private addMotorNoise(): void {
    if (!this.context || !this.effectsGain) return;

    // Create noise buffer
    const bufferSize = this.context.sampleRate * 2;
    const noiseBuffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    // Create noise source
    const noise = this.context.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    // Filter the noise
    const noiseFilter = this.context.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 500;
    noiseFilter.Q.value = 2;

    // Gain for noise
    const noiseGain = this.context.createGain();
    noiseGain.gain.value = 0.05;

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.effectsGain);

    noise.start();
  }

  /**
   * Generate procedural sound effects
   */
  private generateSoundEffects(): void {
    if (!this.context) return;

    // Generate checkpoint sound
    this.effectBuffers.set('checkpoint', this.generateTone(880, 0.1, 'sine'));

    // Generate crash sound
    this.effectBuffers.set('crash', this.generateNoiseBurst(0.3));

    // Generate arm sound
    this.effectBuffers.set('arm', this.generateTone(440, 0.15, 'square'));

    // Generate disarm sound
    this.effectBuffers.set('disarm', this.generateTone(220, 0.2, 'square'));

    // Generate success sound
    this.effectBuffers.set('success', this.generateSuccessJingle());

    // Generate fail sound
    this.effectBuffers.set('fail', this.generateFailSound());
  }

  /**
   * Generate a simple tone
   */
  private generateTone(
    frequency: number,
    duration: number,
    type: OscillatorType
  ): AudioBuffer {
    if (!this.context) throw new Error('Audio context not initialized');

    const sampleRate = this.context.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.context.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      switch (type) {
        case 'sine':
          sample = Math.sin(2 * Math.PI * frequency * t);
          break;
        case 'square':
          sample = Math.sign(Math.sin(2 * Math.PI * frequency * t));
          break;
        case 'sawtooth':
          sample = 2 * ((frequency * t) % 1) - 1;
          break;
        case 'triangle':
          sample = Math.abs(4 * ((frequency * t) % 1) - 2) - 1;
          break;
      }

      // Apply envelope
      const envelope = Math.exp(-3 * t / duration);
      data[i] = sample * envelope * 0.5;
    }

    return buffer;
  }

  /**
   * Generate noise burst for crash
   */
  private generateNoiseBurst(duration: number): AudioBuffer {
    if (!this.context) throw new Error('Audio context not initialized');

    const sampleRate = this.context.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.context.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-5 * t / duration);
      data[i] = (Math.random() * 2 - 1) * envelope;
    }

    return buffer;
  }

  /**
   * Generate success jingle
   */
  private generateSuccessJingle(): AudioBuffer {
    if (!this.context) throw new Error('Audio context not initialized');

    const sampleRate = this.context.sampleRate;
    const duration = 0.5;
    const length = sampleRate * duration;
    const buffer = this.context.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      for (let n = 0; n < notes.length; n++) {
        const noteStart = n * 0.1;
        if (t >= noteStart) {
          const noteT = t - noteStart;
          const envelope = Math.exp(-4 * noteT);
          sample += Math.sin(2 * Math.PI * notes[n] * noteT) * envelope * 0.3;
        }
      }

      data[i] = sample;
    }

    return buffer;
  }

  /**
   * Generate fail sound
   */
  private generateFailSound(): AudioBuffer {
    if (!this.context) throw new Error('Audio context not initialized');

    const sampleRate = this.context.sampleRate;
    const duration = 0.4;
    const length = sampleRate * duration;
    const buffer = this.context.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const freq = 300 - 150 * (t / duration); // Descending pitch
      const envelope = Math.exp(-3 * t / duration);
      data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.5;
    }

    return buffer;
  }

  /**
   * Update motor sounds based on RPM
   */
  updateMotorSounds(motorRPMs: [number, number, number, number]): void {
    if (!this.isInitialized || this.isMuted) return;

    for (let i = 0; i < 4; i++) {
      const rpm = motorRPMs[i];
      const normalizedRPM = rpm / 25000; // Normalize to 0-1

      // Update frequency (100Hz - 800Hz based on RPM)
      const freq = 100 + normalizedRPM * 700;
      this.motorOscillators[i]?.frequency.setTargetAtTime(
        freq,
        this.context?.currentTime ?? 0,
        0.01
      );

      // Update filter (opens up with higher RPM)
      this.motorFilters[i]?.frequency.setTargetAtTime(
        500 + normalizedRPM * 3000,
        this.context?.currentTime ?? 0,
        0.01
      );

      // Update volume (louder with higher RPM)
      const volume = normalizedRPM * 0.15;
      this.motorGains[i]?.gain.setTargetAtTime(
        volume,
        this.context?.currentTime ?? 0,
        0.01
      );
    }
  }

  /**
   * Play a sound effect
   */
  playEffect(name: string, volume = 1): void {
    if (!this.isInitialized || !this.context || !this.effectsGain || this.isMuted) return;

    const buffer = this.effectBuffers.get(name);
    if (!buffer) return;

    const source = this.context.createBufferSource();
    source.buffer = buffer;

    const gain = this.context.createGain();
    gain.gain.value = volume;

    source.connect(gain);
    gain.connect(this.effectsGain);

    source.start();
  }

  /**
   * Update configuration
   */
  setConfig(newConfig: Partial<AudioConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (this.masterGain) {
      this.masterGain.gain.value = this.config.masterVolume;
    }
    if (this.effectsGain) {
      this.effectsGain.gain.value = this.config.effectsVolume;
    }
    if (this.musicGain) {
      this.musicGain.gain.value = this.config.musicVolume;
    }
  }

  /**
   * Mute/unmute all audio
   */
  setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : this.config.masterVolume;
    }
  }

  /**
   * Resume audio context (required after user interaction)
   */
  async resume(): Promise<void> {
    if (this.context?.state === 'suspended') {
      await this.context.resume();
    }
  }

  /**
   * Cleanup audio system
   */
  dispose(): void {
    this.motorOscillators.forEach((osc) => osc.stop());
    void this.context?.close();
    this.isInitialized = false;
  }
}

// Singleton instance
export const audioSystem = new AudioSystem();
