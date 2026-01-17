/**
 * ProAudioSystem - Professional-grade FPV Drone Audio System
 *
 * Based on best practices from:
 * - Physical modeling synthesis for motor sounds
 * - Multi-layered harmonic oscillators
 * - Doppler effect simulation
 * - Spatial audio positioning
 * - Wind noise based on airspeed
 *
 * References:
 * - Engine Sound Generator by Antonio-R1
 * - Oscar Liang's FPV sound design guides
 * - Web Audio API MDN documentation
 */

import type { Vector3 } from '@shared/types';

export interface ProAudioConfig {
  masterVolume: number;       // 0-1
  motorVolume: number;        // 0-1
  effectsVolume: number;      // 0-1
  windVolume: number;         // 0-1
  spatialAudio: boolean;
  dopplerEnabled: boolean;
  reverbEnabled: boolean;
}

interface MotorAudioNode {
  // Fundamental frequency oscillator
  fundamental: OscillatorNode;
  fundamentalGain: GainNode;

  // Harmonics (2nd, 3rd, 4th)
  harmonics: OscillatorNode[];
  harmonicGains: GainNode[];

  // Motor body resonance (low frequency rumble)
  bodyResonance: OscillatorNode;
  bodyGain: GainNode;

  // Propeller air noise
  propNoise: AudioBufferSourceNode | null;
  propNoiseGain: GainNode;
  propNoiseFilter: BiquadFilterNode;

  // Master filter and gain for this motor
  masterFilter: BiquadFilterNode;
  masterGain: GainNode;

  // Panner for spatial positioning
  panner: StereoPannerNode;
}

interface DroneAudioState {
  motorRPM: [number, number, number, number];
  velocity: Vector3;
  position: Vector3;
  altitude: number;
  armed: boolean;
  throttle: number;
}

// Motor positions relative to drone center (X config)
const MOTOR_POSITIONS = [
  { x: -1, z: -1 },  // Front-left (Motor 1)
  { x: 1, z: -1 },   // Front-right (Motor 2)
  { x: 1, z: 1 },    // Back-right (Motor 3)
  { x: -1, z: 1 },   // Back-left (Motor 4)
];

// Audio constants
const MIN_MOTOR_FREQ = 80;      // Hz at idle
const MAX_MOTOR_FREQ = 600;     // Hz at max RPM
const MAX_RPM = 25000;
const HARMONIC_RATIOS = [2, 3, 4];  // 2nd, 3rd, 4th harmonics
const HARMONIC_GAINS = [0.5, 0.25, 0.125];  // Decreasing amplitude

export class ProAudioSystem {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private motorMixGain: GainNode | null = null;
  private effectsGain: GainNode | null = null;

  // Motor audio nodes (one per motor)
  private motors: MotorAudioNode[] = [];

  // Wind/airspeed sound
  private windNoise: AudioBufferSourceNode | null = null;
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;

  // Low frequency drone rumble
  private droneRumble: OscillatorNode | null = null;
  private rumbleGain: GainNode | null = null;

  // Reverb for spatial depth
  private convolver: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;

  // Compressor for dynamics
  private compressor: DynamicsCompressorNode | null = null;

  // Limiter to prevent clipping
  private limiter: DynamicsCompressorNode | null = null;

  // Warmth filter (subtle low-pass for smoother sound)
  private warmthFilter: BiquadFilterNode | null = null;

  // Effect buffers
  private effectBuffers: Map<string, AudioBuffer> = new Map();

  // Background music
  private musicGain: GainNode | null = null;
  private musicOscillators: OscillatorNode[] = [];
  private musicPlaying = false;
  private musicInterval: ReturnType<typeof setInterval> | null = null;

  // State
  private isInitialized = false;
  private isMuted = false;
  private lastState: DroneAudioState | null = null;
  private audioResumed = false;

  private config: ProAudioConfig = {
    masterVolume: 0.7,
    motorVolume: 0.8,
    effectsVolume: 0.9,
    windVolume: 0.6,
    spatialAudio: true,
    dopplerEnabled: true,
    reverbEnabled: true,
  };

