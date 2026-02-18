# CLAUDE.md - Aetherwing Drone Simulator

```
    ___    ______________  ____________       _____   ________
   /   |  / ____/_  __/ / / / ____/ __ \     / /   | / ____/ /
  / /| | / __/   / / / /_/ / __/ / /_/ /    / / /| |/ /   / /
 / ___ |/ /___  / / / __  / /___/ _, _/    / / ___ / /___/ /___
/_/  |_/_____/ /_/ /_/ /_/_____/_/ |_|    /_/_/  |_\____/_____/

     ___    ____  ____  _   ________   _____ ______  ___
    /   |  / __ \/ __ \/ | / / ____/  / ___//  _/  |/  /
   / /| | / / / / /_/ /  |/ / __/     \__ \ / // /|_/ /
  / ___ |/ /_/ / _, _/ /|  / /___    ___/ // // /  / /
 /_/  |_/_____/_/ |_/_/ |_/_____/   /____/___/_/  /_/

```

## RECENT CHANGES (January 2026)

### Bug Fixes Applied
- **WebGL Detection**: Added WebGL support check with user-friendly error screen
- **PostProcessing Disabled**: Disabled postprocessing effects due to browser compatibility issues
- **Auto-Arm on Start**: Drone is now automatically armed when starting a game (no need to press R)
- **Audio Initialization**: Audio now initializes on first menu button click
- **Input Handler Fix**: Fixed keyboard input being disabled by mouse movement
- **Event Listener Fix**: Added event listeners on both window and document with capture phase

### Known Issues
- **PostProcessing**: Disabled due to WebGL context errors in some browsers
- **Controls**: May need to click on game window to focus before controls work

### Files Modified
| File | Changes |
|------|---------|
| `App.tsx` | WebGL detection, hooks order fix, Canvas focus fix |
| `PostProcessingEffects.tsx` | Disabled (returns null) |
| `gameStore.ts` | Auto-arm drone on game start |
| `inputStore.ts` | Event listeners on window+document, prevent double init |
| `GameScene.tsx` | Input initialization on mount |
| `MainMenu.tsx` | Audio initialization on button click |
| `HUD.tsx` | Debug display for Roll/Pitch/Yaw values |

---

## IMMEDIATE START GUIDE

### Step 1: What is Aetherwing?

Aetherwing is a **strategic drone simulator** built with:
- **React Three Fiber** (3D rendering)
- **Custom Physics Engine** (500Hz simulation)
- **Zustand** (state management)
- **Electron** (desktop app)
- **Web Audio API** (procedural audio)

### Step 2: Core Architecture

```
AETHERWING = Physics + Input + Systems + Rendering

src/
├── renderer/
│   ├── core/
│   │   └── PhysicsEngine.ts     # 500Hz quadcopter physics
│   │
│   ├── store/                   # Zustand state stores
│   │   ├── gameStore.ts         # Game state (screen, drone, score)
│   │   ├── inputStore.ts        # Input handling (keyboard/gamepad)
│   │   ├── settingsStore.ts     # Persistent settings
│   │   └── progressStore.ts     # Player progression
│   │
│   ├── systems/                 # Game systems
│   │   ├── TutorialSystem.ts    # Progressive flight training
│   │   ├── MissionSystem.ts     # Mission objectives & scoring
│   │   └── AudioSystem.ts       # Procedural motor sounds
│   │
│   ├── hooks/                   # React hooks
│   │   ├── useGameManager.ts    # Coordinates all systems
│   │   └── useCameraController.ts # Chase/FPV/Orbit cameras
│   │
│   ├── components/              # 3D components
│   │   ├── DroneModel.tsx       # Detailed quadcopter mesh
│   │   ├── Environment.tsx      # Sky, clouds, lighting
│   │   ├── Terrain.tsx          # Procedural terrain
│   │   ├── ParticleEffects.tsx  # Thrust particles
│   │   └── PostProcessingEffects.tsx
│   │
│   ├── scenes/
│   │   ├── GameScene.tsx        # Main 3D scene
│   │   └── Drone.tsx            # Legacy drone model
│   │
│   └── ui/                      # 2D UI overlays
│       ├── HUD.tsx              # Flight telemetry
│       ├── MainMenu.tsx
│       ├── PauseMenu.tsx
│       ├── SettingsPanel.tsx
│       ├── TutorialOverlay.tsx
│       └── MissionHUD.tsx
│
└── shared/                      # Shared types & constants
    ├── types.ts                 # TypeScript definitions
    └── constants.ts             # Physics, input, scoring constants
```

