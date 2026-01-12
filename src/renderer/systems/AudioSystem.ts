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

export interface MotorSoundProfile {
  baseFrequency: number;
  maxFrequency: number;
  oscillatorType: OscillatorType;
  filterQ: number;
  noiseLevel: number;
  harmonics: number[];
}

export const MOTOR_SOUND_PROFILES: Record<string, MotorSoundProfile> = {
  BEGINNER: {
    baseFrequency: 80,
    maxFrequency: 600,
    oscillatorType: 'sine',
    filterQ: 0.5,
    noiseLevel: 0.03,
    harmonics: [1, 0.3],
  },
  INTERMEDIATE: {
    baseFrequency: 100,
    maxFrequency: 700,
    oscillatorType: 'sawtooth',
    filterQ: 1,
    noiseLevel: 0.05,
    harmonics: [1, 0.4, 0.2],
  },
  RACING: {
    baseFrequency: 120,
    maxFrequency: 900,
    oscillatorType: 'sawtooth',
    filterQ: 2,
    noiseLevel: 0.08,
    harmonics: [1, 0.5, 0.3, 0.1],
  },
  FREESTYLE: {
    baseFrequency: 100,
    maxFrequency: 800,
    oscillatorType: 'sawtooth',
    filterQ: 1.5,
    noiseLevel: 0.06,
    harmonics: [1, 0.45, 0.25],
  },
};

export class AudioSystem {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private effectsGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  // Motor sound nodes
  private motorOscillators: OscillatorNode[] = [];
  private motorGains: GainNode[] = [];
  private motorFilters: BiquadFilterNode[] = [];
  private harmonicOscillators: OscillatorNode[][] = [];

  // Current sound profile
  private currentProfile: MotorSoundProfile = MOTOR_SOUND_PROFILES.BEGINNER;

