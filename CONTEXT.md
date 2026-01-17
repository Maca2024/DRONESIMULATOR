# CONTEXT.md - Aetherwing Technical Architecture

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║     █████╗ ███████╗████████╗██╗  ██╗███████╗██████╗ ██╗    ██╗██╗███╗   ██╗   ║
║    ██╔══██╗██╔════╝╚══██╔══╝██║  ██║██╔════╝██╔══██╗██║    ██║██║████╗  ██║   ║
║    ███████║█████╗     ██║   ███████║█████╗  ██████╔╝██║ █╗ ██║██║██╔██╗ ██║   ║
║    ██╔══██║██╔══╝     ██║   ██╔══██║██╔══╝  ██╔══██╗██║███╗██║██║██║╚██╗██║   ║
║    ██║  ██║███████╗   ██║   ██║  ██║███████╗██║  ██║╚███╔███╔╝██║██║ ╚████║   ║
║    ╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝╚═╝  ╚═══╝   ║
║                                                                               ║
║                    TECHNICAL ARCHITECTURE DOCUMENT v2.0                       ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

This document provides comprehensive technical details about the Aetherwing drone simulator's architecture, including the ProAudioSystem, Betaflight Rates, combined input mode, and all implementation details.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Input System (Combined Mode)](#2-input-system-combined-mode)
3. [ProAudioSystem (Multi-Layer Audio)](#3-proaudiosystem-multi-layer-audio)
4. [Betaflight Rates System](#4-betaflight-rates-system)
5. [Physics Engine](#5-physics-engine)
6. [State Management](#6-state-management)
7. [Rendering Pipeline](#7-rendering-pipeline)
8. [Game Loop](#8-game-loop)
9. [File Reference](#9-file-reference)
10. [Common Tasks](#10-common-tasks)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. System Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AETHERWING ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         INPUT LAYER                                 │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │   │
│  │  │ Keyboard │  │  Mouse   │  │ Gamepad  │  │ RC Transmitter   │   │   │
│  │  │  WASD    │  │ Velocity │  │  Analog  │  │ (via Gamepad API)│   │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘   │   │
│  │       │             │             │                  │            │   │
│  │       └─────────────┴─────────────┴──────────────────┘            │   │
│  │                              │                                    │   │
│  │                    ┌─────────▼─────────┐                          │   │
│  │                    │ COMBINED INPUT    │                          │   │
│  │                    │ All inputs blend  │                          │   │
│  │                    │ together seamlessly│                         │   │
│  │                    └─────────┬─────────┘                          │   │
│  └──────────────────────────────┼────────────────────────────────────┘   │
│                                 │                                        │
│  ┌──────────────────────────────▼────────────────────────────────────┐   │
│  │                      PROCESSING LAYER                             │   │
│  │                                                                   │   │
│  │  ┌─────────────────┐    ┌─────────────────┐    ┌───────────────┐  │   │
│  │  │ Betaflight      │    │ Physics Engine  │    │ Game Manager  │  │   │
│  │  │ Rates           │───►│ (500Hz)         │───►│ (Coordinator) │  │   │
│  │  │ Calculator      │    │ 4 substeps/frame│    │               │  │   │
│  │  └─────────────────┘    └─────────────────┘    └───────────────┘  │   │
│  │                                                                   │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                 │                                        │
│  ┌──────────────────────────────▼────────────────────────────────────┐   │
│  │                       OUTPUT LAYER                                │   │
│  │                                                                   │   │
│  │  ┌─────────────────┐    ┌─────────────────┐    ┌───────────────┐  │   │
│  │  │ 3D Rendering    │    │ ProAudioSystem  │    │ UI/HUD        │  │   │
│  │  │ React Three     │    │ Multi-layer     │    │ React         │  │   │
│  │  │ Fiber + Three.js│    │ Audio Synthesis │    │ Components    │  │   │
│  │  └─────────────────┘    └─────────────────┘    └───────────────┘  │   │
│  │                                                                   │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Framework** | React | 18.2 | UI Component Model |
| **3D Engine** | Three.js | 0.160 | WebGL Rendering |
| **3D Bridge** | React Three Fiber | 8.15 | Declarative 3D |
| **State** | Zustand | 4.4 | State Management |
| **Build** | Vite | 5.0 | Development & Build |
| **Language** | TypeScript | 5.3 | Type Safety |
| **Desktop** | Electron | 28.0 | Native App |
| **Testing** | Vitest | 1.0 | Unit Testing (104+ tests) |
| **Audio** | Web Audio API | Native | Multi-layer Synthesis |

---

## 2. Input System (Combined Mode)

### 2.1 Combined Input Architecture

The input system uses **Combined Input Mode** where all input sources work simultaneously:

```typescript
// src/renderer/store/inputStore.ts

interface InputState {
  // Current combined input values
  input: {
    throttle: number;  // 0.0 - 1.0
    yaw: number;       // -1.0 to 1.0
    pitch: number;     // -1.0 to 1.0
    roll: number;      // -1.0 to 1.0
    source: 'keyboard' | 'mouse' | 'gamepad' | 'combined';
  };

  // Mouse velocity tracking (KEY FEATURE)
  mouseVelocity: { x: number; y: number };
  lastMouseMoveTime: number;

  // Combined mode flag
  combinedInputMode: boolean;  // Always true

  // Keyboard state
  keys: Map<string, KeyState>;

  // Gamepad state
  gamepad: {
    connected: boolean;
    index: number;
    axes: number[];
    buttons: boolean[];
  };
}
```

### 2.2 Mouse Velocity System

The mouse uses a **velocity-based system** with automatic decay:

```typescript
// Key mouse velocity handling code

// On mouse move - accumulate velocity
handleMouseMove(deltaX: number, deltaY: number): void {
  const sensitivity = 0.002;
  const newVelocity = {
    x: this.mouseVelocity.x + deltaX * sensitivity,
    y: this.mouseVelocity.y + deltaY * sensitivity,
  };

  // Clamp to prevent extreme values
  newVelocity.x = Math.max(-1, Math.min(1, newVelocity.x));
  newVelocity.y = Math.max(-1, Math.min(1, newVelocity.y));

  this.mouseVelocity = newVelocity;
  this.lastMouseMoveTime = performance.now();
}

// Each frame - apply decay when mouse not moving
update(): void {
  const now = performance.now();
  const timeSinceMouseMove = now - this.lastMouseMoveTime;

  // Apply decay after 50ms of no movement
  if (timeSinceMouseMove > 50) {
    const decayRate = 0.15;  // 15% per frame
    this.mouseVelocity = {
      x: this.mouseVelocity.x * (1 - decayRate),
      y: this.mouseVelocity.y * (1 - decayRate),
    };

    // Zero out very small values
    if (Math.abs(this.mouseVelocity.x) < 0.001) this.mouseVelocity.x = 0;
    if (Math.abs(this.mouseVelocity.y) < 0.001) this.mouseVelocity.y = 0;
  }
}
```

### 2.3 Input Processing Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     INPUT PROCESSING FLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    RAW INPUT EVENTS                      │   │
│  │                                                          │   │
│  │  Keyboard:  keydown/keyup  → keys Map                    │   │
│  │  Mouse:     mousemove      → mouseVelocity (delta)       │   │
│  │  Gamepad:   poll each frame → axes[], buttons[]          │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   KEYBOARD PROCESSING                    │   │
│  │                                                          │   │
│  │  TAP (0-100ms):  15% input (soft start)                  │   │
│  │  HOLD (100ms+):  Ramp to 100% over 150ms                 │   │
│  │  RELEASE:        Return to 0% over 50ms                  │   │
│  │                                                          │   │
│  │  W/S → pitch (+/-)                                       │   │
│  │  A/D → roll  (-/+)                                       │   │
│  │  Q/E → yaw   (-/+)                                       │   │
│  │  Space/Shift → throttle (+/-)                            │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   MOUSE PROCESSING                       │   │
│  │                                                          │   │
│  │  Movement creates angular VELOCITY (not position)        │   │
│  │                                                          │   │
│  │  On mousemove:                                           │   │
│  │    mouseVelocity.x += deltaX × sensitivity               │   │
│  │    mouseVelocity.y += deltaY × sensitivity               │   │
│  │    lastMouseMoveTime = now                               │   │
│  │                                                          │   │
│  │  Each frame (when mouse not moving):                     │   │
│  │    if (timeSinceMove > 50ms):                            │   │
│  │      mouseVelocity *= (1 - 0.15)  // 15% decay           │   │
│  │                                                          │   │
│  │  mouseVelocity.x → roll                                  │   │
│  │  mouseVelocity.y → pitch                                 │   │
│  │  scroll wheel → throttle                                 │   │
│  │  left click + move → yaw                                 │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   COMBINED OUTPUT                        │   │
│  │                                                          │   │
│  │  throttle = keyboard.throttle + mouse.throttle           │   │
│  │             + gamepad.throttle                           │   │
│  │  yaw   = clamp(keyboard.yaw + mouse.yaw + gamepad.yaw)   │   │
│  │  pitch = clamp(keyboard.pitch + mouse.pitch + gamepad)   │   │
│  │  roll  = clamp(keyboard.roll + mouse.roll + gamepad)     │   │
│  │                                                          │   │
│  │  All values clamped to valid ranges                      │   │
│  │  source = 'combined'                                     │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.4 Key Bindings

| Key | Action |
|-----|--------|
| **W / S** | Pitch forward / backward |
| **A / D** | Roll left / right |
| **Q / E** | Yaw left / right |
| **Space** | Increase throttle |
| **Shift** | Decrease throttle |
| **R** | Arm / Disarm motors |
| **C** | Cycle camera modes |
| **M** | Toggle background music |
| **H** | Toggle controls help overlay |
| **P / Esc** | Pause game |

---

## 3. ProAudioSystem (Multi-Layer Audio)

### 3.1 Complete Audio Signal Chain

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     ProAudioSystem SIGNAL CHAIN                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                         MOTOR 1                                  │    │
│  │  ┌────────────────┐                                              │    │
│  │  │ Fundamental    │ Triangle wave │ RPM → Frequency             │    │
│  │  │ (100% volume)  │               │ f = 150 + (RPM/25000)*450   │    │
│  │  └───────┬────────┘               │                              │    │
│  │          │                        │                              │    │
│  │  ┌───────┴────────┐               │                              │    │
│  │  │ 2nd Harmonic   │ Sine wave     │ f = fundamental × 2         │    │
│  │  │ (30% volume)   │               │                              │    │
│  │  └───────┬────────┘               │                              │    │
│  │          │                        │                              │    │
│  │  ┌───────┴────────┐               │                              │    │
│  │  │ 3rd Harmonic   │ Sine wave     │ f = fundamental × 3         │    │
│  │  │ (15% volume)   │               │                              │    │
│  │  └───────┬────────┘               │                              │    │
│  │          │                        │                              │    │
│  │  ┌───────┴────────┐               │                              │    │
│  │  │ 4th Harmonic   │ Sine wave     │ f = fundamental × 4         │    │
│  │  │ (8% volume)    │               │                              │    │
│  │  └───────┬────────┘               │                              │    │
│  │          │                        │                              │    │
│  │  ┌───────┴────────┐               │                              │    │
│  │  │ Body Resonance │ Sine wave     │ f = fundamental × 0.5       │    │
│  │  │ (20% volume)   │ (frame vibe)  │                              │    │
│  │  └───────┬────────┘               │                              │    │
│  │          │                        │                              │    │
│  │          └──────────────────────► Mix ──► StereoPanner (L)       │    │
│  │                                                │                  │    │
│  └────────────────────────────────────────────────┼──────────────────┘    │
│                                                   │                      │
│  [MOTORS 2, 3, 4 - Same structure with different panning]               │
│                                                   │                      │
│                                                   ▼                      │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                       MOTOR MIX BUS                              │    │
│  │                    (GainNode: motorVolume)                       │    │
│  └───────────────────────────────┬─────────────────────────────────┘    │
│                                  │                                       │
│  ┌───────────────────────────────▼─────────────────────────────────┐    │
│  │                   DYNAMICS COMPRESSOR                            │    │
│  │                                                                  │    │
│  │   threshold: -24 dB    │   Tames motor dynamics                 │    │
│  │   knee: 30 dB          │   Prevents sudden loud spikes          │    │
│  │   ratio: 12:1          │                                        │    │
│  │   attack: 0.003s       │                                        │    │
│  │   release: 0.25s       │                                        │    │
│  │                                                                  │    │
│  └───────────────────────────────┬─────────────────────────────────┘    │
│                                  │                                       │
│  ┌───────────────────────────────▼─────────────────────────────────┐    │
│  │                     HIGH-CUT FILTER                              │    │
│  │                                                                  │    │
│  │   type: lowpass        │   Removes harsh high frequencies       │    │
│  │   frequency: 8000 Hz   │   Smooths the overall sound           │    │
│  │   Q: 0.7               │                                        │    │
│  │                                                                  │    │
│  └───────────────────────────────┬─────────────────────────────────┘    │
│                                  │                                       │
│  ┌───────────────────────────────▼─────────────────────────────────┐    │
│  │                      WARMTH FILTER                               │    │
│  │                                                                  │    │
│  │   type: lowshelf       │   Adds body and warmth                 │    │
│  │   frequency: 300 Hz    │   to the motor sound                   │    │
│  │   gain: +2 dB          │                                        │    │
│  │                                                                  │    │
│  └───────────────────────────────┬─────────────────────────────────┘    │
│                                  │                                       │
│  ┌───────────────────────────────▼─────────────────────────────────┐    │
│  │                    BRICK-WALL LIMITER                            │    │
│  │                                                                  │    │
│  │   threshold: -3 dB     │   PREVENTS ALL CLIPPING                │    │
│  │   knee: 0 dB           │   Hard limiting                        │    │
│  │   ratio: 20:1          │   Almost infinite ratio                │    │
│  │   attack: 0.001s       │   Instant attack                       │    │
│  │   release: 0.1s        │   Quick release                        │    │
│  │                                                                  │    │
│  └───────────────────────────────┬─────────────────────────────────┘    │
│                                  │                                       │
│  ┌───────────────────────────────▼─────────────────────────────────┐    │
│  │                       MASTER GAIN                                │    │
│  │                    (masterVolume: 0.0-1.0)                       │    │
│  └───────────────────────────────┬─────────────────────────────────┘    │
│                                  │                                       │
│                                  ▼                                       │
│                        AudioContext.destination                          │
│                              (Speakers)                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Motor Sound Layers

Each of the 4 motors generates 5 audio layers:

| Layer | Waveform | Frequency | Volume | Purpose |
|-------|----------|-----------|--------|---------|
| **Fundamental** | Triangle | 150-600Hz (RPM-based) | 100% | Base motor frequency |
| **2nd Harmonic** | Sine | 2× fundamental | 30% | First overtone |
| **3rd Harmonic** | Sine | 3× fundamental | 15% | Second overtone |
| **4th Harmonic** | Sine | 4× fundamental | 8% | Third overtone |
| **Body Resonance** | Sine | 0.5× fundamental | 20% | Frame vibration |

### 3.3 Motor Audio Update Algorithm

```typescript
// src/renderer/systems/ProAudioSystem.ts

update(state: AudioUpdateState): void {
  if (!this.initialized || !this.context) return;

  const { motorRPM, velocity, position, armed, throttle } = state;

  // Update each motor
  for (let i = 0; i < 4; i++) {
    const motor = this.motors[i];
    const rpm = armed ? motorRPM[i] : 0;

    // Calculate base frequency from RPM (150Hz-600Hz range)
    const baseFreq = 150 + (rpm / 25000) * 450;

    // Calculate volume based on RPM
    const volume = armed ? Math.min(rpm / 20000, 1) * this.config.motorVolume : 0;

    // Update all oscillators with smooth transitions
    const timeConstant = 0.02;  // 20ms smoothing

    motor.fundamental.frequency.setTargetAtTime(baseFreq, this.context.currentTime, timeConstant);
    motor.fundamentalGain.gain.setTargetAtTime(volume, this.context.currentTime, timeConstant);

    motor.harmonic2.frequency.setTargetAtTime(baseFreq * 2, this.context.currentTime, timeConstant);
    motor.harmonic2Gain.gain.setTargetAtTime(volume * 0.3, this.context.currentTime, timeConstant);

    motor.harmonic3.frequency.setTargetAtTime(baseFreq * 3, this.context.currentTime, timeConstant);
    motor.harmonic3Gain.gain.setTargetAtTime(volume * 0.15, this.context.currentTime, timeConstant);

    motor.harmonic4.frequency.setTargetAtTime(baseFreq * 4, this.context.currentTime, timeConstant);
    motor.harmonic4Gain.gain.setTargetAtTime(volume * 0.08, this.context.currentTime, timeConstant);

    motor.bodyResonance.frequency.setTargetAtTime(baseFreq * 0.5, this.context.currentTime, timeConstant);
    motor.bodyGain.gain.setTargetAtTime(volume * 0.2, this.context.currentTime, timeConstant);

    // Stereo panning: Motors 1,4 left (-0.7), Motors 2,3 right (+0.7)
    const pan = (i === 0 || i === 3) ? -0.7 : 0.7;
    motor.panner.pan.setTargetAtTime(pan, this.context.currentTime, timeConstant);
  }

  // Update wind noise based on velocity
  const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);
  const windVolume = Math.min(speed / 30, 1) * 0.15 * this.config.masterVolume;
  this.windGain.gain.setTargetAtTime(windVolume, this.context.currentTime, 0.1);
}
```

### 3.4 Browser Autoplay Handling

```typescript
// Auto-resume audio context when suspended due to browser policy
setupAutoResume(): void {
  const resumeAudio = (): void => {
    if (this.context?.state === 'suspended') {
      this.context.resume().then(() => {
        console.log('AudioContext resumed successfully');
      });
    }
  };

  // Listen for any user interaction
  const events = ['click', 'keydown', 'touchstart', 'mousedown', 'pointerdown'];

  events.forEach(event => {
    window.addEventListener(event, resumeAudio, {
      passive: true,
      once: false  // Keep listening
    });
  });
}
```

### 3.5 Sound Effects

| Effect | Trigger | Description |
|--------|---------|-------------|
| **Arm** | R key / motors armed | Rising tone sequence |
| **Disarm** | Motors disarmed | Falling tone sequence |
| **Checkpoint** | Gate passed | Success chime |
| **Crash** | Collision | Impact noise with decay |
| **Warning** | Low battery/altitude | Alert beep |
| **Success** | Race completed | Victory fanfare |
| **Fail** | Crash or timeout | Failure tone |
| **Mode Change** | Flight mode change | Mode indicator |

---

## 4. Betaflight Rates System

### 4.1 Rate Calculation Algorithm

```typescript
// src/renderer/systems/BetaflightRates.ts

interface AxisRates {
  rcRate: number;    // Center sensitivity (°/s)
  maxRate: number;   // Maximum rate at full stick (°/s)
  expo: number;      // Expo curve (0-1)
}

interface RateProfile {
  roll: AxisRates;
  pitch: AxisRates;
  yaw: AxisRates;
}

class BetaflightRates {
  /**
   * Betaflight "Actual Rates" formula:
   *
   * rate = rcRate × (1 + expo × stick²) + maxRate × stick³
   *
   * This provides:
   * - Linear response at center (rcRate dominates)
   * - Cubic ramp to max rate at extremes
   * - Expo adjusts the curve shape
   */
  calculateAxisRate(stick: number, axis: AxisRates): number {
    const absStick = Math.abs(stick);
    const sign = Math.sign(stick);

    const rate = axis.rcRate * (1 + axis.expo * absStick * absStick)
               + axis.maxRate * absStick * absStick * absStick;

    return rate * sign;
  }

  calculate(input: { roll: number; pitch: number; yaw: number }): {
    roll: number;
    pitch: number;
    yaw: number;
  } {
    return {
      roll: this.calculateAxisRate(input.roll, this.profile.roll),
      pitch: this.calculateAxisRate(input.pitch, this.profile.pitch),
      yaw: this.calculateAxisRate(input.yaw, this.profile.yaw),
    };
  }
}
```

### 4.2 Rate Presets

| Preset | Center | Max Rate | Expo | Best For |
|--------|--------|----------|------|----------|
| **Freestyle** | 200°/s | 850°/s | 0.4 | Tricks, acrobatic flying |
| **Racing** | 250°/s | 1000°/s | 0.2 | Speed, precision turns |
| **Cinematic** | 100°/s | 400°/s | 0.6 | Smooth video, slow movements |
| **Beginner** | 120°/s | 500°/s | 0.5 | Learning, forgiving control |

### 4.3 Rate Curve Visualization

```
Rotation Rate (°/s)
        ^
  1000 ─┤                                    ╭─── Racing
        │                                 ╭──╯
   850 ─┤                              ╭──╯←── Freestyle
        │                           ╭──╯
   600 ─┤                        ╭──╯
        │                     ╭──╯
   400 ─┤               ╭─────╯←── Cinematic
        │          ╭────╯
   200 ─┤     ╭────╯
        │ ╭───╯
     0 ─┼────────────────────────────────────────────►
        0    0.2   0.4   0.6   0.8   1.0    Stick Position
```

---

## 5. Physics Engine

### 5.1 Physics Configuration

```typescript
const PHYSICS = {
  TIMESTEP: 1 / 500,           // 500Hz physics
  GRAVITY: 9.81,               // m/s²
  AIR_DENSITY: 1.225,          // kg/m³
  MAX_ALTITUDE: 500,           // meters
  GROUND_EFFECT_HEIGHT: 1.0,   // meters
  GROUND_EFFECT_STRENGTH: 0.3, // 30% thrust boost
};
```

### 5.2 Motor Layout (X Configuration)

```
              FRONT
                │
    Motor 1     │     Motor 2
    (CW)        │     (CCW)
       ╲        │        ╱
        ╲       │       ╱
         ╲      │      ╱
          ────┼────
         ╱      │      ╲
        ╱       │       ╲
       ╱        │        ╲
    Motor 4     │     Motor 3
    (CCW)       │     (CW)
                │
              BACK

Motor Control Mixing:
─────────────────────
Roll Right:  M1↑, M4↑, M2↓, M3↓
Roll Left:   M1↓, M4↓, M2↑, M3↑
Pitch Fwd:   M1↓, M2↓, M3↑, M4↑
Pitch Back:  M1↑, M2↑, M3↓, M4↓
Yaw Right:   M1↑, M3↑, M2↓, M4↓
Yaw Left:    M1↓, M3↓, M2↑, M4↑
```

### 5.3 Physics Formulas

```
THRUST (per motor):
  T = Ct × ρ × n² × D⁴

  Where:
    Ct = Thrust coefficient (0.1)
    ρ  = Air density (1.225 kg/m³)
    n  = Motor RPM / 60 (revolutions per second)
    D  = Propeller diameter (0.127 m for 5")

DRAG:
  F = 0.5 × Cd × ρ × A × v²

  Where:
    Cd = Drag coefficient (0.5)
    A  = Reference area (0.04 m²)
    v  = Velocity magnitude

GROUND EFFECT:
  T_actual = T × (1 + 0.3 × (1 - altitude / 1.0))
  Active when altitude < 1.0m
```

### 5.4 Drone Presets

| Preset | Mass | Thrust | Roll Rate | Pitch Rate | Yaw Rate |
|--------|------|--------|-----------|------------|----------|
| **Beginner** | 0.50 kg | 1.2× | 200°/s | 200°/s | 150°/s |
| **Intermediate** | 0.40 kg | 1.5× | 400°/s | 400°/s | 250°/s |
| **Racing** | 0.35 kg | 2.0× | 600°/s | 600°/s | 400°/s |
| **Freestyle** | 0.45 kg | 1.8× | 500°/s | 500°/s | 350°/s |

---

## 6. State Management

### 6.1 Zustand Stores

```typescript
// Game Store - Core game state
interface GameStore {
  currentScreen: 'menu' | 'game' | 'pause' | 'settings';
  isPlaying: boolean;
  isPaused: boolean;

  drone: {
    position: Vector3;
    velocity: Vector3;
    rotation: Euler;
    motorRPM: [number, number, number, number];
    isArmed: boolean;
    batteryLevel: number;
    flightMode: 'angle' | 'horizon' | 'acro';
  };

  score: number;
  missionTime: number;
  comboMultiplier: number;
}

// Input Store - Combined input handling
interface InputStore {
  input: NormalizedInput;
  mouseVelocity: { x: number; y: number };
  lastMouseMoveTime: number;
  combinedInputMode: boolean;  // Always true
  keys: Map<string, KeyState>;
  gamepad: GamepadState;
}

// Settings Store - Persisted to localStorage
interface SettingsStore {
  graphics: GraphicsSettings;
  audio: AudioSettings;
  controls: ControlSettings;
  accessibility: AccessibilitySettings;
}
```

---

## 7. Rendering Pipeline

### 7.1 React Three Fiber Scene Graph

```
<Canvas>
├── <Suspense fallback={<LoadingScreen />}>
│   ├── <Environment />           # HDRI lighting, sky
│   ├── <Terrain />               # Procedural ground
│   ├── <DroneModel ref={droneRef} />
│   │   ├── Body mesh
│   │   ├── Motor arms × 4
│   │   ├── Propellers × 4 (animated)
│   │   └── LED indicators
│   ├── <ParticleEffects />       # Thrust particles
│   └── <PostProcessingEffects /> # Bloom, SSAO
│
├── <PerspectiveCamera />
├── <ambientLight />
├── <directionalLight />
└── <fog />
```

### 7.2 Camera Modes

| Mode | FOV | Smoothing | Description |
|------|-----|-----------|-------------|
| **Chase** | 75° | 0.1 | Behind drone, look-ahead |
| **FPV** | 120° | 0.0 | Cockpit view, instant response |
| **Orbit** | 60° | 0.05 | Auto-rotating around drone |
| **Cinematic** | 45° | 0.02 | Distant, smooth tracking |

---

## 8. Game Loop

### 8.1 Frame-by-Frame Execution

```typescript
// src/renderer/hooks/useGameManager.ts

useFrame((state, delta) => {
  if (gameStore.isPaused) return;

  // Clamp delta to prevent physics explosion
  const clampedDelta = Math.min(delta, 0.05);

  // ═══════════════════════════════════════════════
  // STEP 1: INPUT PROCESSING
  // ═══════════════════════════════════════════════
  inputStore.update();  // Includes mouse velocity decay
  const input = inputStore.input;

  // ═══════════════════════════════════════════════
  // STEP 2: RATE CALCULATION (Betaflight)
  // ═══════════════════════════════════════════════
  const rateOutput = betaflightRates.calculate({
    roll: input.roll,
    pitch: input.pitch,
    yaw: input.yaw,
  });

  // ═══════════════════════════════════════════════
  // STEP 3: PHYSICS UPDATE (4 substeps at 500Hz)
  // ═══════════════════════════════════════════════
  for (let i = 0; i < 4; i++) {
    physics.update(input, rateOutput, clampedDelta / 4);
  }
  const droneState = physics.getState();

  // ═══════════════════════════════════════════════
  // STEP 4: UPDATE GAME STATE
  // ═══════════════════════════════════════════════
  gameStore.updateDrone(droneState);
  gameStore.tick(clampedDelta);

  // ═══════════════════════════════════════════════
  // STEP 5: UPDATE AUDIO
  // ═══════════════════════════════════════════════
  audioSystem.update({
    motorRPM: droneState.motorRPM,
    velocity: droneState.velocity,
    position: droneState.position,
    armed: droneState.isArmed,
    throttle: input.throttle,
  });

  // ═══════════════════════════════════════════════
  // STEP 6: UPDATE 3D SCENE
  // ═══════════════════════════════════════════════
  if (droneRef.current) {
    droneRef.current.position.copy(droneState.position);
    droneRef.current.rotation.copy(droneState.rotation);
  }
});
```

---

## 9. File Reference

### 9.1 Key Files

| File | Lines | Purpose |
|------|-------|---------|
| `src/renderer/store/inputStore.ts` | ~400 | Combined input handling with mouse velocity |
| `src/renderer/systems/ProAudioSystem.ts` | ~500 | Multi-layer audio synthesis |
| `src/renderer/systems/ProAudioSystem.test.ts` | ~300 | 25 audio tests |
| `src/renderer/systems/BetaflightRates.ts` | ~150 | Rate calculation |
| `src/renderer/systems/BetaflightRates.test.ts` | ~200 | Rate tests |
| `src/renderer/core/PhysicsEngine.ts` | ~480 | Physics simulation |
| `src/renderer/hooks/useGameManager.ts` | ~180 | Game loop |
| `src/renderer/store/gameStore.ts` | ~170 | Game state |
| `src/renderer/ui/HUD.tsx` | ~210 | Flight HUD |
| `src/renderer/ui/HUD.module.css` | ~350 | HUD styles |

---

## 10. Common Tasks

### 10.1 Add New Sound Effect

```typescript
// In ProAudioSystem.ts playEffect()
case 'newEffect':
  this.playNewEffect(volume);
  break;

private playNewEffect(volume: number): void {
  const osc = this.context.createOscillator();
  const gain = this.context.createGain();

  osc.type = 'sine';
  osc.frequency.value = 440;

  gain.gain.setValueAtTime(volume * this.config.effectsVolume, this.context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.5);

  osc.connect(gain);
  gain.connect(this.effectsGain);

  osc.start();
  osc.stop(this.context.currentTime + 0.5);
}
```

### 10.2 Modify Rate Curves

```typescript
// In BetaflightRates.ts
export const RATE_PRESETS = {
  custom: {
    roll:  { rcRate: 180, maxRate: 750, expo: 0.35 },
    pitch: { rcRate: 180, maxRate: 750, expo: 0.35 },
    yaw:   { rcRate: 140, maxRate: 550, expo: 0.25 },
  },
};
```

### 10.3 Adjust Mouse Sensitivity

```typescript
// In inputStore.ts handleMouseMove()
const sensitivity = 0.003;  // Increase for faster response
const decayRate = 0.10;     // Decrease for slower decay
```

---

## 11. Troubleshooting

### 11.1 Audio Not Playing

**Cause**: Browser autoplay policy suspends AudioContext

**Solution**: ProAudioSystem has `setupAutoResume()`. If still not working:
```typescript
document.addEventListener('click', () => {
  audioSystem.resume();
});
```

### 11.2 Mouse Control Feels Laggy

**Cause**: Decay rate too high or sensitivity too low

**Solution**: In inputStore.ts:
```typescript
const decayRate = 0.10;     // Lower = slower decay
const sensitivity = 0.003;  // Higher = more responsive
```

### 11.3 Physics "Explosion"

**Cause**: Delta time spike causing unstable integration

**Solution**: Already clamped in useGameManager:
```typescript
const clampedDelta = Math.min(delta, 0.05);
```

### 11.4 Test Failures in ProAudioSystem

**Cause**: Mock missing required properties

**Solution**: Ensure mock has all properties:
```typescript
createBiquadFilter: vi.fn(() => ({
  type: 'lowpass',
  frequency: { value: 0, setTargetAtTime: vi.fn() },
  Q: { value: 0 },
  gain: { value: 0 },  // Required for lowshelf filter!
  connect: vi.fn(),
})),
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01 | Initial release |
| 1.1.0 | 2024-01 | Added ProAudioSystem with multi-layer synthesis |
| 1.2.0 | 2024-01 | Added Betaflight Rates system |
| 1.3.0 | 2024-01 | Combined input mode, mouse velocity decay |
| 2.0.0 | 2024-01 | Brick-wall limiter, warmth filter, auto-resume, 104 tests |

---

<div align="center">

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║                    AETHERWING DRONE SIMULATOR                     ║
║                                                                   ║
║                  "Master the skies, one input at a time."         ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

</div>
