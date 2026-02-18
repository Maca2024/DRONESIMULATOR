import { describe, it, expect, beforeEach } from 'vitest';
import { useProgressStore } from './progressStore';

describe('ProgressStore', () => {
  beforeEach(() => {
    useProgressStore.getState().resetProgress();
  });

  describe('initial state', () => {
    it('should start at level 1', () => {
      expect(useProgressStore.getState().progress.level).toBe(1);
    });

    it('should start with 0 XP', () => {
      expect(useProgressStore.getState().progress.xp).toBe(0);
    });

    it('should have no completed tutorials', () => {
      const { tutorialProgress } = useProgressStore.getState().progress;
      expect(tutorialProgress.novice).toBe(false);
      expect(tutorialProgress.beginner).toBe(false);
      expect(tutorialProgress.intermediate).toBe(false);
      expect(tutorialProgress.advanced).toBe(false);
      expect(tutorialProgress.expert).toBe(false);
    });

    it('should have empty completed missions', () => {
      expect(useProgressStore.getState().progress.completedMissions).toEqual([]);
    });

    it('should have empty achievements', () => {
      expect(useProgressStore.getState().progress.achievements).toEqual([]);
    });

    it('should have zero statistics', () => {
      const { statistics } = useProgressStore.getState().progress;
      expect(statistics.totalFlights).toBe(0);
      expect(statistics.totalCrashes).toBe(0);
      expect(statistics.totalDistance).toBe(0);
      expect(statistics.tricksPerformed).toBe(0);
    });
  });

  describe('addXP', () => {
    it('should add XP', () => {
      useProgressStore.getState().addXP(500);
      expect(useProgressStore.getState().progress.xp).toBe(500);
    });

    it('should level up at 1000 XP', () => {
      useProgressStore.getState().addXP(1000);
      expect(useProgressStore.getState().progress.level).toBe(2);
    });

    it('should handle multiple level ups', () => {
      useProgressStore.getState().addXP(3500);
      expect(useProgressStore.getState().progress.level).toBe(4);
      expect(useProgressStore.getState().progress.xp).toBe(3500);
    });

    it('should accumulate XP across calls', () => {
      useProgressStore.getState().addXP(300);
      useProgressStore.getState().addXP(400);
      expect(useProgressStore.getState().progress.xp).toBe(700);
      expect(useProgressStore.getState().progress.level).toBe(1);
    });

    it('should level up across calls', () => {
      useProgressStore.getState().addXP(600);
      useProgressStore.getState().addXP(600);
      expect(useProgressStore.getState().progress.level).toBe(2);
    });
  });

  describe('completeTutorial', () => {
    it('should mark novice as complete', () => {
      useProgressStore.getState().completeTutorial('novice');
      expect(useProgressStore.getState().progress.tutorialProgress.novice).toBe(true);
    });

    it('should mark beginner as complete', () => {
      useProgressStore.getState().completeTutorial('beginner');
      expect(useProgressStore.getState().progress.tutorialProgress.beginner).toBe(true);
    });

    it('should not affect other levels', () => {
      useProgressStore.getState().completeTutorial('novice');
      expect(useProgressStore.getState().progress.tutorialProgress.beginner).toBe(false);
    });

    it('should handle all levels', () => {
      useProgressStore.getState().completeTutorial('novice');
      useProgressStore.getState().completeTutorial('beginner');
      useProgressStore.getState().completeTutorial('intermediate');
      useProgressStore.getState().completeTutorial('advanced');
      useProgressStore.getState().completeTutorial('expert');

      const { tutorialProgress } = useProgressStore.getState().progress;
      expect(tutorialProgress.novice).toBe(true);
      expect(tutorialProgress.beginner).toBe(true);
      expect(tutorialProgress.intermediate).toBe(true);
      expect(tutorialProgress.advanced).toBe(true);
      expect(tutorialProgress.expert).toBe(true);
    });
  });

  describe('completeMission', () => {
    it('should add mission to completed list', () => {
      useProgressStore.getState().completeMission('tt_basics');
      expect(useProgressStore.getState().progress.completedMissions).toContain('tt_basics');
    });

    it('should not duplicate missions', () => {
      useProgressStore.getState().completeMission('tt_basics');
      useProgressStore.getState().completeMission('tt_basics');
      expect(useProgressStore.getState().progress.completedMissions).toEqual(['tt_basics']);
    });

    it('should track multiple missions', () => {
      useProgressStore.getState().completeMission('tt_basics');
      useProgressStore.getState().completeMission('pr_landing');
      const missions = useProgressStore.getState().progress.completedMissions;
      expect(missions).toContain('tt_basics');
      expect(missions).toContain('pr_landing');
      expect(missions.length).toBe(2);
    });
  });

  describe('addAchievement', () => {
    it('should add achievement', () => {
      useProgressStore.getState().addAchievement('first_flight');
      expect(useProgressStore.getState().progress.achievements).toContain('first_flight');
    });

    it('should not duplicate achievements', () => {
      useProgressStore.getState().addAchievement('first_flight');
      useProgressStore.getState().addAchievement('first_flight');
      expect(useProgressStore.getState().progress.achievements).toEqual(['first_flight']);
    });

    it('should track multiple achievements', () => {
      useProgressStore.getState().addAchievement('first_flight');
      useProgressStore.getState().addAchievement('speed_demon');
      expect(useProgressStore.getState().progress.achievements.length).toBe(2);
    });
  });

  describe('updateStatistics', () => {
    it('should update total flights', () => {
      useProgressStore.getState().updateStatistics({ totalFlights: 5 });
      expect(useProgressStore.getState().progress.statistics.totalFlights).toBe(5);
    });

    it('should update total crashes', () => {
      useProgressStore.getState().updateStatistics({ totalCrashes: 3 });
      expect(useProgressStore.getState().progress.statistics.totalCrashes).toBe(3);
    });

    it('should update total distance', () => {
      useProgressStore.getState().updateStatistics({ totalDistance: 1500 });
      expect(useProgressStore.getState().progress.statistics.totalDistance).toBe(1500);
    });

    it('should update tricks performed', () => {
      useProgressStore.getState().updateStatistics({ tricksPerformed: 10 });
      expect(useProgressStore.getState().progress.statistics.tricksPerformed).toBe(10);
    });

    it('should merge partial updates', () => {
      useProgressStore.getState().updateStatistics({ totalFlights: 5 });
      useProgressStore.getState().updateStatistics({ totalCrashes: 2 });
      const { statistics } = useProgressStore.getState().progress;
      expect(statistics.totalFlights).toBe(5);
      expect(statistics.totalCrashes).toBe(2);
    });
  });

  describe('resetProgress', () => {
    it('should reset everything to initial state', () => {
      useProgressStore.getState().addXP(5000);
      useProgressStore.getState().completeTutorial('novice');
      useProgressStore.getState().completeMission('tt_basics');
      useProgressStore.getState().addAchievement('first_flight');
      useProgressStore.getState().updateStatistics({ totalFlights: 100 });

      useProgressStore.getState().resetProgress();

      const { progress } = useProgressStore.getState();
      expect(progress.level).toBe(1);
      expect(progress.xp).toBe(0);
      expect(progress.tutorialProgress.novice).toBe(false);
      expect(progress.completedMissions).toEqual([]);
      expect(progress.achievements).toEqual([]);
      expect(progress.statistics.totalFlights).toBe(0);
    });
  });
});
