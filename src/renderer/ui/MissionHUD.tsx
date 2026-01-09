/**
 * MissionHUD - Displays mission objectives and progress
 */

import type { MissionState } from '../systems/MissionSystem';
import type { MissionObjective } from '@shared/types';
import styles from './MissionHUD.module.css';

interface MissionHUDProps {
  missionState: MissionState | null;
  nextObjective: MissionObjective | null;
  dronePosition: { x: number; y: number; z: number };
}

export function MissionHUD({
  missionState,
  nextObjective,
  dronePosition,
}: MissionHUDProps): JSX.Element | null {
  if (!missionState) {
    return null;
  }

  const { mission, currentTime, objectivesCompleted, score, crashes, isComplete, isPassed } =
    missionState;

  const totalObjectives = mission.objectives.filter((o) => o.required).length;
  const progress = (objectivesCompleted / totalObjectives) * 100;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const getDistanceToObjective = (): string => {
    if (!nextObjective) return '-';
    const dx = nextObjective.position.x - dronePosition.x;
    const dy = nextObjective.position.y - dronePosition.y;
    const dz = nextObjective.position.z - dronePosition.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    return `${dist.toFixed(1)}m`;
  };

  const getDirectionArrow = (): string => {
    if (!nextObjective) return '';
    const dx = nextObjective.position.x - dronePosition.x;
    const dz = nextObjective.position.z - dronePosition.z;
    const angle = Math.atan2(dx, dz) * (180 / Math.PI);

    // Return arrow based on relative direction
    if (angle > -22.5 && angle <= 22.5) return '↑';
    if (angle > 22.5 && angle <= 67.5) return '↗';
    if (angle > 67.5 && angle <= 112.5) return '→';
    if (angle > 112.5 && angle <= 157.5) return '↘';
    if (angle > 157.5 || angle <= -157.5) return '↓';
    if (angle > -157.5 && angle <= -112.5) return '↙';
    if (angle > -112.5 && angle <= -67.5) return '←';
    if (angle > -67.5 && angle <= -22.5) return '↖';
    return '•';
  };

  return (
    <div className={styles.missionHud}>
      {/* Mission header */}
      <div className={styles.missionHeader}>
        <div className={styles.missionName}>{mission.name}</div>
        <div className={styles.missionType}>{mission.type.toUpperCase()}</div>
      </div>

      {/* Time and score */}
      <div className={styles.timeScore}>
        <div className={styles.timeContainer}>
          <span className={styles.timeLabel}>TIME</span>
          <span
            className={`${styles.time} ${
              currentTime > mission.parTime ? styles.overtime : ''
            }`}
          >
            {formatTime(currentTime)}
          </span>
          <span className={styles.parTime}>Par: {formatTime(mission.parTime)}</span>
        </div>
        <div className={styles.scoreContainer}>
          <span className={styles.scoreLabel}>SCORE</span>
          <span className={styles.scoreValue}>{score.toLocaleString()}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className={styles.progressSection}>
        <div className={styles.progressHeader}>
          <span>Objectives</span>
          <span>
            {objectivesCompleted}/{totalObjectives}
          </span>
        </div>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Objective list */}
      <div className={styles.objectives}>
        {mission.objectives.map((obj) => (
          <div
            key={obj.id}
            className={`${styles.objective} ${
              obj.completed ? styles.completed : ''
            } ${nextObjective?.id === obj.id ? styles.current : ''}`}
          >
            <span className={styles.checkmark}>
              {obj.completed ? '✓' : nextObjective?.id === obj.id ? '›' : '○'}
            </span>
            <span className={styles.objectiveType}>{obj.type}</span>
            {!obj.completed && nextObjective?.id === obj.id && (
              <span className={styles.distance}>{getDistanceToObjective()}</span>
            )}
          </div>
        ))}
      </div>

      {/* Next objective indicator */}
      {nextObjective && !isComplete && (
        <div className={styles.nextObjective}>
          <div className={styles.directionArrow}>{getDirectionArrow()}</div>
          <div className={styles.objectiveInfo}>
            <span className={styles.nextLabel}>NEXT</span>
            <span className={styles.nextType}>{nextObjective.type}</span>
            <span className={styles.nextDistance}>{getDistanceToObjective()}</span>
          </div>
        </div>
      )}

      {/* Crashes counter */}
      {crashes > 0 && (
        <div className={styles.crashes}>
          <span className={styles.crashIcon}>💥</span>
          <span className={styles.crashCount}>{crashes}</span>
        </div>
      )}

      {/* Mission complete overlay */}
      {isComplete && (
        <div className={`${styles.completeOverlay} ${isPassed ? styles.passed : styles.failed}`}>
          <div className={styles.completeTitle}>
            {isPassed ? 'MISSION COMPLETE!' : 'MISSION FAILED'}
          </div>
          <div className={styles.completeStats}>
            <div>Time: {formatTime(currentTime)}</div>
            <div>Score: {score.toLocaleString()}</div>
            <div>Crashes: {crashes}</div>
          </div>
        </div>
      )}
    </div>
  );
}