  /**
   * Initialize the professional audio system
   */
  initialize(): void {
    if (this.isInitialized) return;

    try {
      // Create audio context
      this.context = new (window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();

      // === MASTER CHAIN ===
      // Signal flow: motors -> compressor -> warmth -> limiter -> master -> destination

      // Master gain (final volume control)
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = this.config.masterVolume;
      this.masterGain.connect(this.context.destination);

      // Limiter to prevent clipping (brick-wall limiting)
      this.limiter = this.context.createDynamicsCompressor();
      this.limiter.threshold.value = -3;   // Catch peaks
      this.limiter.knee.value = 0;         // Hard knee
      this.limiter.ratio.value = 20;       // Near-infinite ratio
      this.limiter.attack.value = 0.001;   // Fast attack
      this.limiter.release.value = 0.1;    // Quick release
      this.limiter.connect(this.masterGain);

      // Warmth filter (subtle roll-off of harsh highs)
      this.warmthFilter = this.context.createBiquadFilter();
      this.warmthFilter.type = 'lowshelf';
      this.warmthFilter.frequency.value = 300;
      this.warmthFilter.gain.value = 2;    // Boost lows slightly
      this.warmthFilter.connect(this.limiter);

      // High cut for less harshness
      const highCut = this.context.createBiquadFilter();
      highCut.type = 'lowpass';
      highCut.frequency.value = 8000;      // Cut harsh highs
      highCut.Q.value = 0.7;
      highCut.connect(this.warmthFilter);

      // Compressor for better dynamics
      this.compressor = this.context.createDynamicsCompressor();
      this.compressor.threshold.value = -20;
      this.compressor.knee.value = 20;
      this.compressor.ratio.value = 3;
      this.compressor.attack.value = 0.01;
      this.compressor.release.value = 0.2;
      this.compressor.connect(highCut);

      // Motor mix bus
      this.motorMixGain = this.context.createGain();
      this.motorMixGain.gain.value = this.config.motorVolume * 0.6; // Lower base volume
      this.motorMixGain.connect(this.compressor);

      // Effects bus
      this.effectsGain = this.context.createGain();
      this.effectsGain.gain.value = this.config.effectsVolume * 0.8;
      this.effectsGain.connect(this.compressor);

      // Initialize subsystems
      this.initializeMotorSounds();
      this.initializeWindSound();
      this.initializeDroneRumble();
      this.initializeReverb();
      this.generateAllEffects();

      // Setup auto-resume on user interaction
      this.setupAutoResume();

      this.isInitialized = true;
      console.info('ProAudioSystem initialized with multi-layered motor synthesis');
    } catch (error) {
      console.error('Failed to initialize ProAudioSystem:', error);
    }
  }

  /**
   * Setup automatic audio context resume on user interaction
   */
  private setupAutoResume(): void {
    const resumeAudio = (): void => {
      if (this.context && this.context.state === 'suspended' && !this.audioResumed) {
        this.context.resume().then(() => {
          this.audioResumed = true;
          console.info('Audio context resumed');
        }).catch(console.error);
      }
    };

    // Resume on any user interaction
    const events = ['click', 'keydown', 'touchstart', 'mousedown'];
    events.forEach(event => {
      window.addEventListener(event, resumeAudio, { once: false, passive: true });
    });
  }

  /**
   * Initialize multi-layered motor sounds for all 4 motors
   */
  private initializeMotorSounds(): void {
    if (!this.context || !this.motorMixGain) return;

    for (let i = 0; i < 4; i++) {
      const motor = this.createMotorAudioNode(i);
      this.motors.push(motor);
    }
  }

  /**
   * Create a complete motor audio node with all layers
   */
  private createMotorAudioNode(motorIndex: number): MotorAudioNode {
    if (!this.context || !this.motorMixGain) {
      throw new Error('Audio context not initialized');
    }

    // Panner for spatial positioning
    const panner = this.context.createStereoPanner();
    const motorPos = MOTOR_POSITIONS[motorIndex];
    panner.pan.value = motorPos.x * 0.3; // Subtle stereo spread
    panner.connect(this.motorMixGain);

    // Master gain for this motor
    const masterGain = this.context.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(panner);

    // Master filter (simulates motor housing resonance)
    const masterFilter = this.context.createBiquadFilter();
    masterFilter.type = 'lowpass';
    masterFilter.frequency.value = 2500;  // Lower cutoff for warmth
    masterFilter.Q.value = 0.5;           // Less resonance
    masterFilter.connect(masterGain);

    // Additional smoothing filter
    const smoothFilter = this.context.createBiquadFilter();
    smoothFilter.type = 'lowpass';
    smoothFilter.frequency.value = 4000;
    smoothFilter.Q.value = 0.3;
    smoothFilter.connect(masterFilter);

    // Fundamental frequency oscillator (main motor tone)
    // Using triangle wave for smoother sound
    const fundamental = this.context.createOscillator();
    fundamental.type = 'triangle';  // Smoother than sawtooth
    fundamental.frequency.value = MIN_MOTOR_FREQ;

    const fundamentalGain = this.context.createGain();
    fundamentalGain.gain.value = 0.25;  // Lower volume
    fundamental.connect(fundamentalGain);
    fundamentalGain.connect(smoothFilter);
    fundamental.start();

    // Harmonic oscillators - use sine waves for smoothness
    const harmonics: OscillatorNode[] = [];
    const harmonicGains: GainNode[] = [];

    for (let h = 0; h < HARMONIC_RATIOS.length; h++) {
      const harmonic = this.context.createOscillator();
      harmonic.type = 'sine';  // Sine waves are smoothest
      harmonic.frequency.value = MIN_MOTOR_FREQ * HARMONIC_RATIOS[h];

      const hGain = this.context.createGain();
      hGain.gain.value = HARMONIC_GAINS[h] * 0.15;  // Lower harmonic volume

      harmonic.connect(hGain);
      hGain.connect(smoothFilter);
      harmonic.start();

      harmonics.push(harmonic);
      harmonicGains.push(hGain);
    }

    // Body resonance (low frequency rumble from motor vibration)
    const bodyResonance = this.context.createOscillator();
    bodyResonance.type = 'sine';
    bodyResonance.frequency.value = 40;

    const bodyGain = this.context.createGain();
    bodyGain.gain.value = 0.15;
    bodyResonance.connect(bodyGain);
    bodyGain.connect(masterFilter);
    bodyResonance.start();

    // Propeller air noise
    const propNoiseFilter = this.context.createBiquadFilter();
    propNoiseFilter.type = 'bandpass';
    propNoiseFilter.frequency.value = 800;
    propNoiseFilter.Q.value = 1.5;

    const propNoiseGain = this.context.createGain();
    propNoiseGain.gain.value = 0.1;
    propNoiseFilter.connect(propNoiseGain);
    propNoiseGain.connect(masterFilter);

    // Create and connect noise buffer
    const propNoise = this.createNoiseSource();
    if (propNoise) {
      propNoise.connect(propNoiseFilter);
    }

    return {
      fundamental,
      fundamentalGain,
      harmonics,
      harmonicGains,
      bodyResonance,
      bodyGain,
      propNoise,
      propNoiseGain,
      propNoiseFilter,
      masterFilter,
      masterGain,
      panner,
    };
  }

  /**
   * Create a looping white noise source
   */
  private createNoiseSource(): AudioBufferSourceNode | null {
    if (!this.context) return null;

    const bufferSize = this.context.sampleRate * 2;
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate pink-ish noise (more natural sounding)
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

    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.start();

    return source;
  }

  /**
   * Initialize wind/airspeed sound
   */
  private initializeWindSound(): void {
    if (!this.context || !this.compressor) return;

    // Wind gain
    this.windGain = this.context.createGain();
    this.windGain.gain.value = 0;
    this.windGain.connect(this.compressor);

    // Wind filter (bandpass for realistic wind)
    this.windFilter = this.context.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.value = 400;
    this.windFilter.Q.value = 0.5;
    this.windFilter.connect(this.windGain);

    // Create wind noise
    const bufferSize = this.context.sampleRate * 3;
    const buffer = this.context.createBuffer(2, bufferSize, this.context.sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      let lastOut = 0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Brown noise for wind (more low frequency content)
        lastOut = (lastOut + (0.02 * white)) / 1.02;
        data[i] = lastOut * 3.5;
      }
    }

    this.windNoise = this.context.createBufferSource();
    this.windNoise.buffer = buffer;
    this.windNoise.loop = true;
    this.windNoise.connect(this.windFilter);
    this.windNoise.start();
  }

