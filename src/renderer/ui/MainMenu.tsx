import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { MissionSystem } from '../systems/MissionSystem';
import styles from './MainMenu.module.css';
import type { TutorialLevel, Mission } from '@shared/types';
import { TUTORIAL_LEVELS } from '@shared/constants';

// Create mission system instance for menu
const missionSystem = new MissionSystem();

export function MainMenu(): JSX.Element {
  const setScreen = useGameStore((state) => state.setScreen);
  const startGame = useGameStore((state) => state.startGame);

  const [activeSubmenu, setActiveSubmenu] = useState<'none' | 'tutorial' | 'missions'>('none');

  const handleFreePlay = (): void => {
    startGame('freePlay');
  };

  const handleTutorialSelect = (level: TutorialLevel): void => {
    // Store selected level for tutorial system
    sessionStorage.setItem('tutorialLevel', level);
    startGame('freePlay'); // Uses freePlay screen with tutorial overlay
    setScreen('tutorial');
  };

  const handleMissionSelect = (mission: Mission): void => {
    startGame('mission', mission);
  };

  const handleSettings = (): void => {
    setScreen('settings');
  };

  const tutorialLevels: TutorialLevel[] = ['novice', 'beginner', 'intermediate', 'advanced', 'expert'];
  const missions = missionSystem.getAllMissions();

  return (
    <div className={styles.container}>
      <div className={styles.background} />

      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>AETHERWING</h1>
          <p className={styles.subtitle}>Drone Simulator</p>
        </div>

        {activeSubmenu === 'none' && (
          <nav className={styles.menu}>
            <button className={styles.menuButton} onClick={handleFreePlay}>
              <span className={styles.buttonIcon}>🚁</span>
              <span className={styles.buttonText}>Free Flight</span>
            </button>

            <button className={styles.menuButton} onClick={() => setActiveSubmenu('tutorial')}>
              <span className={styles.buttonIcon}>📚</span>
              <span className={styles.buttonText}>Tutorial</span>
            </button>

            <button className={styles.menuButton} onClick={() => setActiveSubmenu('missions')}>
              <span className={styles.buttonIcon}>🏆</span>
              <span className={styles.buttonText}>Missions</span>
            </button>

            <button className={styles.menuButton} onClick={handleSettings}>
              <span className={styles.buttonIcon}>⚙️</span>
              <span className={styles.buttonText}>Settings</span>
            </button>
          </nav>
        )}

        {activeSubmenu === 'tutorial' && (
          <div className={styles.submenu}>
            <h2 className={styles.submenuTitle}>Select Tutorial Level</h2>
            <div className={styles.levelGrid}>
              {tutorialLevels.map((level) => {
                const info = TUTORIAL_LEVELS[level];
                return (
                  <button
                    key={level}
                    className={styles.levelButton}
                    onClick={() => handleTutorialSelect(level)}
                  >
                    <span className={styles.levelName}>{info.name}</span>
                    <span className={styles.levelDesc}>{info.description}</span>
                  </button>
                );
              })}
            </div>
            <button
              className={styles.backButton}
              onClick={() => setActiveSubmenu('none')}
            >
              Back
            </button>
          </div>
        )}

        {activeSubmenu === 'missions' && (
          <div className={styles.submenu}>
            <h2 className={styles.submenuTitle}>Select Mission</h2>
            <div className={styles.missionGrid}>
              {missions.map((mission) => (
                <button
                  key={mission.id}
                  className={styles.missionButton}
                  onClick={() => handleMissionSelect(mission)}
                >
                  <span className={styles.missionType}>{mission.type}</span>
                  <span className={styles.missionName}>{mission.name}</span>
                  <span className={styles.missionDesc}>{mission.description}</span>
                  <span className={styles.missionPar}>Par: {mission.parTime}s</span>
                </button>
              ))}
            </div>
            <button
              className={styles.backButton}
              onClick={() => setActiveSubmenu('none')}
            >
              Back
            </button>
          </div>
        )}

        <div className={styles.footer}>
          <p className={styles.version}>v1.0.0</p>
          <p className={styles.controls}>Press ESC for menu • WASD to fly • SPACE for throttle</p>
        </div>
      </div>
    </div>
  );
}
