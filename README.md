# Aetherwing Drone Simulator

```
    ___    ________________  ____________       _____   ________
   /   |  / ____/_  __/ / / / ____/ __ \     / /   | / ____/ /
  / /| | / __/   / / / /_/ / __/ / /_/ /    / / /| |/ /   / /
 / ___ |/ /___  / / / __  / /___/ _, _/    / / ___ / /___/ /___
/_/  |_/_____/ /_/ /_/ /_/_____/_/ |_|    /_/_/  |_\____/_____/

        STRATEGIC FPV DRONE FLIGHT SIMULATOR
```

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-61dafb.svg)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-0.160-black.svg)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646cff.svg)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Quick Start](#quick-start)
4. [Game Controls](#game-controls)
5. [Flight Modes](#flight-modes)
6. [Game Modes](#game-modes)
7. [Technical Architecture](#technical-architecture)
8. [Physics Engine](#physics-engine)
9. [Audio System](#audio-system)
10. [Accessibility](#accessibility)
11. [Development](#development)
12. [Testing](#testing)
13. [Deployment](#deployment)
14. [Contributing](#contributing)

---

## Overview

**Aetherwing** is a browser-based FPV (First Person View) drone flight simulator that provides a realistic quadcopter flying experience. Built with modern web technologies, it features:

- **Realistic Physics**: Custom 500Hz physics engine with accurate quadcopter dynamics
- **Multiple Input Methods**: Keyboard, mouse, gamepad, and RC transmitter support
- **Progressive Learning**: 5-level tutorial system from novice to expert
- **Mission System**: Various mission types including time trials, precision landing, and more
- **Accessibility First**: Comprehensive accessibility features for all users

### Why Aetherwing?

- **No Installation Required**: Runs directly in your browser
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Educational**: Learn drone physics and flight principles
- **Customizable**: Adjust physics, controls, and visual settings

---

## Features

### Core Features

| Feature | Description |
|---------|-------------|
| **Realistic Physics** | 500Hz simulation with thrust, drag, ground effect, and gravity |
| **4 Drone Presets** | Beginner, Intermediate, Racing, and Freestyle configurations |
| **3 Flight Modes** | Angle (self-leveling), Horizon, and Acro (manual) |
| **4 Camera Modes** | Chase, FPV, Orbit, and Cinematic views |
| **Progressive Tutorial** | 5 levels with 20+ training tasks |
| **Mission System** | 6 mission types with scoring and rewards |
| **Procedural Audio** | Real-time motor sounds based on RPM |
| **Particle Effects** | Thrust particles and visual feedback |

### Accessibility Features

- **Motor Accessibility**: One-handed mode, extended deadzone, auto-stabilization
- **Visual Accessibility**: Colorblind modes, high contrast, UI scaling (1x-3x)
- **Audio Accessibility**: Visual audio cues, subtitles, mono audio
- **Cognitive Support**: Simplified HUD, extended time limits, visual guides

---

## Quick Start

### Prerequisites

- **Node.js** 18.0 or higher
- **npm** 9.0 or higher
- A modern browser (Chrome, Firefox, Edge, Safari)

### Installation

```bash
# Clone the repository
git clone https://github.com/Maca2024/DRONESIMULATOR.git

# Navigate to project directory
cd DRONESIMULATOR

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Desktop Application (Electron)

```bash
# Start with Electron wrapper
npm run electron:dev

# Build desktop application
npm run build:electron
```

---

## Game Controls

### Keyboard Controls

| Action | Primary Key | Alternative |
|--------|-------------|-------------|
| **Pitch Forward** | W | Arrow Up |
| **Pitch Backward** | S | Arrow Down |
| **Roll Left** | A | Arrow Left |
| **Roll Right** | D | Arrow Right |
| **Throttle Up** | Space | - |
| **Throttle Down** | Shift | - |
| **Yaw Left** | Q | - |
| **Yaw Right** | E | - |
| **Arm Drone** | R | - |
| **Disarm Drone** | T | - |
| **Angle Mode** | 1 | - |
| **Horizon Mode** | 2 | - |
| **Acro Mode** | 3 | - |
| **Cycle Camera** | C | - |
| **Pause** | P | Escape |

### Gamepad Controls (Mode 2 - Standard)

| Stick/Button | Action |
|--------------|--------|
| Left Stick Y | Throttle |
| Left Stick X | Yaw |
| Right Stick Y | Pitch |
| Right Stick X | Roll |
| Left Bumper | Disarm |
| Right Bumper | Arm |
| D-Pad | Flight Mode Selection |

---

## Flight Modes

### Angle Mode (Beginner)

- **Auto-leveling**: Drone automatically levels when sticks are centered
- **Angle Limit**: Maximum tilt angle of 45 degrees
- **Best For**: Learning basic controls, hovering practice

### Horizon Mode (Intermediate)

- **Hybrid Mode**: Self-levels at center, allows full rotation at extremes
- **Angle Limit**: None (can flip when stick is at maximum)
- **Best For**: Transitioning from Angle to Acro

### Acro Mode (Expert)

- **Full Manual**: No auto-leveling, complete control
- **Rate-Based**: Stick position controls rotation rate, not angle
- **Best For**: Freestyle flying, racing, advanced maneuvers

---

## Game Modes

### Free Play

Open flying with no objectives. Practice maneuvers, explore the environment, or just enjoy flying.

### Tutorial

Progressive training system with 5 skill levels:

| Level | Skills Taught |
|-------|---------------|
| **Novice** | Throttle control, hovering, landing |
| **Beginner** | Yaw rotation, forward/backward, strafing |
| **Intermediate** | Banking turns, figure-8, precision hover |
| **Advanced** | Acro mode basics, first flip |
| **Expert** | Power loops, split-S, advanced tricks |

### Missions

| Type | Description | Objectives |
|------|-------------|------------|
| **Time Trial** | Race through checkpoints | Speed, efficiency |
| **Precision** | Land/hover at specific points | Accuracy, control |
| **Search** | Find hidden markers | Exploration |
| **Delivery** | Transport items | Navigation |
| **Survival** | Navigate obstacles | Endurance |
| **CTF** | Capture objectives | Strategy |

### Scoring System

| Event | Points |
|-------|--------|
| Objective Complete | +1000 |
| Time Bonus (per second under par) | +100 |
| Combo Multiplier | Up to 2.0x |
| Collision Penalty | -500 |
| Reset Penalty | -1000 |

---

## Technical Architecture

### Project Structure

```
DRONESIMULATOR/
├── src/
│   ├── renderer/                 # Main application code
│   │   ├── core/                 # Physics engine
│   │   │   └── PhysicsEngine.ts  # 500Hz quadcopter physics
│   │   │
│   │   ├── store/                # Zustand state management
│   │   │   ├── gameStore.ts      # Game state, drone, scoring
│   │   │   ├── inputStore.ts     # Input handling, normalization
│   │   │   ├── settingsStore.ts  # Persistent settings
│   │   │   └── progressStore.ts  # Player progression
│   │   │
│   │   ├── systems/              # Game systems
│   │   │   ├── TutorialSystem.ts # Progressive training
│   │   │   ├── MissionSystem.ts  # Mission management
│   │   │   └── AudioSystem.ts    # Procedural audio
│   │   │
│   │   ├── hooks/                # React hooks
│   │   │   ├── useGameManager.ts # Game loop coordination
│   │   │   └── useCameraController.ts
│   │   │
│   │   ├── components/           # 3D components
│   │   │   ├── DroneModel.tsx    # Animated quadcopter
│   │   │   ├── Terrain.tsx       # Procedural terrain
│   │   │   ├── Environment.tsx   # Sky, lighting
│   │   │   └── ParticleEffects.tsx
│   │   │
│   │   ├── scenes/               # 3D scenes
│   │   │   ├── GameScene.tsx     # Main game scene
│   │   │   └── Drone.tsx         # Drone scene component
│   │   │
│   │   ├── ui/                   # UI components
│   │   │   ├── MainMenu.tsx
│   │   │   ├── HUD.tsx
│   │   │   ├── SettingsPanel.tsx
│   │   │   └── TutorialOverlay.tsx
│   │   │
│   │   ├── App.tsx               # Root component
│   │   └── main.tsx              # Entry point
│   │
│   ├── shared/                   # Shared code
│   │   ├── types.ts              # TypeScript definitions
│   │   └── constants.ts          # Configuration constants
│   │
│   └── test/                     # Test utilities
│       └── setup.ts
│
├── index.html                    # HTML entry point
├── vite.config.ts                # Vite configuration
├── vitest.config.ts              # Test configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies and scripts
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **UI Framework** | React 18 | Component-based UI |
| **3D Rendering** | Three.js + React Three Fiber | WebGL rendering |
| **State Management** | Zustand | Lightweight state |
| **Physics** | Custom Engine | 500Hz simulation |
| **Audio** | Web Audio API | Procedural sounds |
| **Build Tool** | Vite | Fast development |
| **Desktop** | Electron | Native app wrapper |
| **Language** | TypeScript | Type safety |
| **Testing** | Vitest | Unit testing |

### Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                        GAME LOOP (60 FPS)                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │ Input Store │───>│ Game Manager│───>│ Physics Engine      │  │
│  │ (keyboard,  │    │ (coordinate │    │ (500Hz, 4 substeps) │  │
│  │  gamepad)   │    │  systems)   │    │                     │  │
│  └─────────────┘    └─────────────┘    └─────────────────────┘  │
│         │                  │                      │              │
│         │                  ▼                      ▼              │
│         │         ┌─────────────┐    ┌─────────────────────┐    │
│         │         │ Tutorial/   │    │ Game Store          │    │
│         │         │ Mission Sys │    │ (drone state,       │    │
│         │         └─────────────┘    │  score, screen)     │    │
│         │                  │         └─────────────────────┘    │
│         │                  │                      │              │
│         ▼                  ▼                      ▼              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    REACT RENDERING                          ││
│  │  ┌──────────┐  ┌───────────┐  ┌────────────┐               ││
│  │  │ 3D Scene │  │ UI Overlay│  │ Audio Sys  │               ││
│  │  │ (Three.js│  │ (HUD,     │  │ (motor     │               ││
│  │  │  + R3F)  │  │  menus)   │  │  sounds)   │               ││
│  │  └──────────┘  └───────────┘  └────────────┘               ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Physics Engine

### Overview

The physics engine simulates realistic quadcopter dynamics at 500Hz for stability and accuracy.

### Physics Model

```
Motor Layout (X Configuration):

    Motor 1 (CW)        Motor 2 (CCW)
           \              /
            \            /
             \          /
              +--------+
              |        |
              | DRONE  |
              |        |
              +--------+
             /          \
            /            \
           /              \
    Motor 4 (CCW)       Motor 3 (CW)
```

### Thrust Calculation

```
T = Ct × ρ × n² × D⁴

Where:
- Ct = Thrust coefficient
- ρ  = Air density (1.225 kg/m³)
- n  = Motor RPM
- D  = Propeller diameter
```

### Forces Applied

| Force | Formula | Description |
|-------|---------|-------------|
| **Thrust** | T = Ct × ρ × n² × D⁴ | Upward force from motors |
| **Gravity** | F = m × g | Downward force (9.81 m/s²) |
| **Drag** | F = 0.5 × Cd × ρ × A × v² | Air resistance |
| **Ground Effect** | +30% thrust | Increased efficiency near ground |

### Physics Constants

| Constant | Value | Unit |
|----------|-------|------|
| Timestep | 1/500 | seconds |
| Gravity | 9.81 | m/s² |
| Air Density | 1.225 | kg/m³ |
| Max Altitude | 500 | meters |
| Ground Effect Range | 1.0 | meters |

### Drone Presets

| Preset | Mass | Thrust | Roll Rate | Pitch Rate | Yaw Rate |
|--------|------|--------|-----------|------------|----------|
| Beginner | 0.50 kg | 1.2x | 200°/s | 200°/s | 150°/s |
| Intermediate | 0.40 kg | 1.5x | 400°/s | 400°/s | 250°/s |
| Racing | 0.35 kg | 2.0x | 600°/s | 600°/s | 400°/s |
| Freestyle | 0.45 kg | 1.8x | 500°/s | 500°/s | 350°/s |

---

## Audio System

### Procedural Motor Sounds

The audio system generates real-time motor sounds using the Web Audio API:

```
┌─────────────────────────────────────────────────────────────────┐
│                     AUDIO SYSTEM                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Motor RPM ──► Oscillator (Sawtooth) ──► Lowpass Filter         │
│                     │                          │                │
│                     └──────── + ───────────────┤                │
│                               │                │                │
│  Noise Generator ──► Bandpass Filter ─────────►│                │
│                                                │                │
│                                                ▼                │
│                                          Gain Node              │
│                                                │                │
│                                                ▼                │
│                                          Master Output          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Sound Effects

| Effect | Description | Trigger |
|--------|-------------|---------|
| Checkpoint | 880Hz sine tone | Passing checkpoint |
| Crash | Noise burst | Ground impact |
| Arm | Square wave up | Arming drone |
| Disarm | Square wave down | Disarming drone |
| Success | C5-E5-G5 chord | Mission complete |
| Fail | Descending tone | Mission failed |

---

## Accessibility

### Motor Accessibility

| Feature | Description |
|---------|-------------|
| One-Handed Mode | Simplified control scheme for single-hand use |
| Extended Deadzone | Larger deadzone for tremor accommodation |
| Input Smoothing | 0-100ms smoothing to reduce jitter |
| Auto-Stabilization | 0-100% automatic leveling assistance |

### Visual Accessibility

| Feature | Options |
|---------|---------|
| Colorblind Mode | None, Deuteranopia, Protanopia, Tritanopia |
| High Contrast | Enhanced UI contrast |
| UI Scale | 1.0x to 3.0x scaling |
| Large Text | Increased font sizes |
| Reduce Motion | Disabled animations |
| Disable Screen Shake | No camera shake effects |

### Audio Accessibility

| Feature | Description |
|---------|-------------|
| Visual Audio Cues | On-screen indicators for sounds |
| Subtitles | Text for audio events |
| Mono Audio | Combined stereo to mono |

### Cognitive Accessibility

| Feature | Description |
|---------|-------------|
| Simplified HUD | Reduced information display |
| Extended Time Limits | Longer mission timers |
| Visual Guides | Additional navigation helpers |

---

## Development

### Available Scripts

```bash
# Development
npm run dev              # Start Vite dev server
npm run electron:dev     # Start with Electron

# Building
npm run build            # TypeScript + Vite build
npm run build:electron   # Full desktop app build
npm run preview          # Preview production build

# Code Quality
npm run typecheck        # TypeScript type checking
npm run lint             # ESLint checking
npm run lint:fix         # Fix ESLint issues
npm run format           # Format with Prettier
npm run format:check     # Check formatting
npm run quality          # Run all quality checks

# Testing
npm run test             # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage report
npm run test:physics     # Physics tests only
```

### Environment Setup

1. Install Node.js 18+ and npm 9+
2. Clone the repository
3. Run `npm install`
4. Start development with `npm run dev`

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for React/TypeScript
- **Prettier**: Code formatting
- **Imports**: Absolute imports from `src/`

---

## Testing

### Test Structure

```
src/
├── renderer/
│   └── core/
│       └── PhysicsEngine.test.ts    # Physics unit tests
├── shared/
│   ├── types.test.ts                # Type validation tests
│   └── constants.test.ts            # Constants tests
└── test/
    └── setup.ts                     # Test configuration
```

### Running Tests

```bash
# All tests
npm run test

# With coverage
npm run test:coverage

# Specific test file
npm run test:physics

# Watch mode
npm run test:watch
```

### Test Coverage Goals

| Area | Target Coverage |
|------|-----------------|
| Physics Engine | 90%+ |
| State Stores | 80%+ |
| Game Systems | 75%+ |

---

## Deployment

### Web Deployment (Vercel/Netlify)

```bash
# Build for production
npm run build

# Output in dist/ directory
```

### Desktop Deployment (Electron)

```bash
# Build desktop app
npm run build:electron

# Output in release/ directory
# - Windows: .exe installer
# - macOS: .dmg file
# - Linux: .AppImage file
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview"]
```

---

## Contributing

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run quality checks: `npm run quality`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Coding Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Document public APIs
- Keep commits atomic and descriptive

### Areas for Contribution

- [ ] Additional drone presets
- [ ] New mission types
- [ ] Improved terrain generation
- [ ] Mobile touch controls
- [ ] Multiplayer support
- [ ] VR support

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Three.js community for 3D rendering
- React Three Fiber for declarative 3D
- Zustand for elegant state management
- The FPV drone community for physics inspiration

---

## Support

- **Issues**: [GitHub Issues](https://github.com/Maca2024/DRONESIMULATOR/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Maca2024/DRONESIMULATOR/discussions)

---

<div align="center">

**[Website](https://aetherwing.dev)** | **[Documentation](./CLAUDE.md)** | **[Report Bug](https://github.com/Maca2024/DRONESIMULATOR/issues)**

*"Master the skies, one throttle input at a time."*

</div>
