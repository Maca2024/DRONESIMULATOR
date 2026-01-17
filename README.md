# 🚁 Aetherwing FPV Drone Simulator

```
    ___    ________________  ____________       _____   ________
   /   |  / ____/_  __/ / / / ____/ __ \     / /   | / ____/ /
  / /| | / __/   / / / /_/ / __/ / /_/ /    / / /| |/ /   / /
 / ___ |/ /___  / / / __  / /___/ _, _/    / / ___ / /___/ /___
/_/  |_/_____/ /_/ /_/ /_/_____/_/ |_|    /_/_/  |_\____/_____/

        PROFESSIONAL FPV DRONE FLIGHT SIMULATOR
```

<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-R3F-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![Electron](https://img.shields.io/badge/Electron-28.0-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tests](https://img.shields.io/badge/Tests-104%20Passing-00ff88?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**A professional-grade FPV drone flight simulator with realistic physics, Betaflight-accurate rate curves, and multi-layer audio synthesis.**

[🎮 Play Now](https://maca2024.github.io/DRONESIMULATOR) · [📖 Documentation](#documentation) · [🐛 Report Bug](https://github.com/Maca2024/DRONESIMULATOR/issues)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Getting Started](#-getting-started)
- [Controls](#-controls)
- [Professional Audio System](#-professional-audio-system)
- [Betaflight Rates System](#-betaflight-rates-system)
- [Flight Physics](#-flight-physics)
- [Architecture](#-architecture)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

Aetherwing is a high-fidelity FPV (First Person View) drone flight simulator designed to provide an immersive and realistic flying experience. Built entirely with modern web technologies, it runs in any browser or as a standalone desktop application via Electron.

### Why Aetherwing?

| Feature | Description |
|---------|-------------|
| **Realistic Physics** | Custom 500Hz physics engine with accurate quadcopter dynamics |
| **Professional Audio** | Multi-layer synthesized motor sounds with harmonics, warmth filtering, and brick-wall limiting |
| **Betaflight Rates** | Industry-standard "Actual Rates" control model used by real FPV pilots worldwide |
| **Combined Input Mode** | Seamless use of keyboard, mouse, and gamepad simultaneously |
| **Zero Installation** | Play directly in your browser or download the desktop app |
| **104+ Tests** | Comprehensive test suite ensuring reliability |

### What Makes It Special

Unlike other simulators, Aetherwing implements:

1. **True Betaflight Rates**: The same rate calculation algorithm used in real Betaflight flight controllers
2. **Multi-Layer Motor Audio**: Each of the 4 motors generates 5 audio layers (fundamental + 3 harmonics + body resonance)
3. **Velocity-Based Mouse Control**: Mouse movement creates angular velocity with natural decay
4. **Professional Audio Chain**: Compressor → High-cut → Warmth filter → Brick-wall limiter

---

## ✨ Features

### 🎮 Flight Control System

| Feature | Description |
|---------|-------------|
| **Combined Input Mode** | Use keyboard, mouse, and gamepad simultaneously - all inputs blend together |
| **Mouse Flight** | Intuitive velocity-based mouse control with 15%/frame decay |
| **Betaflight Rates** | Professional "Actual Rates" control curves with expo |
| **Rate Profiles** | Freestyle (850°/s), Racing (1000°/s), Cinematic (400°/s), Beginner (500°/s) |
| **Input Smoothing** | Configurable expo and smoothing for all axes |
| **Scroll Throttle** | Mouse scroll wheel for precise throttle control |

### 🔊 Professional Audio System (ProAudioSystem)

| Feature | Description |
|---------|-------------|
| **Multi-Layer Synthesis** | Fundamental + 3 harmonics + body resonance per motor (20+ oscillators total) |
| **4-Motor Simulation** | Individual motor sounds with stereo panning based on position |
| **Triangle/Sine Waves** | Smooth oscillators instead of harsh sawtooth for pleasant sound |
| **Warmth Filter** | Low-shelf filter at 300Hz adding +2dB warmth |
| **Brick-Wall Limiter** | Dynamics compressor at -3dB with 20:1 ratio prevents all clipping |
| **High-Cut Filter** | 8000Hz lowpass removes harsh high frequencies |
| **Wind Effects** | Velocity-based wind noise with dynamic filtering |
| **Auto-Resume** | Automatic audio context resume for browser autoplay policy |
| **Sound Effects** | Arm, disarm, checkpoint, crash, warning, success, fail, mode change |
| **Background Music** | Toggleable ambient music with M key |

### 🎨 Visual Features

| Feature | Description |
|---------|-------------|
| **React Three Fiber** | GPU-accelerated 3D rendering |
| **Dynamic Shadows** | Real-time shadow mapping |
| **Procedural Sky** | Atmospheric scattering simulation |
| **HUD Overlay** | Flight telemetry, attitude indicator, throttle gauge |
| **Controls Help** | Auto-showing help overlay (H to toggle) |
| **Multiple Cameras** | FPV (C), chase, and orbit camera modes |
| **60+ FPS** | Optimized for smooth performance |
| **Particle Effects** | Thrust particles and visual feedback |

### 🏁 Game Modes

| Mode | Description |
|------|-------------|
| **Free Flight** | Open sandbox exploration |
| **Race Mode** | Time-trial through checkpoints |
| **Tutorial** | 5-level progressive training (20+ tasks) |
| **Missions** | 6 mission types with scoring |

### ♿ Accessibility

| Category | Features |
|----------|----------|
| **Motor** | One-handed mode, extended deadzone, input smoothing, auto-stabilization |
| **Visual** | Colorblind modes, high contrast, UI scaling (1x-3x), large text, reduce motion |
| **Audio** | Visual audio cues, subtitles, mono audio |
| **Cognitive** | Simplified HUD, extended time limits, visual guides |

---

## 🛠 Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2 | UI component framework with hooks |
| **TypeScript** | 5.3 | Type-safe JavaScript with strict mode |
| **Three.js** | 0.160 | 3D graphics engine |
| **React Three Fiber** | Latest | Declarative Three.js for React |
| **Drei** | Latest | R3F helpers and abstractions |
| **Zustand** | Latest | Lightweight state management |
| **CSS Modules** | - | Scoped component styling |

### Audio

| Technology | Purpose |
|------------|---------|
| **Web Audio API** | Low-latency audio synthesis |
| **OscillatorNode** | Motor sound generation (triangle/sine waves) |
| **BiquadFilterNode** | EQ, warmth filtering, high-cut |
| **DynamicsCompressorNode** | Limiting and dynamics control |
| **StereoPannerNode** | Spatial motor positioning |
| **GainNode** | Volume control per layer |

### Build & Development

| Technology | Version | Purpose |
|------------|---------|---------|
| **Vite** | 5.0 | Fast development server and bundler |
| **Electron** | 28.0 | Desktop application wrapper |
| **Vitest** | Latest | Unit and integration testing |
| **ESLint** | Latest | Code linting and style enforcement |
| **Prettier** | Latest | Code formatting |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.0 or higher
- **npm** 9.0 or higher (or yarn/pnpm)
- **Git** for cloning the repository
- Modern browser (Chrome, Firefox, Edge, Safari)

### Installation

```bash
# Clone the repository
git clone https://github.com/Maca2024/DRONESIMULATOR.git
cd DRONESIMULATOR

# Install dependencies
npm install

# Start development server
npm run dev
```

The development server will start at `http://localhost:5173`.

### Desktop Application

```bash
# Build and run Electron app
npm run electron:dev

# Package for distribution
npm run build:electron
```

### Quick Start Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run all 104+ tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Lint source files |
| `npm run lint:fix` | Fix ESLint issues |
| `npm run quality` | Run typecheck + lint + format + test |
| `npm run electron:dev` | Start Electron in development |
| `npm run build:electron` | Package Electron app |

---

## 🎮 Controls

### Combined Input Mode

Aetherwing features **Combined Input Mode** where all input devices work simultaneously:

- Keyboard provides digital input with analog simulation
- Mouse provides velocity-based control with natural decay
- Gamepad provides full analog precision
- **All inputs blend together seamlessly**

### Keyboard Controls

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
| **1 / 2 / 3** | Angle / Horizon / Acro mode |

### Mouse Controls

| Input | Action |
|-------|--------|
| **Move Left/Right** | Roll (velocity-based with decay) |
| **Move Up/Down** | Pitch (velocity-based with decay) |
| **Scroll Up** | Increase throttle |
| **Scroll Down** | Decrease throttle |
| **Left Click + Move** | Yaw control |
| **Right Click** | Toggle pointer lock |

The mouse uses a **velocity-based system**:
- Mouse movement creates angular velocity
- 15% decay per frame when mouse stops moving
- Feels natural and responsive
- No infinite accumulation

### Gamepad Controls (Xbox Layout)

| Input | Action |
|-------|--------|
| **Left Stick Y** | Throttle |
| **Left Stick X** | Yaw |
| **Right Stick Y** | Pitch |
| **Right Stick X** | Roll |
| **A Button** | Arm / Disarm |
| **B Button** | Cycle camera |
| **Start** | Pause |
| **D-Pad** | Flight mode selection |

---

## 🔊 Professional Audio System

### Architecture

The ProAudioSystem provides realistic drone audio through multi-layer synthesis:

```
┌─────────────────────────────────────────────────────────────────┐
│                     AUDIO SIGNAL CHAIN                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐                                            │
│  │ Motor 1         │                                            │
│  │ ├─ Fundamental  │──┐                                         │
│  │ ├─ 2nd Harmonic │  │                                         │
│  │ ├─ 3rd Harmonic │  │    ┌────────────────┐                   │
│  │ └─ Body Reson.  │  │    │   Dynamics     │                   │
│  └─────────────────┘  ├───►│   Compressor   │                   │
│                       │    │   (threshold:  │                   │
│  ┌─────────────────┐  │    │    -24dB)      │                   │
│  │ Motor 2 (×4)    │──┤    └───────┬────────┘                   │
│  └─────────────────┘  │            │                            │
│                       │            ▼                            │
│  ┌─────────────────┐  │    ┌────────────────┐                   │
│  │ Motor 3 (×4)    │──┤    │   High-Cut     │                   │
│  └─────────────────┘  │    │   Filter       │                   │
│                       │    │   (8000Hz LP)  │                   │
│  ┌─────────────────┐  │    └───────┬────────┘                   │
│  │ Motor 4 (×4)    │──┘            │                            │
│  └─────────────────┘               ▼                            │
│                            ┌────────────────┐                   │
│  ┌─────────────────┐       │   Warmth       │                   │
│  │ Wind Noise      │──────►│   Filter       │                   │
│  │ (velocity-based)│       │   (300Hz +2dB) │                   │
│  └─────────────────┘       └───────┬────────┘                   │
│                                    │                            │
│                                    ▼                            │
│                            ┌────────────────┐                   │
│                            │   Brick-Wall   │                   │
│                            │   Limiter      │                   │
│                            │   (-3dB, 20:1) │                   │
│                            └───────┬────────┘                   │
│                                    │                            │
│                                    ▼                            │
│                            ┌────────────────┐                   │
│                            │   Master Gain  │───► Output        │
│                            │   (0.0 - 1.0)  │                   │
│                            └────────────────┘                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Motor Sound Layers

Each of the 4 motors generates 5 audio layers:

| Layer | Waveform | Frequency | Purpose |
|-------|----------|-----------|---------|
| **Fundamental** | Triangle | RPM-based (150-600Hz) | Base motor frequency |
| **2nd Harmonic** | Sine | 2× fundamental | First overtone |
| **3rd Harmonic** | Sine | 3× fundamental | Second overtone |
| **4th Harmonic** | Sine | 4× fundamental | Third overtone |
| **Body Resonance** | Sine | 0.5× fundamental | Low-frequency frame vibration |

### Harmonic Volumes

| Harmonic | Relative Volume |
|----------|-----------------|
| Fundamental | 100% |
| 2nd Harmonic | 30% |
| 3rd Harmonic | 15% |
| 4th Harmonic | 8% |
| Body Resonance | 20% |

### Audio Configuration

```typescript
audioSystem.setConfig({
  masterVolume: 0.8,    // 0.0 - 1.0
  motorVolume: 0.7,     // Motor mix level
  effectsVolume: 0.5,   // Sound effects level
  musicVolume: 0.3,     // Background music level
});
```

### Sound Effects

| Effect | Trigger | Description |
|--------|---------|-------------|
| **Arm** | R key / motors armed | Rising tone sequence |
| **Disarm** | Motors disarmed | Falling tone sequence |
| **Checkpoint** | Gate passed | Success chime |
| **Crash** | Collision detected | Impact noise with decay |
| **Warning** | Low battery/altitude | Alert beep |
| **Success** | Race completed | Victory fanfare |
| **Fail** | Crash or timeout | Failure tone |
| **Mode Change** | Flight mode change | Mode indicator sound |

### Browser Autoplay Handling

The audio system automatically handles browser autoplay policies:

```typescript
// Auto-resume on first user interaction
setupAutoResume(): void {
  const resumeAudio = (): void => {
    if (this.context?.state === 'suspended') {
      this.context.resume();
    }
  };

  ['click', 'keydown', 'touchstart', 'mousedown'].forEach(event => {
    window.addEventListener(event, resumeAudio, { passive: true });
  });
}
```

---

## 🎛 Betaflight Rates System

### Overview

Aetherwing implements the industry-standard **Betaflight "Actual Rates"** control model, the same algorithm used in real Betaflight flight controllers worldwide.

### Rate Calculation Formula

```
rate = centerSensitivity × (1 + expo × stick²) + maxRate × stick³

Where:
- stick = normalized stick input (-1.0 to 1.0)
- centerSensitivity = response at stick center (°/s)
- maxRate = maximum rotation rate at full stick (°/s)
- expo = curve shape (0 = linear, higher = more center sensitivity)
```

### Rate Parameters

| Parameter | Description | Typical Range |
|-----------|-------------|---------------|
| **Center Sensitivity** | Response at stick center | 100-250 °/s |
| **Max Rate** | Maximum rotation rate at full stick | 600-1200 °/s |
| **Expo** | Curve shape (0=linear, higher=more center) | 0.0-0.8 |

### Rate Presets

| Preset | Center | Max Rate | Expo | Best For |
|--------|--------|----------|------|----------|
| **Freestyle** | 200°/s | 850°/s | 0.4 | Tricks, acrobatic flying |
| **Racing** | 250°/s | 1000°/s | 0.2 | Speed, precision turns |
| **Cinematic** | 100°/s | 400°/s | 0.6 | Smooth video, slow movements |
| **Beginner** | 120°/s | 500°/s | 0.5 | Learning, forgiving control |

### Rate Curve Visualization

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

### Usage in Code

```typescript
import { BetaflightRates, RateProfile, RATE_PRESETS } from './BetaflightRates';

const rates = new BetaflightRates();

// Use a preset
rates.setProfile(RATE_PRESETS.freestyle);

// Or create custom profile
const customProfile: RateProfile = {
  roll: { rcRate: 200, maxRate: 800, expo: 0.3 },
  pitch: { rcRate: 200, maxRate: 800, expo: 0.3 },
  yaw: { rcRate: 150, maxRate: 600, expo: 0.2 },
};
rates.setProfile(customProfile);

// Calculate rates from stick input
const result = rates.calculate({
  roll: 0.5,   // 50% right
  pitch: -0.3, // 30% forward
  yaw: 0.0,    // centered
});

// result = { roll: 425, pitch: -240, yaw: 0 } (°/s)
```

---

## 🚁 Flight Physics

### Physics Engine

The physics engine simulates realistic quadcopter dynamics at 500Hz:

| Property | Value | Description |
|----------|-------|-------------|
| **Timestep** | 1/500 s | 500Hz physics rate |
| **Substeps** | 4 | 4 physics updates per frame |
| **Gravity** | 9.81 m/s² | Earth gravity |
| **Air Density** | 1.225 kg/m³ | Sea level |

### Motor Layout (X Configuration)

```
    Motor 1 (CW)        Motor 2 (CCW)
           \              /
            \            /
             \          /
              +--------+
              |  DRONE |
              +--------+
             /          \
            /            \
           /              \
    Motor 4 (CCW)       Motor 3 (CW)
```

### Forces Applied

| Force | Formula | Description |
|-------|---------|-------------|
| **Thrust** | T = Ct × ρ × n² × D⁴ | Upward force from motors |
| **Gravity** | F = m × g | Downward force |
| **Drag** | F = 0.5 × Cd × ρ × A × v² | Air resistance |
| **Ground Effect** | +30% thrust | Increased efficiency < 1m |

### Drone Presets

| Preset | Mass | Thrust | Roll Rate | Pitch Rate | Yaw Rate |
|--------|------|--------|-----------|------------|----------|
| **Beginner** | 0.50 kg | 1.2× | 200°/s | 200°/s | 150°/s |
| **Intermediate** | 0.40 kg | 1.5× | 400°/s | 400°/s | 250°/s |
| **Racing** | 0.35 kg | 2.0× | 600°/s | 600°/s | 400°/s |
| **Freestyle** | 0.45 kg | 1.8× | 500°/s | 500°/s | 350°/s |

### Flight Modes

| Mode | Auto-Level | Angle Limit | Best For |
|------|------------|-------------|----------|
| **Angle** | Yes | ±45° | Beginners, hovering |
| **Horizon** | Yes (center) | None | Transitional |
| **Acro** | No | None | Experts, freestyle |

---

## 🏗 Architecture

### Directory Structure

```
DRONESIMULATOR/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── index.ts            # Main entry point
│   │   └── preload.ts          # Preload scripts
│   │
│   ├── renderer/                # React application
│   │   ├── components/         # 3D React components
│   │   │   ├── DroneModel.tsx  # Animated quadcopter mesh
│   │   │   ├── Terrain.tsx     # Procedural terrain
│   │   │   ├── Environment.tsx # Sky, clouds, lighting
│   │   │   └── ParticleEffects.tsx
│   │   │
│   │   ├── core/               # Core systems
│   │   │   └── PhysicsEngine.ts # 500Hz physics simulation
│   │   │
│   │   ├── hooks/              # Custom React hooks
│   │   │   ├── useGameManager.ts    # Game loop coordination
│   │   │   └── useCameraController.ts
│   │   │
│   │   ├── store/              # Zustand stores
│   │   │   ├── gameStore.ts    # Game state, drone, scoring
│   │   │   ├── inputStore.ts   # Combined input handling
│   │   │   ├── settingsStore.ts # Persistent settings
│   │   │   └── progressStore.ts # Player progression
│   │   │
│   │   ├── systems/            # Game systems
│   │   │   ├── ProAudioSystem.ts    # Multi-layer audio synthesis
│   │   │   ├── ProAudioSystem.test.ts # 25 audio tests
│   │   │   ├── BetaflightRates.ts   # Rate calculator
│   │   │   ├── BetaflightRates.test.ts # Rate tests
│   │   │   ├── TutorialSystem.ts    # Progressive training
│   │   │   ├── MissionSystem.ts     # Mission objectives
│   │   │   └── AudioSystem.ts       # Legacy audio
│   │   │
│   │   ├── scenes/             # 3D scenes
│   │   │   ├── GameScene.tsx   # Main 3D scene
│   │   │   └── Drone.tsx       # Drone scene component
│   │   │
│   │   ├── ui/                 # UI components
│   │   │   ├── HUD.tsx         # Flight HUD with help overlay
│   │   │   ├── HUD.module.css  # HUD styles
│   │   │   ├── MainMenu.tsx    # Main menu
│   │   │   ├── PauseMenu.tsx   # Pause screen
│   │   │   ├── SettingsPanel.tsx # Settings UI
│   │   │   └── TutorialOverlay.tsx
│   │   │
│   │   ├── App.tsx             # Root component
│   │   └── main.tsx            # React entry point
│   │
│   ├── shared/                 # Shared types/constants
│   │   ├── types.ts            # TypeScript definitions
│   │   └── constants.ts        # Physics, input, scoring
│   │
│   └── test/                   # Test utilities
│       └── setup.ts
│
├── public/                     # Static assets
├── .github/                    # GitHub Actions
│   └── workflows/
│       └── deploy.yml          # Auto-deploy to GitHub Pages
├── CLAUDE.md                   # AI development guide
├── CONTEXT.md                  # Technical architecture
├── electron.vite.config.ts     # Vite configuration
├── vitest.config.ts            # Test configuration
├── package.json                # Dependencies
└── tsconfig.json              # TypeScript config
```

### State Management

The application uses **Zustand** for state management:

```typescript
// Game Store - Core game state
interface GameState {
  drone: DroneState;
  score: number;
  missionTime: number;
  comboMultiplier: number;
  isPaused: boolean;
  currentScreen: Screen;
}

// Input Store - Combined input handling
interface InputState {
  input: ControlInput;
  mouseVelocity: { x: number; y: number };
  combinedInputMode: boolean;  // All inputs work together
  lastMouseMoveTime: number;
}

// Settings Store - Persistent user preferences
interface SettingsState {
  graphics: GraphicsSettings;
  audio: AudioSettings;
  controls: ControlSettings;
  accessibility: AccessibilitySettings;
}
```

### Game Loop

```typescript
// 60 FPS game loop with 500Hz physics substeps
useFrame((state, delta) => {
  // 1. Poll and process all input sources
  inputStore.update();

  // 2. Apply mouse velocity decay (15%/frame when not moving)
  applyMouseDecay();

  // 3. Calculate rates using Betaflight algorithm
  const rates = betaflightRates.calculate(input, rateProfile);

  // 4. Run 4 physics substeps at 500Hz
  for (let i = 0; i < 4; i++) {
    physics.update(rates, delta / 4);
  }

  // 5. Update audio based on motor RPM
  audioSystem.update({
    motorRPM: drone.motorRPM,
    velocity: drone.velocity,
    position: drone.position,
    armed: drone.isArmed,
    throttle: input.throttle,
  });

  // 6. Update game state
  gameStore.tick(delta);
});
```

---

## 💻 Development

### Code Style

- **Strict TypeScript**: No `any`, explicit return types
- **Functional Components**: React hooks only
- **Named Exports**: No default exports
- **Immutable State**: All state updates are immutable
- **ESLint + Prettier**: Consistent formatting

### Adding New Features

```bash
# New 3D component
touch src/renderer/components/NewComponent.tsx

# New game system
touch src/renderer/systems/NewSystem.ts
touch src/renderer/systems/NewSystem.test.ts

# New store
touch src/renderer/store/newStore.ts
```

### Environment Variables

```bash
# .env.local
VITE_DEBUG_PHYSICS=true
VITE_DEBUG_AUDIO=true
VITE_SKIP_SPLASH=true
```

---

## 🧪 Testing

### Test Suite

The project includes 104+ tests covering all core functionality:

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific tests
npm run test -- ProAudioSystem
npm run test -- BetaflightRates
```

### Test Categories

| Category | Tests | Coverage |
|----------|-------|----------|
| **ProAudioSystem** | 25 | Audio synthesis, effects, configuration |
| **BetaflightRates** | 20 | Rate calculations, profiles, edge cases |
| **PhysicsEngine** | 15 | Forces, integration, stability |
| **InputStore** | 18 | Input handling, normalization |
| **GameStore** | 12 | Game state, scoring |
| **Components** | 14 | React component rendering |

### Example Test

```typescript
describe('ProAudioSystem', () => {
  it('should create 4 motor audio nodes with stereo panning', () => {
    audioSystem.initialize();

    // 4 motors with 5 oscillators each = 20+ oscillators
    expect(mockAudioContext.createOscillator.mock.calls.length)
      .toBeGreaterThanOrEqual(20);

    // 4 stereo panners for motor positioning
    expect(mockAudioContext.createStereoPanner)
      .toHaveBeenCalledTimes(4);
  });
});
```

---

## 🚀 Deployment

### Web Deployment (GitHub Pages)

The project auto-deploys to GitHub Pages on push to `main`:

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Manual Web Deployment

```bash
# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

### Desktop Builds

```bash
# Windows
npm run build:electron -- --win

# macOS
npm run build:electron -- --mac

# Linux
npm run build:electron -- --linux
```

---

## 🤝 Contributing

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run quality checks: `npm run quality`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Guidelines

- Write tests for new features (aim for 80%+ coverage)
- Follow existing code style
- Update documentation as needed
- Keep commits atomic and well-described

### Areas for Contribution

- 🎮 New game modes and missions
- 🎨 Visual improvements and effects
- 🔊 Additional sound effects and music
- 🗺️ New environments and maps
- 🎛️ Controller support improvements
- 📱 Mobile/touch optimization
- 🌐 Internationalization
- 🥽 VR support

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Betaflight Team** - For the industry-standard rate calculation algorithm
- **React Three Fiber** - For making 3D in React possible
- **Web Audio API** - For low-latency audio synthesis capabilities
- **The FPV Community** - For inspiration, feedback, and physics insights
- **Zustand** - For elegant state management

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Maca2024/DRONESIMULATOR/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Maca2024/DRONESIMULATOR/discussions)
- **Documentation**: [CLAUDE.md](./CLAUDE.md) | [CONTEXT.md](./CONTEXT.md)

---

<div align="center">

**Built with ❤️ for the FPV community**

[🎮 Play Now](https://maca2024.github.io/DRONESIMULATOR) · [⬆️ Back to Top](#-aetherwing-fpv-drone-simulator)

*"Master the skies, one throttle input at a time."*

</div>