  // Spatial audio state
  private listenerPosition = { x: 0, y: 5, z: 10 }; // Default camera position

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
   * Initialize procedural motor sounds with profile-based synthesis
   */
  private initializeMotorSounds(): void {
    if (!this.context || !this.effectsGain) return;

    const profile = this.currentProfile;

    // Create 4 motor sound sources (one per motor)
    for (let i = 0; i < 4; i++) {
      // Create main oscillator for base frequency
      const osc = this.context.createOscillator();
      osc.type = profile.oscillatorType;
      osc.frequency.value = profile.baseFrequency;

      // Create filter for motor character
      const filter = this.context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2000;
      filter.Q.value = profile.filterQ;

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

      // Create harmonic oscillators for richer sound
      const harmonics: OscillatorNode[] = [];
      for (let h = 1; h < profile.harmonics.length; h++) {
        const harmOsc = this.context.createOscillator();
        harmOsc.type = profile.oscillatorType;
        harmOsc.frequency.value = profile.baseFrequency * (h + 1);

        const harmGain = this.context.createGain();
        harmGain.gain.value = 0;

        harmOsc.connect(harmGain);
        harmGain.connect(filter);
        harmOsc.start();

        harmonics.push(harmOsc);
      }
      this.harmonicOscillators.push(harmonics);
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

    // Generate low battery warning
    this.effectBuffers.set('lowBattery', this.generateLowBatteryWarning());
  }

  /**
   * Generate low battery warning beeps
   */
  private generateLowBatteryWarning(): AudioBuffer {
    if (!this.context) throw new Error('Audio context not initialized');

    const sampleRate = this.context.sampleRate;
    const duration = 0.6;
    const length = sampleRate * duration;
    const buffer = this.context.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // Three quick beeps
    const beepDuration = 0.08;
    const beepGap = 0.12;
    const frequency = 1200;

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      for (let beep = 0; beep < 3; beep++) {
        const beepStart = beep * beepGap;
        const beepEnd = beepStart + beepDuration;

        if (t >= beepStart && t < beepEnd) {
          const beepT = t - beepStart;
          const envelope = Math.sin((beepT / beepDuration) * Math.PI);
          sample = Math.sin(2 * Math.PI * frequency * beepT) * envelope * 0.4;
        }
      }

      data[i] = sample;
    }

    return buffer;
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
   * Update motor sounds based on RPM with Doppler effect
   */
  updateMotorSounds(
    motorRPMs: [number, number, number, number],
    dronePosition?: { x: number; y: number; z: number },
    droneVelocity?: { x: number; y: number; z: number }
  ): void {
    if (!this.isInitialized || this.isMuted) return;

    const profile = this.currentProfile;
    const currentTime = this.context?.currentTime ?? 0;

    // Calculate Doppler shift if position/velocity provided
    let dopplerFactor = 1;
    if (dronePosition && droneVelocity) {
      dopplerFactor = this.calculateDopplerFactor(dronePosition, droneVelocity);
    }

    for (let i = 0; i < 4; i++) {
      const rpm = motorRPMs[i];
      const normalizedRPM = rpm / 25000; // Normalize to 0-1

      // Calculate base frequency from profile with Doppler shift
      const freqRange = profile.maxFrequency - profile.baseFrequency;
      const baseFreq = (profile.baseFrequency + normalizedRPM * freqRange) * dopplerFactor;

      this.motorOscillators[i]?.frequency.setTargetAtTime(
        baseFreq,
        currentTime,
        0.01
      );

      // Update harmonic frequencies
      const harmonics = this.harmonicOscillators[i];
      if (harmonics) {
        for (let h = 0; h < harmonics.length; h++) {
          const harmFreq = baseFreq * (h + 2);
          harmonics[h]?.frequency.setTargetAtTime(harmFreq, currentTime, 0.01);
        }
      }

      // Update filter (opens up with higher RPM)
      this.motorFilters[i]?.frequency.setTargetAtTime(
        500 + normalizedRPM * 3000,
        currentTime,
        0.01
      );

      // Update volume (louder with higher RPM, distance attenuation)
      let volume = normalizedRPM * 0.15;
      if (dronePosition) {
        const distance = this.calculateDistance(dronePosition);
        // Simple distance attenuation (1/distance^2, clamped)
        const attenuation = Math.min(1, 100 / (distance * distance + 10));
        volume *= attenuation;
      }

      this.motorGains[i]?.gain.setTargetAtTime(
        volume,
        currentTime,
        0.01
      );
    }
  }

  /**
   * Calculate Doppler shift factor based on relative velocity
   */
  private calculateDopplerFactor(
    dronePosition: { x: number; y: number; z: number },
    droneVelocity: { x: number; y: number; z: number }
  ): number {
    const speedOfSound = 343; // m/s

    // Direction from drone to listener
    const dx = this.listenerPosition.x - dronePosition.x;
    const dy = this.listenerPosition.y - dronePosition.y;
    const dz = this.listenerPosition.z - dronePosition.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (distance < 0.1) return 1;

    // Normalize direction
    const nx = dx / distance;
    const ny = dy / distance;
    const nz = dz / distance;

    // Radial velocity (positive = moving towards listener)
    const radialVelocity = -(droneVelocity.x * nx + droneVelocity.y * ny + droneVelocity.z * nz);

    // Doppler factor: f' = f * (c / (c - v_radial))
    // Clamped to prevent extreme values
    const factor = speedOfSound / (speedOfSound - Math.max(-100, Math.min(100, radialVelocity)));
    return Math.max(0.5, Math.min(2, factor));
  }

  /**
   * Calculate distance from drone to listener
   */
  private calculateDistance(dronePosition: { x: number; y: number; z: number }): number {
    const dx = this.listenerPosition.x - dronePosition.x;
    const dy = this.listenerPosition.y - dronePosition.y;
    const dz = this.listenerPosition.z - dronePosition.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Update listener position (camera position)
   */
  setListenerPosition(position: { x: number; y: number; z: number }): void {
    this.listenerPosition = { ...position };
  }

  /**
   * Set drone sound profile
   */
  setDroneProfile(presetId: string): void {
    const profile = MOTOR_SOUND_PROFILES[presetId];
    if (profile) {
      this.currentProfile = profile;
      // Update oscillator types if already initialized
      if (this.isInitialized) {
        for (let i = 0; i < this.motorOscillators.length; i++) {
          this.motorOscillators[i].type = profile.oscillatorType;
          this.motorFilters[i].Q.value = profile.filterQ;
        }
      }
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
    this.harmonicOscillators.forEach((harmonics) => {
      harmonics.forEach((osc) => osc.stop());
    });
    void this.context?.close();
    this.isInitialized = false;
  }

  /**
   * Get current profile name for display
   */
  getCurrentProfileName(): string {
    for (const [name, profile] of Object.entries(MOTOR_SOUND_PROFILES)) {
      if (profile === this.currentProfile) return name;
    }
    return 'UNKNOWN';
  }
}

// Singleton instance
export const audioSystem = new AudioSystem();
