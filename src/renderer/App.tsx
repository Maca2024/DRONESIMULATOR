import { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGameStore } from './store/gameStore';
import { useInputStore } from './store/inputStore';
import { useSettingsStore } from './store/settingsStore';
import { MainMenu } from './ui/MainMenu';
import { HUD } from './ui/HUD';
import { PauseMenu } from './ui/PauseMenu';
import { SettingsPanel } from './ui/SettingsPanel';
import { GameScene } from './scenes/GameScene';
import { LoadingScreen } from './ui/LoadingScreen';
import { TutorialOverlay } from './ui/TutorialOverlay';
import { MissionHUD } from './ui/MissionHUD';
import { DroneSelectionScreen } from './ui/DroneSelectionScreen';
import { ControlsHint } from './ui/ControlsHint';
import { TutorialSystem } from './systems/TutorialSystem';
import { MissionSystem } from './systems/MissionSystem';

function App(): JSX.Element {
  const currentScreen = useGameStore((state) => state.currentScreen);
  const dronePosition = useGameStore((state) => state.drone.position);
  const initializeInput = useInputStore((state) => state.initialize);
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const accessibility = useSettingsStore((state) => state.settings.accessibility);

  // Game systems (shared state for UI)
  const tutorialSystem = useRef(new TutorialSystem());
  const missionSystem = useRef(new MissionSystem());

  // UI state
  const [tutorialTask, setTutorialTask] = useState(tutorialSystem.current.getCurrentTask());
  const [tutorialProgress, setTutorialProgress] = useState(tutorialSystem.current.getProgress());
  const [missionState, setMissionState] = useState(missionSystem.current.getCurrentMissionState());

  // Initialize systems on mount
  useEffect(() => {
    initializeInput();
    loadSettings();
  }, [initializeInput, loadSettings]);

  // Update UI state periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentScreen === 'tutorial') {
        setTutorialTask(tutorialSystem.current.getCurrentTask());
        setTutorialProgress(tutorialSystem.current.getProgress());
      }
      if (currentScreen === 'mission') {
        setMissionState(missionSystem.current.getCurrentMissionState());
      }
    }, 100);

    return () => clearInterval(interval);
  }, [currentScreen]);

  // Tutorial handlers
  const handleSkipTask = useCallback(() => {
    tutorialSystem.current.skipTask();
    setTutorialTask(tutorialSystem.current.getCurrentTask());
    setTutorialProgress(tutorialSystem.current.getProgress());
  }, []);

  const handleResetTask = useCallback(() => {
    tutorialSystem.current.resetTask();
    setTutorialProgress(tutorialSystem.current.getProgress());
  }, []);

  // Apply accessibility classes
  useEffect(() => {
    const root = document.documentElement;

    if (accessibility.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    if (accessibility.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }

    root.style.setProperty('--ui-scale', accessibility.uiScale.toString());
  }, [accessibility]);

  const isPlayingScreen =
    currentScreen === 'freePlay' ||
    currentScreen === 'mission' ||
    currentScreen === 'tutorial';

  return (
    <>
      {/* 3D Canvas */}
      <div className="canvas-container">
        <Canvas
          camera={{ position: [0, 5, 10], fov: 75 }}
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
          }}
        >
          <Suspense fallback={null}>
            {currentScreen !== 'mainMenu' && currentScreen !== 'settings' && currentScreen !== 'droneSelect' && <GameScene />}
          </Suspense>
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div className="ui-overlay">
        <Suspense fallback={<LoadingScreen />}>
          {currentScreen === 'mainMenu' && <MainMenu />}
          {currentScreen === 'settings' && <SettingsPanel />}
          {currentScreen === 'droneSelect' && <DroneSelectionScreen />}
          {currentScreen === 'pause' && <PauseMenu />}
          {isPlayingScreen && <HUD />}

          {/* Tutorial Overlay */}
          {currentScreen === 'tutorial' && (
            <TutorialOverlay
              task={tutorialTask}
              progress={tutorialProgress}
              onSkip={handleSkipTask}
              onReset={handleResetTask}
            />
          )}

          {/* Mission HUD */}
          {currentScreen === 'mission' && (
            <MissionHUD
              missionState={missionState}
              nextObjective={missionSystem.current.getNextObjective()}
              dronePosition={dronePosition}
            />
          )}

          {/* Controls Hint */}
          {isPlayingScreen && <ControlsHint />}
        </Suspense>
      </div>
    </>
  );
}

export default App;
