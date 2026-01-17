import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useInputStore } from '../store/inputStore';
import styles from './HUD.module.css';

export function HUD(): JSX.Element {
  const drone = useGameStore((state) => state.drone);
  const score = useGameStore((state) => state.score);
  const missionTime = useGameStore((state) => state.missionTime);
  const comboMultiplier = useGameStore((state) => state.comboMultiplier);
  const input = useInputStore((state) => state.input);
  const pauseGame = useGameStore((state) => state.pauseGame);

  const [fps, setFps] = useState(60);
  const [showHelp, setShowHelp] = useState(true);
  const [musicOn, setMusicOn] = useState(false);

  // Auto-hide help after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHelp(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  // Toggle help with H key, track music with M key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent): void => {
      if (e.code === 'KeyH') setShowHelp(prev => !prev);
      if (e.code === 'KeyM') setMusicOn(prev => !prev);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // FPS counter
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();

    const updateFps = (): void => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
      }
      requestAnimationFrame(updateFps);
    };

    const animId = requestAnimationFrame(updateFps);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Keyboard shortcut for pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        pauseGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pauseGame]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const altitude = drone.position.y.toFixed(1);
  const speed = Math.sqrt(
    drone.velocity.x ** 2 + drone.velocity.y ** 2 + drone.velocity.z ** 2
  ).toFixed(1);

  return (
    <div className={styles.hud}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.flightInfo}>
          <div className={styles.infoItem}>
            <span className={styles.label}>ALT</span>
            <span className={styles.value}>{altitude}m</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>SPD</span>
            <span className={styles.value}>{speed}m/s</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>MODE</span>
            <span className={styles.value}>{drone.flightMode.toUpperCase()}</span>
          </div>
        </div>

        <div className={styles.timeScore}>
          <div className={styles.time}>{formatTime(missionTime)}</div>
          <div className={styles.score}>
            <span className={styles.scoreValue}>{score.toLocaleString()}</span>
            {comboMultiplier > 1 && (
              <span className={styles.combo}>x{comboMultiplier.toFixed(1)}</span>
            )}
          </div>
        </div>

        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.label}>FPS</span>
            <span className={styles.value}>{fps}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.label}>BAT</span>
            <span className={styles.value}>{Math.round(drone.batteryLevel)}%</span>
          </div>
        </div>
      </div>

      {/* Left side - Throttle */}
      <div className={styles.throttleContainer}>
        <div className={styles.throttleBar}>
          <div
            className={styles.throttleFill}
            style={{ height: `${input.throttle * 100}%` }}
          />
          <div className={styles.throttleMarker} style={{ bottom: '50%' }} />
        </div>
        <span className={styles.throttleLabel}>THR</span>
        <span className={styles.throttleValue}>{Math.round(input.throttle * 100)}%</span>
      </div>

      {/* Right side - Attitude indicator */}
      <div className={styles.attitudeContainer}>
        <div className={styles.attitudeIndicator}>
          <div
            className={styles.horizon}
            style={{
              transform: `rotate(${-input.roll * 30}deg) translateY(${input.pitch * 30}px)`,
            }}
          >
            <div className={styles.sky} />
            <div className={styles.ground} />
            <div className={styles.horizonLine} />
          </div>
          <div className={styles.centerMark} />
        </div>
      </div>

      {/* Bottom - Arm status */}
      <div className={styles.bottomBar}>
        <div className={`${styles.armStatus} ${drone.isArmed ? styles.armed : styles.disarmed}`}>
          {drone.isArmed ? '🟢 ARMED' : '🔴 DISARMED'}
        </div>
        <div className={styles.inputSource}>
          Input: {input.source.toUpperCase()}
        </div>
      </div>

      {/* Crosshair */}
      <div className={styles.crosshair}>
        <div className={styles.crosshairH} />
        <div className={styles.crosshairV} />
      </div>

      {/* Controls Help Overlay */}
      {showHelp && (
        <div className={styles.helpOverlay}>
          <div className={styles.helpTitle}>CONTROLS</div>
          <div className={styles.helpGrid}>
            <div className={styles.helpSection}>
              <div className={styles.helpSectionTitle}>Flight (Mouse)</div>
              <div className={styles.helpItem}><span>Move</span><span>Roll + Pitch</span></div>
              <div className={styles.helpItem}><span>Scroll</span><span>Throttle</span></div>
              <div className={styles.helpItem}><span>Left Click</span><span>Arm + Yaw</span></div>
              <div className={styles.helpItem}><span>Right Click</span><span>Pointer Lock</span></div>
            </div>
            <div className={styles.helpSection}>
              <div className={styles.helpSectionTitle}>Flight (Keyboard)</div>
              <div className={styles.helpItem}><span>W/S</span><span>Pitch</span></div>
              <div className={styles.helpItem}><span>A/D</span><span>Roll</span></div>
              <div className={styles.helpItem}><span>Q/E</span><span>Yaw</span></div>
              <div className={styles.helpItem}><span>Space/Shift</span><span>Throttle</span></div>
            </div>
            <div className={styles.helpSection}>
              <div className={styles.helpSectionTitle}>Actions</div>
              <div className={styles.helpItem}><span>R</span><span>Arm</span></div>
              <div className={styles.helpItem}><span>C</span><span>Camera Mode</span></div>
              <div className={styles.helpItem}><span>M</span><span>Music {musicOn ? 'ON' : 'OFF'}</span></div>
              <div className={styles.helpItem}><span>H</span><span>Toggle Help</span></div>
              <div className={styles.helpItem}><span>P/Esc</span><span>Pause</span></div>
            </div>
          </div>
          <div className={styles.helpFooter}>Press H to hide</div>
        </div>
      )}

      {/* Music indicator */}
      {musicOn && (
        <div className={styles.musicIndicator}>
          <span>🎵</span>
        </div>
      )}
    </div>
  );
}