  /**
   * Initialize low frequency drone rumble
   */
  private initializeDroneRumble(): void {
    if (!this.context || !this.motorMixGain) return;

    this.rumbleGain = this.context.createGain();
    this.rumbleGain.gain.value = 0;
    this.rumbleGain.connect(this.motorMixGain);

    this.droneRumble = this.context.createOscillator();
    this.droneRumble.type = 'sine';
    this.droneRumble.frequency.value = 25;
    this.droneRumble.connect(this.rumbleGain);
    this.droneRumble.start();
  }

  /**
   * Initialize reverb for spatial depth
   */
  private initializeReverb(): void {
    if (!this.context || !this.masterGain) return;

    this.convolver = this.context.createConvolver();
    this.reverbGain = this.context.createGain();
    this.reverbGain.gain.value = 0.15;

    // Create impulse response for reverb
    const length = this.context.sampleRate * 1.5;
    const impulse = this.context.createBuffer(2, length, this.context.sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const decay = Math.exp(-3 * i / length);
        data[i] = (Math.random() * 2 - 1) * decay;
      }
    }

    this.convolver.buffer = impulse;
    this.convolver.connect(this.reverbGain);
    this.reverbGain.connect(this.masterGain);
  }

  /**
   * Generate all sound effects
   */
  private generateAllEffects(): void {
    if (!this.context) return;

    // Arm sound - ascending beeps
    this.effectBuffers.set('arm', this.generateArmSound());

    // Disarm sound - descending beeps
    this.effectBuffers.set('disarm', this.generateDisarmSound());

    // Checkpoint sound - pleasant chime
    this.effectBuffers.set('checkpoint', this.generateCheckpointSound());

    // Crash sound - impact with debris
    this.effectBuffers.set('crash', this.generateCrashSound());

    // Success sound - triumphant jingle
    this.effectBuffers.set('success', this.generateSuccessSound());

    // Fail sound - sad trombone style
    this.effectBuffers.set('fail', this.generateFailSound());

    // Warning beep
    this.effectBuffers.set('warning', this.generateWarningSound());

    // Low battery warning
    this.effectBuffers.set('lowBattery', this.generateLowBatterySound());

    // Flight mode change
    this.effectBuffers.set('modeChange', this.generateModeChangeSound());
  }

  /**
   * Generate arm sound (3 ascending beeps like real FPV drones)
   */
  private generateArmSound(): AudioBuffer {
    const sampleRate = this.context!.sampleRate;
    const duration = 0.4;
    const buffer = this.context!.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    const frequencies = [440, 554, 659]; // A4, C#5, E5 (A major chord ascending)
    const beepDuration = 0.08;
    const gap = 0.05;

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      for (let b = 0; b < frequencies.length; b++) {
        const beepStart = b * (beepDuration + gap);
        const beepEnd = beepStart + beepDuration;

        if (t >= beepStart && t < beepEnd) {
          const beepT = t - beepStart;
          const envelope = Math.sin(Math.PI * beepT / beepDuration); // Smooth envelope
          sample += Math.sin(2 * Math.PI * frequencies[b] * beepT) * envelope * 0.3;
        }
      }

      data[i] = sample;
    }

    return buffer;
  }

  /**
   * Generate disarm sound (3 descending beeps)
   */
  private generateDisarmSound(): AudioBuffer {
    const sampleRate = this.context!.sampleRate;
    const duration = 0.5;
    const buffer = this.context!.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    const frequencies = [659, 554, 440]; // E5, C#5, A4 (descending)
    const beepDuration = 0.1;
    const gap = 0.06;

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      for (let b = 0; b < frequencies.length; b++) {
        const beepStart = b * (beepDuration + gap);
        const beepEnd = beepStart + beepDuration;

        if (t >= beepStart && t < beepEnd) {
          const beepT = t - beepStart;
          const envelope = Math.sin(Math.PI * beepT / beepDuration);
          sample += Math.sin(2 * Math.PI * frequencies[b] * beepT) * envelope * 0.25;
        }
      }

      data[i] = sample;
    }

    return buffer;
  }

  /**
   * Generate checkpoint sound (pleasant chime)
   */
  private generateCheckpointSound(): AudioBuffer {
    const sampleRate = this.context!.sampleRate;
    const duration = 0.25;
    const buffer = this.context!.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    const freq1 = 1047; // C6
    const freq2 = 1319; // E6

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-6 * t);

      const sample = (
        Math.sin(2 * Math.PI * freq1 * t) * 0.4 +
        Math.sin(2 * Math.PI * freq2 * t) * 0.3 +
        Math.sin(2 * Math.PI * freq1 * 2 * t) * 0.1
      ) * envelope;

      data[i] = sample;
    }

    return buffer;
  }

  /**
   * Generate crash sound (impact with metallic debris)
   */
  private generateCrashSound(): AudioBuffer {
    const sampleRate = this.context!.sampleRate;
    const duration = 0.6;
    const buffer = this.context!.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;

      // Initial impact (loud noise burst)
      const impact = Math.exp(-20 * t) * (Math.random() * 2 - 1);

      // Metallic ring (high frequency sine with decay)
      const metallic = Math.exp(-8 * t) * Math.sin(2 * Math.PI * 2500 * t) * 0.3;

      // Low thud
      const thud = Math.exp(-15 * t) * Math.sin(2 * Math.PI * 80 * t) * 0.5;

      // Debris scatter (delayed noise)
      const debris = t > 0.05 ? Math.exp(-5 * (t - 0.05)) * (Math.random() * 2 - 1) * 0.3 : 0;

      data[i] = (impact + metallic + thud + debris) * 0.7;
    }

    return buffer;
  }

  /**
   * Generate success sound (triumphant fanfare)
   */
  private generateSuccessSound(): AudioBuffer {
    const sampleRate = this.context!.sampleRate;
    const duration = 0.8;
    const buffer = this.context!.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // C major arpeggio + final chord
    const notes = [
      { freq: 523, start: 0, dur: 0.15 },     // C5
      { freq: 659, start: 0.12, dur: 0.15 },  // E5
      { freq: 784, start: 0.24, dur: 0.15 },  // G5
      { freq: 1047, start: 0.36, dur: 0.4 },  // C6 (held)
    ];

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      for (const note of notes) {
        if (t >= note.start && t < note.start + note.dur) {
          const noteT = t - note.start;
          const envelope = Math.sin(Math.PI * noteT / note.dur);
          sample += Math.sin(2 * Math.PI * note.freq * noteT) * envelope * 0.25;
          // Add harmonics
          sample += Math.sin(2 * Math.PI * note.freq * 2 * noteT) * envelope * 0.1;
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
    const sampleRate = this.context!.sampleRate;
    const duration = 0.6;
    const buffer = this.context!.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      // Descending pitch with warble
      const freq = 400 - 200 * (t / duration) + Math.sin(t * 30) * 20;
      const envelope = Math.exp(-2 * t);
      data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.4;
    }

    return buffer;
  }

  /**
   * Generate warning beep
   */
  private generateWarningSound(): AudioBuffer {
    const sampleRate = this.context!.sampleRate;
    const duration = 0.15;
    const buffer = this.context!.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.sin(Math.PI * t / duration);
      data[i] = Math.sin(2 * Math.PI * 880 * t) * envelope * 0.4;
    }

    return buffer;
  }

  /**
   * Generate low battery warning (urgent beeping)
   */
  private generateLowBatterySound(): AudioBuffer {
    const sampleRate = this.context!.sampleRate;
    const duration = 0.8;
    const buffer = this.context!.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    const beepFreq = 1200;
    const beepDur = 0.08;
    const numBeeps = 4;

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      for (let b = 0; b < numBeeps; b++) {
        const beepStart = b * 0.15;
        if (t >= beepStart && t < beepStart + beepDur) {
          const beepT = t - beepStart;
          const envelope = Math.sin(Math.PI * beepT / beepDur);
          sample = Math.sin(2 * Math.PI * beepFreq * beepT) * envelope * 0.5;
        }
      }

      data[i] = sample;
    }

    return buffer;
  }

  /**
   * Generate mode change sound
   */
  private generateModeChangeSound(): AudioBuffer {
    const sampleRate = this.context!.sampleRate;
    const duration = 0.2;
    const buffer = this.context!.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const freq = 600 + 400 * (t / duration); // Rising pitch
      const envelope = Math.sin(Math.PI * t / duration);
      data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.3;
    }

    return buffer;
  }

  /**
   * Update audio based on drone state - call every frame
   */
  update(state: DroneAudioState): void {
    if (!this.isInitialized || this.isMuted || !this.context) return;

    const { motorRPM, velocity, armed, throttle } = state;
    const currentTime = this.context.currentTime;

    // Update motor sounds
    for (let i = 0; i < 4; i++) {
      this.updateMotor(i, motorRPM[i], armed, currentTime);
    }

    // Update wind sound based on velocity
    this.updateWindSound(velocity, currentTime);

    // Update drone rumble based on throttle
    this.updateDroneRumble(throttle, armed, currentTime);

    // Handle Doppler effect if enabled
    if (this.config.dopplerEnabled && this.lastState) {
      this.updateDopplerEffect(state, this.lastState);
    }

    this.lastState = { ...state };
  }

  /**
   * Update individual motor sound
   */
  private updateMotor(index: number, rpm: number, armed: boolean, currentTime: number): void {
    const motor = this.motors[index];
    if (!motor) return;

    const normalizedRPM = rpm / MAX_RPM;
    const targetVolume = armed ? normalizedRPM * 0.25 : 0;

    // Calculate frequency based on RPM
    const baseFreq = MIN_MOTOR_FREQ + normalizedRPM * (MAX_MOTOR_FREQ - MIN_MOTOR_FREQ);

    // Update fundamental
    motor.fundamental.frequency.setTargetAtTime(baseFreq, currentTime, 0.02);
    motor.fundamentalGain.gain.setTargetAtTime(targetVolume * 0.5, currentTime, 0.02);

    // Update harmonics
    for (let h = 0; h < motor.harmonics.length; h++) {
      const harmFreq = baseFreq * HARMONIC_RATIOS[h];
      motor.harmonics[h].frequency.setTargetAtTime(harmFreq, currentTime, 0.02);
      motor.harmonicGains[h].gain.setTargetAtTime(
        targetVolume * HARMONIC_GAINS[h] * 0.4,
        currentTime,
        0.02
      );
    }

    // Update body resonance (lower frequency rumble)
    const bodyFreq = 30 + normalizedRPM * 30;
    motor.bodyResonance.frequency.setTargetAtTime(bodyFreq, currentTime, 0.05);
    motor.bodyGain.gain.setTargetAtTime(targetVolume * 0.2, currentTime, 0.02);

    // Update prop noise
    const noiseFreq = 400 + normalizedRPM * 1200;
    motor.propNoiseFilter.frequency.setTargetAtTime(noiseFreq, currentTime, 0.02);
    motor.propNoiseGain.gain.setTargetAtTime(targetVolume * 0.15, currentTime, 0.02);

    // Update master filter (opens up at higher RPM)
    const filterFreq = 1000 + normalizedRPM * 4000;
    motor.masterFilter.frequency.setTargetAtTime(filterFreq, currentTime, 0.02);

    // Update master gain
    motor.masterGain.gain.setTargetAtTime(targetVolume, currentTime, 0.01);
  }

  /**
   * Update wind sound based on airspeed
   */
  private updateWindSound(velocity: Vector3, currentTime: number): void {
    if (!this.windGain || !this.windFilter) return;

    const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);
    const maxSpeed = 30; // m/s
    const normalizedSpeed = Math.min(speed / maxSpeed, 1);

    // Wind volume increases with speed
    const windVolume = normalizedSpeed * normalizedSpeed * this.config.windVolume * 0.4;
    this.windGain.gain.setTargetAtTime(windVolume, currentTime, 0.1);

    // Wind frequency shifts with speed
    const windFreq = 200 + normalizedSpeed * 1000;
    this.windFilter.frequency.setTargetAtTime(windFreq, currentTime, 0.1);
  }

  /**
   * Update low frequency drone rumble
   */
  private updateDroneRumble(throttle: number, armed: boolean, currentTime: number): void {
    if (!this.rumbleGain || !this.droneRumble) return;

    const rumbleVolume = armed ? throttle * 0.15 : 0;
    this.rumbleGain.gain.setTargetAtTime(rumbleVolume, currentTime, 0.05);

    const rumbleFreq = 20 + throttle * 20;
    this.droneRumble.frequency.setTargetAtTime(rumbleFreq, currentTime, 0.1);
  }

  /**
   * Update Doppler effect based on velocity change
   */
  private updateDopplerEffect(current: DroneAudioState, _previous: DroneAudioState): void {
    // Simple Doppler pitch shift based on radial velocity towards listener (at origin)
    const distance = Math.sqrt(
      current.position.x ** 2 + current.position.y ** 2 + current.position.z ** 2
    );

    // Calculate radial velocity (velocity component towards/away from listener)
    const radialVelocity = distance > 1
      ? (current.position.x * current.velocity.x +
         current.position.y * current.velocity.y +
         current.position.z * current.velocity.z) / distance
      : 0;

    // Doppler shift: f' = f * (c / (c + v_radial))
    const speedOfSound = 343; // m/s
    const dopplerShift = speedOfSound / (speedOfSound + radialVelocity);

    // Apply subtle pitch shift to motors (in cents: 100 cents = 1 semitone)
    const detuneCents = (dopplerShift - 1) * 1200; // Convert to cents

    for (const motor of this.motors) {
      motor.fundamental.detune.value = detuneCents;
      for (const harmonic of motor.harmonics) {
        harmonic.detune.value = detuneCents;
      }
    }
  }

  /**
   * Play a sound effect
   */
  playEffect(name: string, volume = 1): void {
    if (!this.isInitialized || !this.context || !this.effectsGain || this.isMuted) return;

    const buffer = this.effectBuffers.get(name);
    if (!buffer) {
      console.warn(`Sound effect "${name}" not found`);
      return;
    }

    const source = this.context.createBufferSource();
    source.buffer = buffer;

    const gain = this.context.createGain();
    gain.gain.value = volume * this.config.effectsVolume;

    source.connect(gain);
    gain.connect(this.effectsGain);

    // Also send to reverb if enabled
    if (this.config.reverbEnabled && this.convolver) {
      const reverbSend = this.context.createGain();
      reverbSend.gain.value = 0.3;
      source.connect(reverbSend);
      reverbSend.connect(this.convolver);
    }

    source.start();
  }

  /**
   * Set audio configuration
   */
  setConfig(newConfig: Partial<ProAudioConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (this.masterGain) {
      this.masterGain.gain.value = this.config.masterVolume;
    }
    if (this.motorMixGain) {
      this.motorMixGain.gain.value = this.config.motorVolume;
    }
    if (this.effectsGain) {
      this.effectsGain.gain.value = this.config.effectsVolume;
    }
  }

  /**
   * Mute/unmute audio
   */
  setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : this.config.masterVolume;
    }
  }

  /**
   * Resume audio context
   */
  async resume(): Promise<void> {
    if (this.context?.state === 'suspended') {
      await this.context.resume();
    }
  }

  /**
   * Play ambient background music (procedurally generated)
   */
  playMusic(): void {
    if (!this.context || !this.masterGain || this.musicPlaying) return;

    this.musicPlaying = true;

    // Create music gain node
    this.musicGain = this.context.createGain();
    this.musicGain.gain.value = 0;
    this.musicGain.connect(this.masterGain);

    // Fade in
    this.musicGain.gain.setTargetAtTime(0.15, this.context.currentTime, 0.5);

    // Create ambient pad sound (peaceful, atmospheric)
    this.createAmbientPad();

    // Start arpeggio pattern
    this.startMusicArpeggio();
  }

  /**
   * Create ambient pad sound
   */
  private createAmbientPad(): void {
    if (!this.context || !this.musicGain) return;

    // C major 7 chord notes for peaceful atmosphere
    const padNotes = [130.81, 164.81, 196.00, 246.94]; // C3, E3, G3, B3

    for (const freq of padNotes) {
      // Create multiple detuned oscillators for rich pad sound
      for (let d = -1; d <= 1; d++) {
        const osc = this.context.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.detune.value = d * 8; // Slight detune for chorus effect

        const gain = this.context.createGain();
        gain.gain.value = 0.03;

        // Add tremolo/vibrato
        const lfo = this.context.createOscillator();
        const lfoGain = this.context.createGain();
        lfo.frequency.value = 0.5 + Math.random() * 0.5;
        lfoGain.gain.value = 0.005;
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        lfo.start();

        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start();

        this.musicOscillators.push(osc, lfo);
      }
    }
  }

  /**
   * Start music arpeggio pattern
   */
  private startMusicArpeggio(): void {
    if (!this.context || !this.musicGain) return;

    // Pentatonic scale notes for pleasant melodic content
    const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
    let noteIndex = 0;

    // Play notes in a pattern
    this.musicInterval = setInterval(() => {
      if (!this.context || !this.musicGain || !this.musicPlaying) return;

      const freq = scale[noteIndex % scale.length];
      noteIndex = (noteIndex + Math.floor(Math.random() * 3) + 1) % scale.length;

      // Create a short melodic note
      const osc = this.context.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;

      const gain = this.context.createGain();
      gain.gain.value = 0;

      // Soft attack and release
      const now = this.context.currentTime;
      gain.gain.setTargetAtTime(0.08, now, 0.05);
      gain.gain.setTargetAtTime(0, now + 0.3, 0.2);

      osc.connect(gain);
      gain.connect(this.musicGain);

      osc.start();
      osc.stop(now + 1);
    }, 600 + Math.random() * 400); // Random timing for organic feel
  }

  /**
   * Stop background music
   */
  stopMusic(): void {
    if (!this.musicPlaying || !this.context) return;

    this.musicPlaying = false;

    // Fade out
    if (this.musicGain) {
      this.musicGain.gain.setTargetAtTime(0, this.context.currentTime, 0.5);
    }

    // Stop interval
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }

    // Stop oscillators after fade
    setTimeout(() => {
      for (const osc of this.musicOscillators) {
        try {
          osc.stop();
        } catch {
          // Already stopped
        }
      }
      this.musicOscillators = [];
    }, 1000);
  }

  /**
   * Check if music is playing
   */
  isMusicPlaying(): boolean {
    return this.musicPlaying;
  }

  /**
   * Clean up audio system
   */
  dispose(): void {
    // Stop music first
    this.stopMusic();

    // Stop all motor oscillators
    for (const motor of this.motors) {
      motor.fundamental.stop();
      motor.harmonics.forEach(h => h.stop());
      motor.bodyResonance.stop();
      motor.propNoise?.stop();
    }

    this.windNoise?.stop();
    this.droneRumble?.stop();

    void this.context?.close();
    this.isInitialized = false;
  }
}

// Singleton instance
export const proAudioSystem = new ProAudioSystem();
