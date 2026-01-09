import { useGameStore } from '../store/gameStore';
import styles from './PauseMenu.module.css';

export function PauseMenu(): JSX.Element {
  const resumeGame = useGameStore((state) => state.resumeGame);
  const endGame = useGameStore((state) => state.endGame);
  const setScreen = useGameStore((state) => state.setScreen);

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <h2 className={styles.title}>PAUSED</h2>

        <div className={styles.menu}>
          <button className={styles.button} onClick={resumeGame}>
            Resume
          </button>
          <button className={styles.button} onClick={() => setScreen('settings')}>
            Settings
          </button>
          <button className={`${styles.button} ${styles.danger}`} onClick={endGame}>
            Quit to Menu
          </button>
        </div>

        <p className={styles.hint}>Press ESC or P to resume</p>
      </div>
    </div>
  );
}
