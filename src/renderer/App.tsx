import { Suspense, useEffect } from 'react';
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

function App(): JSX.Element {
  const currentScreen = useGameStore((state) => state.currentScreen);
  const initializeInput = useInputStore((state) => state.initialize);
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const accessibility = useSettingsStore((state) => state.settings.accessibility);

  // Initialize systems on mount
  useEffect(() => {
    initializeInput();
    loadSettings();
  }, [initializeInput, loadSettings]);

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
          {(currentScreen === 'freePlay' || currentScreen === 'mission') && <HUD />}
        </Suspense>
      </div>
    </>
  );
}

export default App;