### Step 3: Quick Commands

```bash
# Development
npm run dev           # Start Vite dev server (http://localhost:5173)
npm run electron:dev  # Start with Electron wrapper

# Build
npm run build         # TypeScript + Vite build
npm run build:electron # Full desktop app build

# Quality
npm run quality       # typecheck + lint + format + test
npm run test         # Run Vitest tests
npm run lint:fix     # Fix ESLint issues
```

---

## PHYSICS ENGINE

The heart of Aetherwing is a realistic quadcopter physics simulation.

### Physics Model (`src/renderer/core/PhysicsEngine.ts`)

```
┌─────────────────────────────────────────────────────────────────┐
│                     PHYSICS ENGINE (500Hz)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  INPUT ──► MOTOR RPM ──► THRUST/TORQUE ──► FORCES ──► STATE    │
│                                                                 │
│  ┌──────────────┐    ┌───────────────┐    ┌─────────────────┐  │
│  │ calculateMotorRPMs │   │ calculateTotalThrust │   │ Update Position │  │
│  │ - Base from throttle │   │ - T = Ct*ρ*n²*D⁴  │   │ - F = ma      │  │
│  │ - Differential for  │   │ - Sum 4 motors    │   │ - Euler integration │
│  │   roll/pitch/yaw   │   └───────────────┘    └─────────────────┘  │
│  └──────────────┘                                                │
│                                                                 │
│  Motor Layout (X config):                                       │
│     1 (CW)    2 (CCW)                                          │
│        \    /                                                  │
│         \  /                                                   │
│          \/                                                    │
│          /\                                                    │
│         /  \                                                   │
│     4 (CCW)   3 (CW)                                           │
│                                                                 │
│  Additional Forces:                                            │
│  - Gravity: F = m * 9.81                                       │
│  - Drag: F = 0.5 * Cd * ρ * A * v²                            │
│  - Ground Effect: +30% thrust near ground                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Physics Constants (`src/shared/constants.ts:9-15`)

| Constant | Value | Description |
|----------|-------|-------------|
| `TIMESTEP` | 1/500 | 500Hz physics rate |
| `GRAVITY` | 9.81 | m/s² |
| `AIR_DENSITY` | 1.225 | kg/m³ |
| `MAX_ALTITUDE` | 500 | meters |

### Drone Presets (`src/shared/constants.ts:21-50`)

| Preset | Mass | Thrust | Rates (deg/s) |
|--------|------|--------|---------------|
| BEGINNER | 0.5 kg | 1.2x | 200/200/150 |
| INTERMEDIATE | 0.4 kg | 1.5x | 400/400/250 |
| RACING | 0.35 kg | 2.0x | 600/600/400 |
| FREESTYLE | 0.45 kg | 1.8x | 500/500/350 |

---

## INPUT SYSTEM

### Supported Input Sources

```
┌───────────────────────────────────────────────────────────────┐
│                      INPUT SOURCES                            │
├──────────────┬────────────────────────────────────────────────┤
│ keyboard     │ WASD + Space/Shift + QE for yaw               │
│ mouse        │ Scroll wheel for throttle                     │
│ trackpad     │ Gesture-based control                         │
│ gamepad      │ Standard gamepad mapping (Mode 2)             │
│ rc           │ RC transmitter via gamepad API                │
└──────────────┴────────────────────────────────────────────────┘
```

### Default Key Bindings (`src/shared/constants.ts:85-102`)

| Action | Keys |
|--------|------|
| Pitch Forward/Back | W/S or Arrow Up/Down |
| Roll Left/Right | A/D or Arrow Left/Right |
| Throttle Up/Down | Space / Shift |
| Yaw Left/Right | Q / E |
| Arm/Disarm | R / T |
| Flight Mode | 1 (Angle) / 2 (Horizon) / 3 (Acro) |
| Camera Mode | 4-7 (Chase/FPV/Orbit/Cinematic) |
| Pause | P or Escape |

### Input Processing (`src/renderer/store/inputStore.ts`)

```
Key Press → KeyState (pressed, time, value) → Analog Simulation
                                                    │
                      ┌─────────────────────────────┘
                      │
                      ▼
              ┌───────────────┐
              │ TAP: 15% input │ (first 100ms)
              │ HOLD: Ramp to 100% │ (over 150ms)
              │ RELEASE: Return to 0 │ (over 50ms)
              └───────────────┘
                      │
                      ▼
              Apply Deadzone → Apply Expo → Apply Sensitivity
                      │
                      ▼
              NormalizedInput { throttle, yaw, pitch, roll, aux1-3 }
