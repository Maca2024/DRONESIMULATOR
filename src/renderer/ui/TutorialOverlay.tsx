/**
 * TutorialOverlay - Displays tutorial instructions and progress
 */

import type { TutorialTask, TutorialProgress } from '../systems/TutorialSystem';
import styles from './TutorialOverlay.module.css';

interface TutorialOverlayProps {
  task: TutorialTask | null;
  progress: TutorialProgress;
  onSkip: () => void;
  onReset: () => void;
}

export function TutorialOverlay({
  task,
  progress,
  onSkip,
  onReset,
}: TutorialOverlayProps): JSX.Element | null {
  if (!task) {
    return null;
  }

  return (
    <div className={styles.overlay}>
      {/* Level indicator */}
      <div className={styles.levelBadge}>
        <span className={styles.levelLabel}>
          {progress.currentLevel.toUpperCase()}
        </span>
        <span className={styles.taskNumber}>
          Task {progress.currentTaskIndex + 1}
        </span>
      </div>

      {/* Task panel */}
      <div className={styles.taskPanel}>
        <h2 className={styles.taskName}>{task.name}</h2>
        <p className={styles.taskDescription}>{task.description}</p>

        <div className={styles.instructions}>
          <h3 className={styles.instructionsTitle}>Instructions:</h3>
          <ul className={styles.instructionList}>
            {task.instructions.map((instruction, index) => (
              <li key={index} className={styles.instruction}>
                {instruction}
              </li>
            ))}
          </ul>
        </div>

        {/* Progress bar */}
        {task.targetDuration && (
          <div className={styles.progressContainer}>
            <div className={styles.progressLabel}>Hold Progress</div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{
                  width: `${Math.min(
                    100,
                    (progress.holdTimer / task.targetDuration) * 100
                  )}%`,
                }}
              />
            </div>
            <div className={styles.progressTime}>
              {progress.holdTimer.toFixed(1)}s / {task.targetDuration}s
            </div>
          </div>
        )}

        {/* Controls */}
        <div className={styles.controls}>
          <button className={styles.resetBtn} onClick={onReset}>
            Retry Task
          </button>
          <button className={styles.skipBtn} onClick={onSkip}>
            Skip Task
          </button>
        </div>

        {/* Attempts */}
        {progress.attempts > 0 && (
          <div className={styles.attempts}>
            Attempts: {progress.attempts}
          </div>
        )}
      </div>

      {/* Target indicator */}
      {task.targetAltitude && (
        <div
          className={styles.altitudeIndicator}
          style={{ bottom: `${Math.min(80, task.targetAltitude * 5)}%` }}
        >
          <div className={styles.altitudeLine} />
          <span className={styles.altitudeLabel}>
            Target: {task.targetAltitude}m
          </span>
        </div>
      )}
    </div>
  );
}
