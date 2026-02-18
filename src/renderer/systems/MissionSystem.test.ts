import { describe, it, expect, beforeEach } from 'vitest';
import { MissionSystem } from './MissionSystem';
import type { DroneState } from '@shared/types';
import { SCORING } from '@shared/constants';

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

describe('MissionSystem', () => {
  let missions: MissionSystem;

  beforeEach(() => {
    missions = new MissionSystem();
  });

  describe('initialization', () => {
    it('should have missions loaded', () => {
      const allMissions = missions.getAllMissions();
      expect(allMissions.length).toBeGreaterThan(0);
    });

    it('should have time trial missions', () => {
      const ttMissions = missions.getMissionsByType('timeTrial');
      expect(ttMissions.length).toBeGreaterThan(0);
    });

    it('should have precision missions', () => {
      const prMissions = missions.getMissionsByType('precision');
      expect(prMissions.length).toBeGreaterThan(0);
    });

    it('should have search missions', () => {
      const srMissions = missions.getMissionsByType('search');
      expect(srMissions.length).toBeGreaterThan(0);
    });

    it('should have delivery missions', () => {
      const dlMissions = missions.getMissionsByType('delivery');
      expect(dlMissions.length).toBeGreaterThan(0);
    });

    it('should have survival missions', () => {
      const svMissions = missions.getMissionsByType('survival');
      expect(svMissions.length).toBeGreaterThan(0);
    });
  });

  describe('getMission', () => {
    it('should get mission by ID', () => {
      const mission = missions.getMission('tt_basics');
      expect(mission).toBeDefined();
      expect(mission!.name).toBe('First Flight');
    });

    it('should return undefined for invalid ID', () => {
      expect(missions.getMission('nonexistent')).toBeUndefined();
    });
  });

  describe('startMission', () => {
    it('should start a valid mission', () => {
      const result = missions.startMission('tt_basics');
      expect(result).toBe(true);
    });

    it('should fail for invalid mission ID', () => {
      const result = missions.startMission('nonexistent');
      expect(result).toBe(false);
    });

    it('should set up mission state', () => {
      missions.startMission('tt_basics');
      const state = missions.getCurrentMissionState();
      expect(state).not.toBeNull();
      expect(state!.score).toBe(0);
      expect(state!.crashes).toBe(0);
      expect(state!.isComplete).toBe(false);
      expect(state!.objectivesCompleted).toBe(0);
    });

    it('should reset objectives on start', () => {
      missions.startMission('tt_basics');
      const state = missions.getCurrentMissionState();
      state!.mission.objectives.forEach((obj) => {
        expect(obj.completed).toBe(false);
      });
    });
  });

  describe('update - checkpoint objectives', () => {
    it('should complete checkpoint when drone is near', () => {
      missions.startMission('tt_basics');
      // First checkpoint is at {x: 10, y: 3, z: 0} with radius 3
      const drone = createDroneState({ position: { x: 10, y: 3, z: 0 } });
      missions.update(drone, 0.016);

      const state = missions.getCurrentMissionState();
      expect(state!.objectivesCompleted).toBe(1);
      expect(state!.score).toBe(SCORING.OBJECTIVE_POINTS);
    });

    it('should not complete checkpoint when drone is far', () => {
      missions.startMission('tt_basics');
      const drone = createDroneState({ position: { x: 0, y: 3, z: 0 } });
      missions.update(drone, 0.016);

      expect(missions.getCurrentMissionState()!.objectivesCompleted).toBe(0);
    });

    it('should complete all checkpoints and finish mission', () => {
      missions.startMission('tt_basics');

      // Visit each checkpoint
      missions.update(createDroneState({ position: { x: 10, y: 3, z: 0 } }), 0.016);
      missions.update(createDroneState({ position: { x: 20, y: 4, z: 5 } }), 0.016);
      missions.update(createDroneState({ position: { x: 30, y: 3, z: -5 } }), 0.016);

      const state = missions.getCurrentMissionState();
      expect(state!.isComplete).toBe(true);
      expect(state!.objectivesCompleted).toBe(3);
    });
  });

  describe('update - landing objectives', () => {
    it('should complete landing zone when landed with low velocity', () => {
      missions.startMission('pr_landing');
      // First landing zone at {x: 20, y: 0, z: 0} radius 2
      const drone = createDroneState({
        position: { x: 20, y: 0.1, z: 0 },
        velocity: { x: 0, y: -0.2, z: 0 },
      });
      missions.update(drone, 0.016);

      expect(missions.getCurrentMissionState()!.objectivesCompleted).toBe(1);
    });

    it('should not complete landing if too high', () => {
      missions.startMission('pr_landing');
      const drone = createDroneState({
        position: { x: 20, y: 2, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
      });
      missions.update(drone, 0.016);

      expect(missions.getCurrentMissionState()!.objectivesCompleted).toBe(0);
    });

    it('should not complete landing if velocity too high', () => {
      missions.startMission('pr_landing');
      const drone = createDroneState({
        position: { x: 20, y: 0.1, z: 0 },
        velocity: { x: 0, y: -2, z: 0 },
      });
      missions.update(drone, 0.016);

      expect(missions.getCurrentMissionState()!.objectivesCompleted).toBe(0);
    });
  });

  describe('update - hover objectives', () => {
    it('should complete hover zone with low vertical velocity', () => {
      missions.startMission('pr_hover');
      // First hover zone at {x: 0, y: 5, z: 10} radius 1.5
      const drone = createDroneState({
        position: { x: 0, y: 5, z: 10 },
        velocity: { x: 0, y: 0.1, z: 0 },
      });
      missions.update(drone, 0.016);

      expect(missions.getCurrentMissionState()!.objectivesCompleted).toBe(1);
    });

    it('should not complete hover zone if moving too fast vertically', () => {
      missions.startMission('pr_hover');
      const drone = createDroneState({
        position: { x: 0, y: 5, z: 10 },
        velocity: { x: 0, y: 1, z: 0 },
      });
      missions.update(drone, 0.016);

      expect(missions.getCurrentMissionState()!.objectivesCompleted).toBe(0);
    });
  });

  describe('update - collect objectives', () => {
    it('should collect item when within radius', () => {
      missions.startMission('sr_explore');
      // First collectible at {x: 30, y: 2, z: 30} radius 2
      const drone = createDroneState({ position: { x: 30, y: 2, z: 30 } });
      missions.update(drone, 0.016);

      expect(missions.getCurrentMissionState()!.objectivesCompleted).toBe(1);
    });
  });

  describe('mission completion and scoring', () => {
    it('should add time bonus when under par time', () => {
      missions.startMission('tt_basics'); // parTime: 30

      // Complete all checkpoints quickly (currentTime will be small)
      missions.update(createDroneState({ position: { x: 10, y: 3, z: 0 } }), 0.016);
      missions.update(createDroneState({ position: { x: 20, y: 4, z: 5 } }), 0.016);
      missions.update(createDroneState({ position: { x: 30, y: 3, z: -5 } }), 0.016);

      const state = missions.getCurrentMissionState();
      // Score should include objective points + time bonus
      expect(state!.score).toBeGreaterThan(3 * SCORING.OBJECTIVE_POINTS);
      expect(state!.isPassed).toBe(true);
    });

    it('should mark as not passed when over par time', () => {
      missions.startMission('tt_basics'); // parTime: 30

      // Simulate a lot of time passing
      for (let i = 0; i < 200; i++) {
        missions.update(createDroneState({ position: { x: 0, y: 0, z: 0 } }), 0.2);
      }

      // Now complete the checkpoints
      missions.update(createDroneState({ position: { x: 10, y: 3, z: 0 } }), 0.016);
      missions.update(createDroneState({ position: { x: 20, y: 4, z: 5 } }), 0.016);
      missions.update(createDroneState({ position: { x: 30, y: 3, z: -5 } }), 0.016);

      const state = missions.getCurrentMissionState();
      expect(state!.isComplete).toBe(true);
      expect(state!.isPassed).toBe(false);
    });

    it('should not update completed mission', () => {
      missions.startMission('tt_basics');
      missions.update(createDroneState({ position: { x: 10, y: 3, z: 0 } }), 0.016);
      missions.update(createDroneState({ position: { x: 20, y: 4, z: 5 } }), 0.016);
      missions.update(createDroneState({ position: { x: 30, y: 3, z: -5 } }), 0.016);

      const scoreBefore = missions.getCurrentMissionState()!.score;
      missions.update(createDroneState({ position: { x: 10, y: 3, z: 0 } }), 0.016);
      expect(missions.getCurrentMissionState()!.score).toBe(scoreBefore);
    });
  });

  describe('recordCrash', () => {
    it('should increment crash count', () => {
      missions.startMission('tt_basics');
      missions.recordCrash();
      expect(missions.getCurrentMissionState()!.crashes).toBe(1);
    });

    it('should penalize score', () => {
      missions.startMission('tt_basics');
      missions.recordCrash();
      expect(missions.getCurrentMissionState()!.score).toBe(SCORING.CRASH_PENALTY_COLLISION);
    });

    it('should not crash without active mission', () => {
      // Should not throw
      missions.recordCrash();
    });
  });

  describe('abortMission', () => {
    it('should clear current mission', () => {
      missions.startMission('tt_basics');
      missions.abortMission();
      expect(missions.getCurrentMissionState()).toBeNull();
    });
  });

  describe('getMissionResult', () => {
    it('should return null when no mission', () => {
      expect(missions.getMissionResult()).toBeNull();
    });

    it('should return null when mission not complete', () => {
      missions.startMission('tt_basics');
      expect(missions.getMissionResult()).toBeNull();
    });

    it('should return result when mission complete', () => {
      missions.startMission('tt_basics');
      missions.update(createDroneState({ position: { x: 10, y: 3, z: 0 } }), 0.016);
      missions.update(createDroneState({ position: { x: 20, y: 4, z: 5 } }), 0.016);
      missions.update(createDroneState({ position: { x: 30, y: 3, z: -5 } }), 0.016);

      const result = missions.getMissionResult();
      expect(result).not.toBeNull();
      expect(result!.missionId).toBe('tt_basics');
      expect(result!.completed).toBe(true);
      expect(result!.objectives.length).toBe(3);
      expect(result!.score).toBeGreaterThan(0);
    });
  });

  describe('getNextObjective', () => {
    it('should return null without active mission', () => {
      expect(missions.getNextObjective()).toBeNull();
    });

    it('should return first uncompleted required objective', () => {
      missions.startMission('tt_basics');
      const next = missions.getNextObjective();
      expect(next).not.toBeNull();
      expect(next!.id).toBe('cp1');
    });

    it('should advance to next objective after completion', () => {
      missions.startMission('tt_basics');
      missions.update(createDroneState({ position: { x: 10, y: 3, z: 0 } }), 0.016);
      const next = missions.getNextObjective();
      expect(next!.id).toBe('cp2');
    });
  });

  describe('getProgress', () => {
    it('should return 0 without active mission', () => {
      expect(missions.getProgress()).toBe(0);
    });

    it('should track completion percentage', () => {
      missions.startMission('tt_basics'); // 3 objectives
      missions.update(createDroneState({ position: { x: 10, y: 3, z: 0 } }), 0.016);
      expect(missions.getProgress()).toBeCloseTo(33.33, 0);
    });

    it('should reach 100% when all complete', () => {
      missions.startMission('tt_basics');
      missions.update(createDroneState({ position: { x: 10, y: 3, z: 0 } }), 0.016);
      missions.update(createDroneState({ position: { x: 20, y: 4, z: 5 } }), 0.016);
      missions.update(createDroneState({ position: { x: 30, y: 3, z: -5 } }), 0.016);
      expect(missions.getProgress()).toBe(100);
    });
  });

  describe('mission types coverage', () => {
    it('should have correct mission structure', () => {
      const allMissions = missions.getAllMissions();
      allMissions.forEach((mission) => {
        expect(mission.id).toBeDefined();
        expect(mission.type).toBeDefined();
        expect(mission.name).toBeDefined();
        expect(mission.description).toBeDefined();
        expect(mission.parTime).toBeGreaterThan(0);
        expect(mission.objectives.length).toBeGreaterThan(0);
        expect(mission.rewards).toBeDefined();
      });
    });

    it('should have objectives with valid structure', () => {
      const allMissions = missions.getAllMissions();
      allMissions.forEach((mission) => {
        mission.objectives.forEach((obj) => {
          expect(obj.id).toBeDefined();
          expect(obj.type).toBeDefined();
          expect(obj.position).toBeDefined();
          expect(obj.radius).toBeGreaterThan(0);
          expect(typeof obj.required).toBe('boolean');
        });
      });
    });
  });
});
