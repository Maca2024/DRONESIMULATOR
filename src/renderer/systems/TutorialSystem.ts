/**
 * TutorialSystem - Progressive flight training
 *
 * Levels:
 * 1. Novice - Basic throttle control, takeoff/landing
 * 2. Beginner - Yaw and forward/backward movement
 * 3. Intermediate - Banking turns, FPV basics
 * 4. Advanced - Acro mode introduction
 * 5. Expert - Advanced maneuvers
 */

import type { TutorialLevel, DroneState, NormalizedInput, Vector3 } from '@shared/types';
import { TUTORIAL_LEVELS } from '@shared/constants';

export interface TutorialTask {
  id: string;
  name: string;
  description: string;
  instructions: string[];
  targetPosition?: Vector3;
  targetAltitude?: number;
  targetDuration?: number;
  checkCompletion: (drone: DroneState, input: NormalizedInput, elapsed: number) => boolean;
}

export interface TutorialProgress {
  currentLevel: TutorialLevel;
  currentTaskIndex: number;
  taskProgress: number; // 0-100
  holdTimer: number;
  attempts: number;
  completedTasks: string[];
}

export class TutorialSystem {
  private progress: TutorialProgress;
  private tasks: Map<TutorialLevel, TutorialTask[]>;

  constructor() {
    this.progress = {
      currentLevel: 'novice',
      currentTaskIndex: 0,
      taskProgress: 0,
      holdTimer: 0,
      attempts: 0,
      completedTasks: [],
    };

    this.tasks = new Map();
    this.initializeTasks();
  }

