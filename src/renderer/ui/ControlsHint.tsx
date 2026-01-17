/**
 * ControlsHint - Shows keyboard controls overlay
 */

import { useState, useEffect } from 'react';
import styles from './ControlsHint.module.css';

interface ControlGroup {
  title: string;
  controls: { key: string; action: string }[];
}

const CONTROL_GROUPS: ControlGroup[] = [
  {
    title: 'Movement',
    controls: [
      { key: 'W / S', action: 'Pitch Forward / Back' },
      { key: 'A / D', action: 'Roll Left / Right' },
      { key: 'Q / E', action: 'Yaw Left / Right' },
      { key: 'SPACE', action: 'Increase Throttle' },
      { key: 'SHIFT', action: 'Decrease Throttle' },
    ],
  },
  {
    title: 'Controls',
    controls: [
      { key: 'R', action: 'Arm' },
      { key: 'T', action: 'Disarm' },
      { key: '1 / 2 / 3', action: 'Flight Mode' },
      { key: 'ESC / P', action: 'Pause' },
      { key: 'H', action: 'Toggle Hints' },
    ],
  },
  {
    title: 'Camera',
    controls: [
      { key: 'C', action: 'Cycle Camera Mode' },
      { key: '4', action: 'Chase Camera' },
      { key: '5', action: 'FPV Camera' },
      { key: '6', action: 'Orbit Camera' },
      { key: '7', action: 'Cinematic Camera' },
    ],
  },
];

export function ControlsHint(): JSX.Element {
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // Listen for H key to toggle visibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.code === 'KeyH' && !e.repeat) {
        setIsVisible((v) => !v);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-hide after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) {
    return (
      <button className={styles.showButton} onClick={() => setIsVisible(true)}>
        ?
      </button>
    );
  }

  return (
    <div className={`${styles.container} ${isExpanded ? styles.expanded : ''}`}>
      <div className={styles.header}>
        <span className={styles.title}>Controls</span>
        <div className={styles.headerActions}>
          <button
            className={styles.expandButton}
            onClick={() => setIsExpanded((e) => !e)}
          >
            {isExpanded ? '−' : '+'}
          </button>
          <button
            className={styles.closeButton}
            onClick={() => setIsVisible(false)}
          >
            ×
          </button>
        </div>
      </div>

      {isExpanded ? (
        <div className={styles.expandedContent}>
          {CONTROL_GROUPS.map((group) => (
            <div key={group.title} className={styles.group}>
              <h3 className={styles.groupTitle}>{group.title}</h3>
              <div className={styles.controlList}>
                {group.controls.map((control) => (
                  <div key={control.key} className={styles.control}>
                    <span className={styles.key}>{control.key}</span>
                    <span className={styles.action}>{control.action}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.compactContent}>
          <span className={styles.compactHint}>WASD + SPACE to fly</span>
          <span className={styles.compactHint}>R to arm • T to disarm • C for camera • ESC to pause</span>
          <span className={styles.compactHint}>Press H for full controls</span>
        </div>
      )}
    </div>
  );
}
