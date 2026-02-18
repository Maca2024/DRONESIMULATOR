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
import { ControlsHint } from './ui/ControlsHint';
import { TutorialSystem } from './systems/TutorialSystem';
import { MissionSystem } from './systems/MissionSystem';

// Check WebGL support
function checkWebGLSupport(): { supported: boolean; message: string } {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      return { supported: true, message: '' };
    }
    return {
      supported: false,
      message: 'WebGL is not supported by your browser or graphics driver.'
    };
  } catch (e) {
    return {
      supported: false,
      message: 'WebGL check failed: ' + (e instanceof Error ? e.message : 'Unknown error')
    };
  }
}

// WebGL Error Screen component
function WebGLError({ message }: { message: string }): JSX.Element {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '20px',
      textAlign: 'center'
    }}>
      <div style={{
        background: 'rgba(255, 68, 68, 0.1)',
        border: '2px solid #ff4444',
        borderRadius: '12px',
        padding: '40px',
        maxWidth: '600px'
      }}>
        <h1 style={{
          color: '#ff4444',
          marginBottom: '20px',
          fontSize: '28px'
        }}>
          ⚠️ WebGL Not Available
        </h1>
        <p style={{
          color: '#ccc',
          marginBottom: '30px',
          fontSize: '16px',
          lineHeight: '1.6'
        }}>
          {message}
        </p>
        <div style={{
          background: 'rgba(0, 255, 136, 0.1)',
          border: '1px solid #00ff88',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'left'
        }}>
          <h3 style={{ color: '#00ff88', marginBottom: '15px' }}>Try these solutions:</h3>
          <ul style={{ color: '#aaa', lineHeight: '2', paddingLeft: '20px' }}>
            <li>Update your graphics drivers</li>
            <li>Enable hardware acceleration in browser settings</li>
            <li>Try a different browser (Chrome, Firefox, Edge)</li>
            <li>Check if WebGL is disabled in browser flags</li>
            <li>Restart your browser after making changes</li>
          </ul>
        </div>
        <button
          onClick={() => window.open('https://get.webgl.org/', '_blank')}
          style={{
            marginTop: '30px',
            padding: '12px 24px',
            background: '#00ff88',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            color: '#000'
          }}
        >
          Test WebGL Support
        </button>
      </div>
    </div>
  );
}

function App(): JSX.Element {
  // All hooks must be called before any conditional returns
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

  // Check WebGL support (after all hooks)
  const webglCheck = checkWebGLSupport();
  if (!webglCheck.supported) {
    return <WebGLError message={webglCheck.message} />;
  }

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
          tabIndex={-1}
          style={{ outline: 'none' }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Suspense fallback={null}>
            {currentScreen !== 'mainMenu' && currentScreen !== 'settings' && <GameScene />}
          </Suspense>
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div className="ui-overlay">
        <Suspense fallback={<LoadingScreen />}>
          {currentScreen === 'mainMenu' && <MainMenu />}
          {currentScreen === 'settings' && <SettingsPanel />}
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