  private initializeTasks(): void {
    // NOVICE LEVEL - Basic throttle control
    this.tasks.set('novice', [
      {
        id: 'throttle_intro',
        name: 'Throttle Introduction',
        description: 'Learn to control the throttle',
        instructions: [
          'Hold SPACE to increase throttle',
          'Release to let the drone descend',
          'Try to lift off the ground',
        ],
        targetAltitude: 2,
        checkCompletion: (drone) => drone.position.y > 2,
      },
      {
        id: 'hover_practice',
        name: 'Hover Practice',
        description: 'Maintain a steady hover at 3 meters',
        instructions: [
          'Lift off and hover at the target altitude',
          'Hold steady for 3 seconds',
          'Green indicator shows target height',
        ],
        targetAltitude: 3,
        targetDuration: 3,
        checkCompletion: (drone, _, elapsed) => {
          const inRange = Math.abs(drone.position.y - 3) < 0.5;
          return inRange && elapsed > 3;
        },
      },
      {
        id: 'landing_practice',
        name: 'Precision Landing',
        description: 'Land gently on the landing pad',
        instructions: [
          'Slowly reduce throttle',
          'Land on the H-marked pad',
          'Touch down with low velocity',
        ],
        targetPosition: { x: 0, y: 0.2, z: 0 },
        checkCompletion: (drone) => {
          const nearPad =
            Math.abs(drone.position.x) < 2 &&
            Math.abs(drone.position.z) < 2 &&
            drone.position.y < 0.3;
          const slowEnough =
            Math.abs(drone.velocity.y) < 0.5 &&
            Math.abs(drone.velocity.x) < 0.3 &&
            Math.abs(drone.velocity.z) < 0.3;
          return nearPad && slowEnough;
        },
      },
    ]);

    // BEGINNER LEVEL - Yaw and movement
    this.tasks.set('beginner', [
      {
        id: 'yaw_intro',
        name: 'Yaw Control',
        description: 'Learn to rotate the drone',
        instructions: [
          'Press Q to rotate left',
          'Press E to rotate right',
          'Complete a 180-degree turn',
        ],
        checkCompletion: (drone) => {
          // Check if drone has rotated significantly
          const yaw = Math.atan2(
            2 * (drone.rotation.w * drone.rotation.y + drone.rotation.x * drone.rotation.z),
            1 - 2 * (drone.rotation.y * drone.rotation.y + drone.rotation.z * drone.rotation.z)
          );
          return Math.abs(yaw) > Math.PI * 0.8;
        },
      },
      {
        id: 'forward_back',
        name: 'Forward & Backward',
        description: 'Move forward and backward',
        instructions: [
          'Press W to pitch forward (move forward)',
          'Press S to pitch back (move backward)',
          'Fly to the marker and back',
        ],
        targetPosition: { x: 0, y: 3, z: 15 },
        checkCompletion: (drone) => {
          const reachedTarget = drone.position.z > 12;
          return reachedTarget;
        },
      },
      {
        id: 'strafe',
        name: 'Left & Right Movement',
        description: 'Move left and right',
        instructions: [
          'Press A to roll left',
          'Press D to roll right',
          'Navigate through the markers',
        ],
        checkCompletion: (drone) => {
          return Math.abs(drone.position.x) > 8;
        },
      },
      {
        id: 'four_point_nav',
        name: 'Four-Point Navigation',
        description: 'Fly to all four corners',
        instructions: [
          'Visit each corner marker',
          'Maintain a steady altitude',
          'Return to the center pad',
        ],
        checkCompletion: (drone) => {
          // Check if near center after visiting corners
          const nearCenter =
            Math.abs(drone.position.x) < 3 &&
            Math.abs(drone.position.z) < 3;
          const hasFlownFar =
            Math.abs(drone.position.x) > 5 ||
            Math.abs(drone.position.z) > 5;
          return nearCenter && hasFlownFar;
        },
      },
    ]);

    // INTERMEDIATE LEVEL - Banking and FPV
    this.tasks.set('intermediate', [
      {
        id: 'banking_turns',
        name: 'Banking Turns',
        description: 'Coordinated turns using roll and yaw',
        instructions: [
          'Combine roll and yaw for smooth turns',
          'Maintain altitude during turns',
          'Complete a full circle',
        ],
        checkCompletion: (_drone, _input, elapsed) => elapsed > 20,
      },
      {
        id: 'figure_eight',
        name: 'Figure Eight',
        description: 'Fly a figure-8 pattern through gates',
        instructions: [
          'Fly through the left gate',
          'Turn and fly through the right gate',
          'Connect them in a smooth figure-8',
        ],
        checkCompletion: (_drone, _input, elapsed) => elapsed > 30,
      },
      {
        id: 'precision_hover',
        name: 'Precision Hover Box',
        description: 'Hold position in a small area',
        instructions: [
          'Hover inside the marked box',
          'Hold for 5 seconds',
          'Minimal movement allowed',
        ],
        targetPosition: { x: 0, y: 5, z: 0 },
        targetDuration: 5,
        checkCompletion: (drone, _, elapsed) => {
          const inBox =
            Math.abs(drone.position.x) < 1 &&
            Math.abs(drone.position.z) < 1 &&
            Math.abs(drone.position.y - 5) < 1;
          return inBox && elapsed > 5;
        },
      },
    ]);

    // ADVANCED LEVEL - Acro basics
    this.tasks.set('advanced', [
      {
        id: 'acro_intro',
        name: 'Acro Mode Introduction',
        description: 'First steps in acro/rate mode',
        instructions: [
          'Press 3 to switch to Acro mode',
          'Drone will not auto-level',
          'Practice maintaining control',
        ],
        checkCompletion: (drone) => drone.flightMode === 'acro',
      },
      {
        id: 'first_flip',
        name: 'First Flip',
        description: 'Complete your first flip!',
        instructions: [
          'Gain altitude (at least 15m)',
          'Quick stick movement for flip',
          'Level out and recover',
        ],
        checkCompletion: (_drone, _input, elapsed) => elapsed > 15,
      },
    ]);

    // EXPERT LEVEL - Advanced maneuvers
    this.tasks.set('expert', [
      {
        id: 'power_loop',
        name: 'Power Loop',
        description: 'Vertical loop with throttle control',
        instructions: [
          'Full throttle into climb',
          'Continue pulling back through inverted',
          'Manage throttle through the loop',
        ],
        checkCompletion: (_drone, _input, elapsed) => elapsed > 20,
      },
      {
        id: 'split_s',
        name: 'Split-S Maneuver',
        description: 'Roll inverted and pull through',
        instructions: [
          'Roll 180 degrees to inverted',
          'Pull back to complete half loop',
          'Exit in opposite direction',
        ],
        checkCompletion: (_drone, _input, elapsed) => elapsed > 15,
      },
    ]);
  }

