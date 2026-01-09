import { useGameStore } from '../store/gameStore';
import styles from './MainMenu.module.css';

export function MainMenu(): JSX.Element {
  const setScreen = useGameStore((state) => state.setScreen);
  const startGame = useGameStore((state) => state.startGame);

  const handleFreePlay = (): void => {
    startGame('freePlay');
  };

  const handleTutorial = (): void => {
    // TODO: Implement tutorial flow
    startGame('freePlay');
  };

  const handleSettings = (): void => {
    setScreen('settings');
  };

  return (
    <div className={styles.container}>
      <div className={styles.background} />

      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>AETHERWING</h1>
          <p className={styles.subtitle}>Drone Simulator</p>
        </div>

        <nav className={styles.menu}>
          <button className={styles.menuButton} onClick={handleFreePlay}>
            <span className={styles.buttonIcon}>🚁</span>
            <span className={styles.buttonText}>Free Flight</span>
          </button>

          <button className={styles.menuButton} onClick={handleTutorial}>
            <span className={styles.buttonIcon}>📚</span>
            <span className={styles.buttonText}>Tutorial</span>
          </button>

          <button className={styles.menuButton} onClick={handleSettings}>
            <span className={styles.buttonIcon}>⚙️</span>
            <span className={styles.buttonText}>Settings</span>
          </button>

          <button className={styles.menuButton} disabled>
            <span className={styles.buttonIcon}>🏆</span>
            <span className={styles.buttonText}>Missions</span>
            <span className={styles.comingSoon}>Coming Soon</span>
          </button>
        </nav>

        <div className={styles.footer}>
          <p className={styles.version}>v1.0.0</p>
          <p className={styles.controls}>Press ESC for menu • WASD to fly</p>
        </div>
      </div>
    </div>
  );
}
