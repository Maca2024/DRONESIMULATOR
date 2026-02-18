import { describe, it, expect, beforeEach } from 'vitest';
import { TutorialSystem } from './TutorialSystem';
import type { DroneState, NormalizedInput } from '@shared/types';

const createDroneState = (overrides: Partial<DroneState> = {}): DroneState => ({
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  velocity: { x: 0, y: 0, z: 0 },
  angularVelocity: { x: 0, y: 0, z: 0 },
  motorRPM: [0, 0, 0, 0],
  batteryLevel: 100,
  isArmed: true,
  flightMode: 'angle',
  ...overrides,
});

const createInput = (overrides: Partial<NormalizedInput> = {}): NormalizedInput => ({
  throttle: 0,
  yaw: 0,
  pitch: 0,
  roll: 0,
  aux1: false,
  aux2: 0,
  aux3: 0,
  timestamp: 0,
  source: 'keyboard',
  ...overrides,
});

describe('TutorialSystem', () => {
  let tutorial: TutorialSystem;

  beforeEach(() => {
    tutorial = new TutorialSystem();
  });

  describe('initialization', () => {
    it('should start at novice level', () => {
      const progress = tutorial.getProgress();
      expect(progress.currentLevel).toBe('novice');
      expect(progress.currentTaskIndex).toBe(0);
    });

    it('should have empty completed tasks', () => {
      const progress = tutorial.getProgress();
      expect(progress.completedTasks).toEqual([]);
    });

    it('should have zero hold timer', () => {
      const progress = tutorial.getProgress();
      expect(progress.holdTimer).toBe(0);
    });
  });

  describe('getCurrentTask', () => {
    it('should return first novice task', () => {
      const task = tutorial.getCurrentTask();
      expect(task).not.toBeNull();
      expect(task!.id).toBe('throttle_intro');
      expect(task!.name).toBe('Throttle Introduction');
    });
  });

  describe('getLevelTasks', () => {
    it('should return novice tasks', () => {
      const tasks = tutorial.getLevelTasks();
      expect(tasks.length).toBe(3);
      expect(tasks[0].id).toBe('throttle_intro');
      expect(tasks[1].id).toBe('hover_practice');
      expect(tasks[2].id).toBe('landing_practice');
    });

    it('should return beginner tasks after level change', () => {
      tutorial.setLevel('beginner');
      const tasks = tutorial.getLevelTasks();
      expect(tasks.length).toBe(4);
      expect(tasks[0].id).toBe('yaw_intro');
    });
  });

  describe('getLevelInfo', () => {
    it('should return level metadata', () => {
      const info = tutorial.getLevelInfo('novice');
      expect(info).toBeDefined();
      expect(info.name).toBeDefined();
      expect(info.description).toBeDefined();
    });
  });

  describe('update and task completion', () => {
    it('should complete throttle_intro when altitude > 2', () => {
      const drone = createDroneState({ position: { x: 0, y: 3, z: 0 } });
      const input = createInput();

      tutorial.update(drone, input, 0.016);

      const progress = tutorial.getProgress();
      expect(progress.completedTasks).toContain('throttle_intro');
      expect(progress.currentTaskIndex).toBe(1);
    });

    it('should not complete throttle_intro when altitude < 2', () => {
      const drone = createDroneState({ position: { x: 0, y: 1, z: 0 } });
      const input = createInput();

      tutorial.update(drone, input, 0.016);

      const progress = tutorial.getProgress();
      expect(progress.completedTasks).not.toContain('throttle_intro');
      expect(progress.currentTaskIndex).toBe(0);
    });

    it('should complete hover_practice with correct altitude and time', () => {
      // First complete throttle_intro
      const drone1 = createDroneState({ position: { x: 0, y: 3, z: 0 } });
      tutorial.update(drone1, createInput(), 0.016);

      // Now at hover_practice - need altitude ~3 and elapsed > 3
      const drone2 = createDroneState({ position: { x: 0, y: 3.2, z: 0 } });
      // Accumulate enough hold time
      for (let i = 0; i < 200; i++) {
        tutorial.update(drone2, createInput(), 0.016);
      }

      const progress = tutorial.getProgress();
      expect(progress.completedTasks).toContain('hover_practice');
    });

    it('should complete landing_practice near pad with low velocity', () => {
      // Complete first two tasks
      const drone1 = createDroneState({ position: { x: 0, y: 3, z: 0 } });
      tutorial.update(drone1, createInput(), 0.016);

      // Accumulate time for hover
      const drone2 = createDroneState({ position: { x: 0, y: 3.0, z: 0 } });
      for (let i = 0; i < 200; i++) {
        tutorial.update(drone2, createInput(), 0.016);
      }

      // Now at landing_practice
      const landedDrone = createDroneState({
        position: { x: 0, y: 0.1, z: 0 },
        velocity: { x: 0, y: -0.1, z: 0 },
      });
      tutorial.update(landedDrone, createInput(), 0.016);

      const progress = tutorial.getProgress();
      expect(progress.completedTasks).toContain('landing_practice');
    });

    it('should advance to beginner level after completing all novice tasks', () => {
      // Complete throttle_intro
      tutorial.update(
        createDroneState({ position: { x: 0, y: 3, z: 0 } }),
        createInput(),
        0.016
      );

      // Complete hover_practice
      for (let i = 0; i < 200; i++) {
        tutorial.update(
          createDroneState({ position: { x: 0, y: 3.0, z: 0 } }),
          createInput(),
          0.016
        );
      }

      // Complete landing_practice
      tutorial.update(
        createDroneState({
          position: { x: 0, y: 0.1, z: 0 },
          velocity: { x: 0, y: -0.1, z: 0 },
        }),
        createInput(),
        0.016
      );

      const progress = tutorial.getProgress();
      expect(progress.currentLevel).toBe('beginner');
      expect(progress.currentTaskIndex).toBe(0);
    });
  });

  describe('skipTask', () => {
    it('should skip to next task', () => {
      tutorial.skipTask();
      const progress = tutorial.getProgress();
      expect(progress.currentTaskIndex).toBe(1);
      expect(progress.attempts).toBe(1);
    });

    it('should reset hold timer on skip', () => {
      tutorial.update(
        createDroneState({ position: { x: 0, y: 1, z: 0 } }),
        createInput(),
        1.0
      );
      tutorial.skipTask();
      expect(tutorial.getProgress().holdTimer).toBe(0);
    });

    it('should not skip past last task', () => {
      tutorial.skipTask(); // -> index 1
      tutorial.skipTask(); // -> index 2 (last novice task)
      tutorial.skipTask(); // should stay at 2
      expect(tutorial.getProgress().currentTaskIndex).toBe(2);
    });
  });

  describe('resetTask', () => {
    it('should reset hold timer and increment attempts', () => {
      tutorial.update(
        createDroneState({ position: { x: 0, y: 1, z: 0 } }),
        createInput(),
        1.0
      );
      tutorial.resetTask();
      const progress = tutorial.getProgress();
      expect(progress.holdTimer).toBe(0);
      expect(progress.taskProgress).toBe(0);
      expect(progress.attempts).toBe(1);
    });
  });

  describe('setLevel', () => {
    it('should set level directly', () => {
      tutorial.setLevel('intermediate');
      const progress = tutorial.getProgress();
      expect(progress.currentLevel).toBe('intermediate');
      expect(progress.currentTaskIndex).toBe(0);
      expect(progress.holdTimer).toBe(0);
    });

    it('should provide intermediate tasks', () => {
      tutorial.setLevel('intermediate');
      const task = tutorial.getCurrentTask();
      expect(task!.id).toBe('banking_turns');
    });

    it('should provide advanced tasks', () => {
      tutorial.setLevel('advanced');
      const task = tutorial.getCurrentTask();
      expect(task!.id).toBe('acro_intro');
    });

    it('should provide expert tasks', () => {
      tutorial.setLevel('expert');
      const task = tutorial.getCurrentTask();
      expect(task!.id).toBe('power_loop');
    });
  });

  describe('isLevelUnlocked', () => {
    it('should have novice unlocked by default', () => {
      expect(tutorial.isLevelUnlocked('novice')).toBe(true);
    });

    it('should not have beginner unlocked at novice', () => {
      expect(tutorial.isLevelUnlocked('beginner')).toBe(false);
    });

    it('should unlock levels up to current', () => {
      tutorial.setLevel('intermediate');
      expect(tutorial.isLevelUnlocked('novice')).toBe(true);
      expect(tutorial.isLevelUnlocked('beginner')).toBe(true);
      expect(tutorial.isLevelUnlocked('intermediate')).toBe(true);
      expect(tutorial.isLevelUnlocked('advanced')).toBe(false);
      expect(tutorial.isLevelUnlocked('expert')).toBe(false);
    });
  });

  describe('getLevelCompletion', () => {
    it('should return 0 for uncompleted level', () => {
      expect(tutorial.getLevelCompletion('novice')).toBe(0);
    });

    it('should track partial completion', () => {
      // Complete first task
      tutorial.update(
        createDroneState({ position: { x: 0, y: 3, z: 0 } }),
        createInput(),
        0.016
      );
      // Novice has 3 tasks, 1 completed = 33.33%
      expect(tutorial.getLevelCompletion('novice')).toBeCloseTo(33.33, 0);
    });

    it('should return 0 for nonexistent level tasks', () => {
      // Edge case: if somehow a level has no tasks
      expect(tutorial.getLevelCompletion('expert')).toBe(0);
    });
  });

  describe('advanced task completion', () => {
    it('should complete acro_intro when flight mode is acro', () => {
      tutorial.setLevel('advanced');
      const drone = createDroneState({ flightMode: 'acro' });
      tutorial.update(drone, createInput(), 0.016);
      expect(tutorial.getProgress().completedTasks).toContain('acro_intro');
    });

    it('should complete beginner yaw_intro with large rotation', () => {
      tutorial.setLevel('beginner');
      // Simulate large yaw rotation (quaternion for ~180deg around Y)
      const drone = createDroneState({
        rotation: { x: 0, y: 0.999, z: 0, w: 0.04 },
      });
      tutorial.update(drone, createInput(), 0.016);
      expect(tutorial.getProgress().completedTasks).toContain('yaw_intro');
    });

    it('should complete beginner forward_back when z > 12', () => {
      tutorial.setLevel('beginner');
      // Skip yaw_intro
      tutorial.skipTask();
      const drone = createDroneState({ position: { x: 0, y: 3, z: 15 } });
      tutorial.update(drone, createInput(), 0.016);
      expect(tutorial.getProgress().completedTasks).toContain('forward_back');
    });

    it('should complete beginner strafe when x > 8', () => {
      tutorial.setLevel('beginner');
      tutorial.skipTask(); // skip yaw_intro
      tutorial.skipTask(); // skip forward_back
      const drone = createDroneState({ position: { x: 10, y: 3, z: 0 } });
      tutorial.update(drone, createInput(), 0.016);
      expect(tutorial.getProgress().completedTasks).toContain('strafe');
    });
  });

  describe('getProgress returns a copy', () => {
    it('should not allow external mutation', () => {
      const progress = tutorial.getProgress();
      progress.currentLevel = 'expert';
      expect(tutorial.getProgress().currentLevel).toBe('novice');
    });
  });
});