  /**
   * Get current tutorial state
   */
  getProgress(): TutorialProgress {
    return { ...this.progress };
  }

  /**
   * Get current task
   */
  getCurrentTask(): TutorialTask | null {
    const levelTasks = this.tasks.get(this.progress.currentLevel);
    if (!levelTasks || this.progress.currentTaskIndex >= levelTasks.length) {
      return null;
    }
    return levelTasks[this.progress.currentTaskIndex];
  }

  /**
   * Get all tasks for current level
   */
  getLevelTasks(): TutorialTask[] {
    return this.tasks.get(this.progress.currentLevel) || [];
  }

  /**
   * Get level info
   */
  getLevelInfo(level: TutorialLevel): (typeof TUTORIAL_LEVELS)[TutorialLevel] {
    return TUTORIAL_LEVELS[level];
  }

  /**
   * Update tutorial progress
   */
  update(drone: DroneState, input: NormalizedInput, deltaTime: number): void {
    const currentTask = this.getCurrentTask();
    if (!currentTask) return;

    // Update hold timer if in target zone
    this.progress.holdTimer += deltaTime;

    // Check completion
    if (currentTask.checkCompletion(drone, input, this.progress.holdTimer)) {
      this.completeCurrentTask();
    }
  }

  /**
   * Complete current task and advance
   */
  private completeCurrentTask(): void {
    const currentTask = this.getCurrentTask();
    if (!currentTask) return;

    this.progress.completedTasks.push(currentTask.id);
    this.progress.currentTaskIndex++;
    this.progress.holdTimer = 0;
    this.progress.taskProgress = 0;

    // Check if level complete
    const levelTasks = this.tasks.get(this.progress.currentLevel);
    if (levelTasks && this.progress.currentTaskIndex >= levelTasks.length) {
      this.advanceLevel();
    }
  }

  /**
   * Advance to next level
   */
  private advanceLevel(): void {
    const levels: TutorialLevel[] = ['novice', 'beginner', 'intermediate', 'advanced', 'expert'];
    const currentIndex = levels.indexOf(this.progress.currentLevel);

    if (currentIndex < levels.length - 1) {
      this.progress.currentLevel = levels[currentIndex + 1];
      this.progress.currentTaskIndex = 0;
    }
  }

  /**
   * Skip current task
   */
  skipTask(): void {
    const levelTasks = this.tasks.get(this.progress.currentLevel);
    if (levelTasks && this.progress.currentTaskIndex < levelTasks.length - 1) {
      this.progress.currentTaskIndex++;
      this.progress.holdTimer = 0;
      this.progress.attempts++;
    }
  }

  /**
   * Reset current task
   */
  resetTask(): void {
    this.progress.holdTimer = 0;
    this.progress.taskProgress = 0;
    this.progress.attempts++;
  }

  /**
   * Set level directly (for unlocks)
   */
  setLevel(level: TutorialLevel): void {
    this.progress.currentLevel = level;
    this.progress.currentTaskIndex = 0;
    this.progress.holdTimer = 0;
  }

  /**
   * Check if level is unlocked
   */
  isLevelUnlocked(level: TutorialLevel): boolean {
    const levels: TutorialLevel[] = ['novice', 'beginner', 'intermediate', 'advanced', 'expert'];
    const targetIndex = levels.indexOf(level);
    const currentMaxIndex = levels.indexOf(this.progress.currentLevel);
    return targetIndex <= currentMaxIndex;
  }

  /**
   * Get completion percentage for level
   */
  getLevelCompletion(level: TutorialLevel): number {
    const levelTasks = this.tasks.get(level);
    if (!levelTasks) return 0;

    const completedCount = levelTasks.filter((task) =>
      this.progress.completedTasks.includes(task.id)
    ).length;

    return (completedCount / levelTasks.length) * 100;
  }
}