```

---

## FLIGHT MODES

### Mode Comparison

| Mode | Auto-Level | Angle Limit | Best For |
|------|------------|-------------|----------|
| **Angle** | Yes | ±45° | Beginners, hovering |
| **Horizon** | Yes (center) | None | Transitional |
| **Acro** | No | None | Experts, freestyle |

---

## GAME SYSTEMS

### Tutorial System (`src/renderer/systems/TutorialSystem.ts`)

**5 Progressive Levels:**

```
NOVICE ──► BEGINNER ──► INTERMEDIATE ──► ADVANCED ──► EXPERT
  │           │              │              │           │
  │           │              │              │           └─ Power loops
  │           │              │              │              Split-S
  │           │              │              └─ Acro intro
  │           │              │                 First flip
  │           │              └─ Banking turns
  │           │                 Figure 8
  │           │                 Precision hover
  │           └─ Yaw control
  │              Forward/backward
  │              Four-point nav
  └─ Throttle control
     Hover practice
     Precision landing
```

### Mission System (`src/renderer/systems/MissionSystem.ts`)

**Mission Types:**

| Type | Description | Objective Types |
|------|-------------|-----------------|
| `timeTrial` | Race through checkpoints | checkpoint |
| `precision` | Land/hover at points | land, hover |
| `search` | Find hidden markers | collect |
| `delivery` | Transport items | collect, land |
| `survival` | Navigate obstacles | checkpoint |

**Scoring (`src/shared/constants.ts:145-154`):**

| Event | Points |
|-------|--------|
| Objective complete | +1000 |
| Time bonus (per second under par) | +100 |
| Collision | -500 |
| Reset | -1000 |

### Audio System (`src/renderer/systems/AudioSystem.ts`)

**Procedural Audio:**
- Motor sounds: 4 oscillators (sawtooth) + noise
- Frequency: 100-800Hz based on RPM
- Effects: checkpoint, crash, arm/disarm, success, fail

---

## CAMERA MODES

### Available Modes (`src/renderer/hooks/useCameraController.ts`)

| Mode | Key | Description |
|------|-----|-------------|
| Chase | 4 | Third-person follow (default) |
| FPV | 5 | First-person cockpit view |
| Orbit | 6 | Auto-rotating around drone |
| Cinematic | 7 | Smooth distant tracking |

Press **C** to cycle through modes.

---

## STATE MANAGEMENT

### Zustand Stores

```
┌─────────────────────────────────────────────────────────────┐
│                     STATE STORES                            │
├──────────────────┬──────────────────────────────────────────┤
│ gameStore        │ currentScreen, isPlaying, isPaused,      │
│                  │ drone (state), score, gameTime            │
├──────────────────┼──────────────────────────────────────────┤
│ inputStore       │ NormalizedInput, keys Map, gamepad,      │
│                  │ config (sensitivity, deadzone, expo)      │
├──────────────────┼──────────────────────────────────────────┤
│ settingsStore    │ graphics, audio, controls, accessibility │
│                  │ (persisted to localStorage)               │
├──────────────────┼──────────────────────────────────────────┤
│ progressStore    │ level, xp, completedMissions,            │
│                  │ achievements, statistics                  │
└──────────────────┴──────────────────────────────────────────┘
```

---

## ACCESSIBILITY FEATURES

### Motor Accessibility (`src/shared/types.ts:193-199`)
- `oneHandedMode`: Single-hand control scheme
- `extendedDeadzone`: Larger input deadzone
- `inputSmoothing`: 0-100ms input smoothing
- `autoStabilization`: 0-100% auto-level strength

### Visual Accessibility (`src/shared/types.ts:201-208`)
- `colorblindMode`: none, deuteranopia, protanopia, tritanopia
- `highContrast`: High contrast UI
- `uiScale`: 1.0-3.0x UI scaling
- `largeText`: Larger text rendering
- `reduceMotion`: Reduced visual effects
- `disableScreenShake`: No screen shake

### Audio Accessibility (`src/shared/types.ts:210-213`)
- `visualAudioCues`: Visual indicators for sounds
- `subtitles`: Text for audio events
- `monoAudio`: Mono audio output

---

## FILE MAP (Line Counts)

| File | Lines | Key Classes/Functions |
|------|-------|----------------------|
| `shared/types.ts` | 255 | All TypeScript interfaces |
| `shared/constants.ts` | 193 | PHYSICS, DRONE_PRESETS, INPUT, SCORING |
| `core/PhysicsEngine.ts` | 477 | PhysicsEngine class |
| `store/gameStore.ts` | 168 | useGameStore |
| `store/inputStore.ts` | 385 | useInputStore, calculateNormalizedInput |
| `store/settingsStore.ts` | 136 | useSettingsStore (persisted) |
| `systems/TutorialSystem.ts` | 410 | TutorialSystem class |
| `systems/MissionSystem.ts` | 399 | MissionSystem class |
| `systems/AudioSystem.ts` | 402 | AudioSystem class |
| `hooks/useGameManager.ts` | 176 | Game loop coordination |
| `hooks/useCameraController.ts` | 203 | Camera mode management |
| `scenes/GameScene.tsx` | 456 | Main 3D scene + markers |
| `components/DroneModel.tsx` | 230 | Detailed drone mesh |
| `App.tsx` | 144 | Root component |

---

## EXECUTION FLOW

```
┌─────────────────────────────────────────────────────────────┐
│ 1. App.tsx mounts                                          │
│    └─► Initialize inputStore                               │
│    └─► Load settings from localStorage                     │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. User starts game (freePlay / tutorial / mission)        │
│    └─► GameScene renders                                   │
│    └─► useGameManager initializes systems                  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Game Loop (useFrame @ 60fps)                            │
│    ├─► inputStore.update() - poll keyboard/gamepad         │
│    ├─► gameManager.update(dt)                              │
│    │   ├─► physics.update() (4 substeps for stability)     │
│    │   ├─► tutorial.update() (if active)                   │
│    │   ├─► mission.update() (if active)                    │
│    │   └─► audioSystem.updateMotorSounds()                 │
│    ├─► Update droneRef position/rotation                   │
│    ├─► cameraController.update()                           │
│    └─► gameStore.tick(dt) - update game time               │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Rendering                                               │
│    ├─► Environment (sky, clouds, fog)                      │
│    ├─► Terrain (procedural)                                │
│    ├─► Grid overlay                                        │
│    ├─► DroneModel (animated propellers, LEDs)              │
│    ├─► ParticleEffects (thrust)                            │
│    ├─► Mission markers / Tutorial markers                  │
│    └─► PostProcessingEffects                               │
└─────────────────────────────────────────────────────────────┘
```

---

## TASK REFERENCE

### TASK: Modify Physics

**Location:** `src/renderer/core/PhysicsEngine.ts`

1. **Change thrust calculation** → Edit `calculateTotalThrust()` (line 224)
2. **Adjust motor response** → Edit `motorResponseRate` (line 98)
3. **Change drag** → Edit `calculateDrag()` (line 272)
4. **Modify ground effect** → Edit `calculateGroundEffect()` (line 296)

### TASK: Add New Input Source

**Location:** `src/renderer/store/inputStore.ts`

1. Add to `InputSource` type in `types.ts`
2. Add event handlers in `initialize()` (line 77)
3. Add calculation branch in `calculateNormalizedInput()` (line 291)

### TASK: Add New Mission

**Location:** `src/renderer/systems/MissionSystem.ts`

1. Add mission in `initializeMissions()` (line 42)
2. Use helper methods: `createCheckpoint()`, `createLandingZone()`, `createHoverZone()`, `createCollectible()`

Example:
```typescript
this.addMission({
  id: 'my_mission',
  type: 'timeTrial',
  name: 'My Mission',
  description: 'Description here',
  parTime: 60,
  objectives: [
    this.createCheckpoint('cp1', { x: 10, y: 3, z: 0 }),
    this.createCheckpoint('cp2', { x: 20, y: 5, z: 10 }),
  ],
  rewards: { xp: 200, unlocks: [] },
});
```

### TASK: Add New Tutorial Task

**Location:** `src/renderer/systems/TutorialSystem.ts`

1. Add task to the appropriate level array in `initializeTasks()` (line 53)
2. Define `checkCompletion` function based on drone state

Example:
```typescript
{
  id: 'my_task',
  name: 'Task Name',
  description: 'What the player should do',
  instructions: ['Step 1', 'Step 2'],
  targetAltitude: 5,
  checkCompletion: (drone) => drone.position.y > 5,
}
```

### TASK: Modify 3D Drone Model

**Location:** `src/renderer/components/DroneModel.tsx`

- Motor positions: `motorPositions` array (line 33)
- Materials: `bodyMaterial`, `carbonMaterial`, `motorMaterial`, `propellerMaterial`
- LED colors: `ledColors` array (line 83)

### TASK: Add New Camera Mode

**Location:** `src/renderer/hooks/useCameraController.ts`

1. Add to `CameraMode` type (line 15)
2. Add config in `CameraConfig` interface (line 17)
3. Add defaults in `DEFAULT_CONFIG` (line 41)
4. Add case in `update()` switch (line 127)
5. Add to `MODES` array (line 88)

### TASK: Add Sound Effect

**Location:** `src/renderer/systems/AudioSystem.ts`

1. Generate buffer in `generateSoundEffects()` (line 159)
2. Play with `audioSystem.playEffect('effect_name')`

---

## COMMON ISSUES

| Issue | Solution |
|-------|----------|
| Physics "explosion" | Clamp `dt` to max 0.05 (already done in GameScene) |
| Audio not playing | Requires user interaction first (click/keypress) |
| Gamepad not detected | Check browser gamepad API support |
| Propellers not spinning | Check `motorRPM` values in DroneModel |
| Camera jumping | Ensure camera smoothing value > 0 |

---

## WHEN USER ASKS TO...

| Request | Action |
|---------|--------|
| "Make drone faster" | Increase `thrustMultiplier` in drone preset |
| "Add new level" | Add to `TutorialSystem.initializeTasks()` |
| "Create mission" | Add to `MissionSystem.initializeMissions()` |
| "Change controls" | Edit `DEFAULT_KEY_BINDINGS` in constants.ts |
| "Fix physics bug" | Check `PhysicsEngine.update()` and substep count |
| "Add camera mode" | Follow "Add New Camera Mode" task above |
| "Change scoring" | Edit `SCORING` constants |
| "Run tests" | `npm run test` or `npm run test:physics` |
| "Build for desktop" | `npm run build:electron` |

---

## TECH STACK

| Category | Technology |
|----------|------------|
| Framework | React 18 |
| 3D | Three.js + React Three Fiber + Drei |
| Physics | Custom Engine (500Hz) |
| State | Zustand |
| Audio | Web Audio API |
| Desktop | Electron 28 |
| Build | Vite 5 |
| Language | TypeScript 5.3 |
| Testing | Vitest |
| Linting | ESLint + Prettier |

---

## REPOSITORY INFO

- **Name:** Aetherwing Drone Simulator
- **Package:** `aetherwing` v1.0.0
- **Entry:** `npm run dev` or `npm run electron:dev`
- **Build:** `npm run build:electron`
- **GitHub:** https://github.com/Maca2024/DRONESIMULATOR

---

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║      ___   _____  _______ _______ _____   _  _  _  _______ __     ║
║     / _ \ |  _  ||__   __|__   __|  __ \ | || || ||__   __|  \    ║
║    / /_\ \| |_| |   | |     | |  | |__) || || || |   | |  | . \   ║
║    |  _  ||  _  /   | |     | |  |  ___/ | || || |   | |  | |\ \  ║
║    | | | || | \ \   | |     | |  | |     | || || |   | |  | | \ \ ║
║    |_| |_||_|  \_\  |_|     |_|  |_|     |_||_||_|   |_|  |_|  \_\║
║                                                                   ║
║                  STRATEGIC DRONE SIMULATOR                        ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

*"Master the skies, one throttle input at a time."*
