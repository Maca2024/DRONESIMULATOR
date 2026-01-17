import * as THREE from 'three';

interface AudioState {
  motorRPM: [number, number, number, number];
  velocity: THREE.Vector3;
  altitude: number;
  armed: boolean;
  position: THREE.Vector3;
  collisionIntensity?: number;
}

export class EnhancedAudioSystem {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  // Motor sounds
  private motorOscillators: OscillatorNode[] = [];
  private motorGains: GainNode[] = [];
  private motorFilters: BiquadFilterNode[] = [];

  // Wind sound
  private windNoise: AudioBufferSourceNode | null = null;
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;

  // Ambient sounds
  private ambientGain: GainNode | null = null;
  private ambientSource: AudioBufferSourceNode | null = null;

  // Warning beeps
  private warningOscillator: OscillatorNode | null = null;
  private warningGain: GainNode | null = null;

  private isInitialized = false;
  private volume = 0.5;

  // Listener for 3D spatial audio (reserved for future use)

  initialize(): void {
    if (this.isInitialized) return;

    try {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

      // Master gain
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.audioContext.destination);

      // Initialize motor sounds (4 motors with different frequencies)
      for (let i = 0; i < 4; i++) {
        const oscillator = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        oscillator.type = 'sawtooth';
        oscillator.frequency.value = 100;

        filter.type = 'lowpass';
        filter.frequency.value = 800;
        filter.Q.value = 2;

        gain.gain.value = 0;

        oscillator.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        oscillator.start();

        this.motorOscillators.push(oscillator);
        this.motorGains.push(gain);
        this.motorFilters.push(filter);
      }

      // Initialize wind sound
      this.initializeWindSound();

      // Initialize ambient sound
      this.initializeAmbientSound();

      // Initialize warning system
      this.initializeWarningSystem();

      this.isInitialized = true;
    } catch (error) {
      console.warn('Enhanced audio system initialization failed:', error);
    }
  }

  private initializeWindSound(): void {
    if (!this.audioContext || !this.masterGain) return;

    // Create wind noise using noise buffer
    const bufferSize = this.audioContext.sampleRate * 2;
    const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = noiseBuffer.getChannelData(0);

    // Generate pink-ish noise for wind
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    this.windGain = this.audioContext.createGain();
    this.windGain.gain.value = 0;
    this.windGain.connect(this.masterGain);

    this.windFilter = this.audioContext.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.value = 500;
    this.windFilter.Q.value = 0.5;
    this.windFilter.connect(this.windGain);

    this.windNoise = this.audioContext.createBufferSource();
    this.windNoise.buffer = noiseBuffer;
    this.windNoise.loop = true;
    this.windNoise.connect(this.windFilter);
    this.windNoise.start();
  }

  private initializeAmbientSound(): void {
    if (!this.audioContext || !this.masterGain) return;

    // Create ambient nature sound (birds, etc.)
    const bufferSize = this.audioContext.sampleRate * 5;
    const ambientBuffer = this.audioContext.createBuffer(2, bufferSize, this.audioContext.sampleRate);

    // Generate subtle ambient texture
    for (let channel = 0; channel < 2; channel++) {
      const data = ambientBuffer.getChannelData(channel);
      for (let i = 0; i < bufferSize; i++) {
        // Very subtle background ambience
        const t = i / this.audioContext.sampleRate;
        data[i] = (Math.sin(t * 200) * 0.01 + Math.random() * 0.02 - 0.01) *
                  (0.5 + 0.5 * Math.sin(t * 0.5));
      }
    }

    this.ambientGain = this.audioContext.createGain();
    this.ambientGain.gain.value = 0.1;
    this.ambientGain.connect(this.masterGain);

    this.ambientSource = this.audioContext.createBufferSource();
    this.ambientSource.buffer = ambientBuffer;
    this.ambientSource.loop = true;
    this.ambientSource.connect(this.ambientGain);
    this.ambientSource.start();
  }

  private initializeWarningSystem(): void {
    if (!this.audioContext || !this.masterGain) return;

    this.warningOscillator = this.audioContext.createOscillator();
    this.warningGain = this.audioContext.createGain();

    this.warningOscillator.type = 'square';
    this.warningOscillator.frequency.value = 880;
    this.warningGain.gain.value = 0;

    this.warningOscillator.connect(this.warningGain);
    this.warningGain.connect(this.masterGain);
    this.warningOscillator.start();
  }

  update(state: AudioState): void {
    if (!this.isInitialized || !this.audioContext) return;

    const { motorRPM, velocity, altitude, armed, collisionIntensity } = state;

    // Update motor sounds
    this.updateMotorSounds(motorRPM, armed);

    // Update wind sound based on velocity
    this.updateWindSound(velocity);

    // Update warning sounds
    this.updateWarnings(altitude, armed);

    // Handle collision sound
    if (collisionIntensity && collisionIntensity > 0.1) {
      this.playCollisionSound(collisionIntensity);
    }
  }

  private updateMotorSounds(motorRPM: [number, number, number, number], armed: boolean): void {
    if (!this.audioContext) return;

    const baseFrequency = 80;
    const maxRPM = 8000;

    for (let i = 0; i < 4; i++) {
      const rpm = motorRPM[i];
      const normalizedRPM = rpm / maxRPM;

      // Frequency increases with RPM
      const frequency = baseFrequency + normalizedRPM * 400;
      this.motorOscillators[i].frequency.setTargetAtTime(
        frequency,
        this.audioContext.currentTime,
        0.05
      );

      // Volume based on RPM and armed state
      const targetGain = armed ? normalizedRPM * 0.15 : 0;
      this.motorGains[i].gain.setTargetAtTime(
        targetGain,
        this.audioContext.currentTime,
        0.02
      );

      // Filter opens with higher RPM for more harmonics
      const filterFreq = 400 + normalizedRPM * 1600;
      this.motorFilters[i].frequency.setTargetAtTime(
        filterFreq,
        this.audioContext.currentTime,
        0.1
      );
    }
  }

  private updateWindSound(velocity: THREE.Vector3): void {
    if (!this.audioContext || !this.windGain || !this.windFilter) return;

    const speed = velocity.length();
    const maxSpeed = 30;
    const normalizedSpeed = Math.min(speed / maxSpeed, 1);

    // Wind volume increases with speed
    this.windGain.gain.setTargetAtTime(
      normalizedSpeed * 0.3,
      this.audioContext.currentTime,
      0.1
    );

    // Wind frequency increases with speed
    this.windFilter.frequency.setTargetAtTime(
      300 + normalizedSpeed * 1200,
      this.audioContext.currentTime,
      0.1
    );
  }

  private updateWarnings(altitude: number, armed: boolean): void {
    if (!this.audioContext || !this.warningGain) return;

    // Low altitude warning
    if (armed && altitude < 1 && altitude > 0.1) {
      const beepRate = Math.max(2, 10 - altitude * 8);
      const shouldBeep = Math.sin(this.audioContext.currentTime * beepRate * Math.PI * 2) > 0;
      this.warningGain.gain.setTargetAtTime(
        shouldBeep ? 0.1 : 0,
        this.audioContext.currentTime,
        0.01
      );
    } else {
      this.warningGain.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.05);
    }
  }

  private playCollisionSound(intensity: number): void {
    if (!this.audioContext || !this.masterGain) return;

    // Create impact sound
    const impactOsc = this.audioContext.createOscillator();
    const impactGain = this.audioContext.createGain();
    const impactFilter = this.audioContext.createBiquadFilter();

    impactOsc.type = 'sawtooth';
    impactOsc.frequency.value = 100 + Math.random() * 50;

    impactFilter.type = 'lowpass';
    impactFilter.frequency.value = 200;

    impactGain.gain.value = intensity * 0.5;
    impactGain.gain.exponentialRampToValueAtTime(
      0.001,
      this.audioContext.currentTime + 0.3
    );

    impactOsc.connect(impactFilter);
    impactFilter.connect(impactGain);
    impactGain.connect(this.masterGain);

    impactOsc.start();
    impactOsc.stop(this.audioContext.currentTime + 0.3);
  }

  playArmSound(): void {
    if (!this.audioContext || !this.masterGain) return;

    // Play arming beep sequence
    const times = [0, 0.1, 0.2];
    const frequencies = [440, 550, 660];

    times.forEach((time, i) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();

      osc.type = 'sine';
      osc.frequency.value = frequencies[i];

      gain.gain.value = 0.2;
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        this.audioContext!.currentTime + time + 0.08
      );

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(this.audioContext!.currentTime + time);
      osc.stop(this.audioContext!.currentTime + time + 0.08);
    });
  }

  playDisarmSound(): void {
    if (!this.audioContext || !this.masterGain) return;

    // Play disarming beep sequence (descending)
    const times = [0, 0.1, 0.2];
    const frequencies = [660, 550, 440];

    times.forEach((time, i) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();

      osc.type = 'sine';
      osc.frequency.value = frequencies[i];

      gain.gain.value = 0.15;
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        this.audioContext!.currentTime + time + 0.08
      );

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(this.audioContext!.currentTime + time);
      osc.stop(this.audioContext!.currentTime + time + 0.08);
    });
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.setTargetAtTime(
        this.volume,
        this.audioContext.currentTime,
        0.1
      );
    }
  }

  getVolume(): number {
    return this.volume;
  }

  suspend(): void {
    if (this.audioContext && this.audioContext.state === 'running') {
      void this.audioContext.suspend();
    }
  }

  resume(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      void this.audioContext.resume();
    }
  }

  dispose(): void {
    // Stop and disconnect all nodes
    this.motorOscillators.forEach(osc => {
      osc.stop();
      osc.disconnect();
    });

    this.windNoise?.stop();
    this.windNoise?.disconnect();

    this.ambientSource?.stop();
    this.ambientSource?.disconnect();

    this.warningOscillator?.stop();
    this.warningOscillator?.disconnect();

    void this.audioContext?.close();

    this.motorOscillators = [];
    this.motorGains = [];
    this.motorFilters = [];
    this.isInitialized = false;
  }
}

// Singleton instance
export const enhancedAudioSystem = new EnhancedAudioSystem();
