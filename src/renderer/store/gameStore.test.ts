import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore, selectDronePosition, selectIsArmed, selectFlightMode } from './gameStore';
import type { Mission } from '@shared/types';

describe('GameStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useGameStore.setState({
      currentScreen: 'mainMenu',
      previousScreen: null,
      isPlaying: false,
      isPaused: false,
      gameTime: 0,
      drone: {
        position: { x: 0, y: 1, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        velocity: { x: 0, y: 0, z: 0 },
        angularVelocity: { x: 0, y: 0, z: 0 },
        motorRPM: [0, 0, 0, 0],
        batteryLevel: 100,
        isArmed: false,
        flightMode: 'angle',
      },
      currentMission: null,
      missionTime: 0,
      score: 0,
      comboMultiplier: 1,
    });
  });

  describe('initial state', () => {
    it('should start at mainMenu screen', () => {
      const state = useGameStore.getState();
      expect(state.currentScreen).toBe('mainMenu');
    });

    it('should not be playing initially', () => {
      const state = useGameStore.getState();
      expect(state.isPlaying).toBe(false);
      expect(state.isPaused).toBe(false);
    });

    it('should have drone at default position', () => {
      const state = useGameStore.getState();
      expect(state.drone.position).toEqual({ x: 0, y: 1, z: 0 });
    });

    it('should have drone disarmed initially', () => {
      const state = useGameStore.getState();
      expect(state.drone.isArmed).toBe(false);
    });

    it('should have zero score', () => {
      const state = useGameStore.getState();
      expect(state.score).toBe(0);
      expect(state.comboMultiplier).toBe(1);
    });
  });

  describe('setScreen', () => {
    it('should change current screen', () => {
      useGameStore.getState().setScreen('settings');
      expect(useGameStore.getState().currentScreen).toBe('settings');
    });

    it('should save previous screen', () => {
      useGameStore.getState().setScreen('settings');
      expect(useGameStore.getState().previousScreen).toBe('mainMenu');
    });
  });

  describe('goBack', () => {
    it('should return to previous screen', () => {
      useGameStore.getState().setScreen('settings');
      useGameStore.getState().goBack();
      expect(useGameStore.getState().currentScreen).toBe('mainMenu');
    });

    it('should go to mainMenu if no previous screen', () => {
      useGameStore.getState().goBack();
      expect(useGameStore.getState().currentScreen).toBe('mainMenu');
    });
  });

  describe('startGame', () => {
    it('should start free play mode', () => {
      useGameStore.getState().startGame('freePlay');
      const state = useGameStore.getState();
      expect(state.currentScreen).toBe('freePlay');
      expect(state.isPlaying).toBe(true);
      expect(state.isPaused).toBe(false);
    });

    it('should start tutorial mode', () => {
      useGameStore.getState().startGame('tutorial');
      const state = useGameStore.getState();
      expect(state.currentScreen).toBe('tutorial');
      expect(state.isPlaying).toBe(true);
    });

    it('should start mission mode', () => {
      const mission: Mission = {
        id: 'test_mission',
        type: 'timeTrial',
        name: 'Test',
        description: 'Test mission',
        parTime: 30,
        objectives: [],
        rewards: { xp: 100, unlocks: [] },
      };
      useGameStore.getState().startGame('mission', mission);
      const state = useGameStore.getState();
      expect(state.currentScreen).toBe('mission');
      expect(state.currentMission).toEqual(mission);
    });

    it('should auto-arm drone on start', () => {
      useGameStore.getState().startGame('freePlay');
      expect(useGameStore.getState().drone.isArmed).toBe(true);
    });

    it('should reset game time and score', () => {
      useGameStore.setState({ gameTime: 100, score: 500 });
      useGameStore.getState().startGame('freePlay');
      const state = useGameStore.getState();
      expect(state.gameTime).toBe(0);
      expect(state.missionTime).toBe(0);
      expect(state.score).toBe(0);
      expect(state.comboMultiplier).toBe(1);
    });
  });

  describe('pauseGame', () => {
    it('should pause the game', () => {
      useGameStore.getState().startGame('freePlay');
      useGameStore.getState().pauseGame();
      const state = useGameStore.getState();
      expect(state.isPaused).toBe(true);
      expect(state.currentScreen).toBe('pause');
    });

    it('should save previous screen when pausing', () => {
      useGameStore.getState().startGame('freePlay');
      useGameStore.getState().pauseGame();
      expect(useGameStore.getState().previousScreen).toBe('freePlay');
    });

    it('should save tutorial as previous screen', () => {
      useGameStore.getState().startGame('tutorial');
      useGameStore.getState().pauseGame();
      expect(useGameStore.getState().previousScreen).toBe('tutorial');
    });
  });

  describe('resumeGame', () => {
    it('should resume free play', () => {
      useGameStore.getState().startGame('freePlay');
      useGameStore.getState().pauseGame();
      useGameStore.getState().resumeGame();
      const state = useGameStore.getState();
      expect(state.isPaused).toBe(false);
      expect(state.currentScreen).toBe('freePlay');
    });

    it('should resume tutorial mode', () => {
      useGameStore.getState().startGame('tutorial');
      useGameStore.getState().pauseGame();
      useGameStore.getState().resumeGame();
      expect(useGameStore.getState().currentScreen).toBe('tutorial');
    });

    it('should resume mission mode', () => {
      const mission: Mission = {
        id: 'test',
        type: 'timeTrial',
        name: 'Test',
        description: 'Test',
        parTime: 30,
        objectives: [],
        rewards: { xp: 100, unlocks: [] },
      };
      useGameStore.getState().startGame('mission', mission);
      useGameStore.getState().pauseGame();
      useGameStore.getState().resumeGame();
      expect(useGameStore.getState().currentScreen).toBe('mission');
    });
  });

  describe('endGame', () => {
    it('should return to main menu', () => {
      useGameStore.getState().startGame('freePlay');
      useGameStore.getState().endGame();
      const state = useGameStore.getState();
      expect(state.currentScreen).toBe('mainMenu');
      expect(state.isPlaying).toBe(false);
      expect(state.isPaused).toBe(false);
    });

    it('should reset drone state', () => {
      useGameStore.getState().startGame('freePlay');
      useGameStore.getState().updateDrone({ position: { x: 10, y: 20, z: 30 } });
      useGameStore.getState().endGame();
      expect(useGameStore.getState().drone.position).toEqual({ x: 0, y: 1, z: 0 });
      expect(useGameStore.getState().drone.isArmed).toBe(false);
    });

    it('should clear mission', () => {
      const mission: Mission = {
        id: 'test',
        type: 'timeTrial',
        name: 'Test',
        description: 'Test',
        parTime: 30,
        objectives: [],
        rewards: { xp: 100, unlocks: [] },
      };
      useGameStore.getState().startGame('mission', mission);
      useGameStore.getState().endGame();
      expect(useGameStore.getState().currentMission).toBeNull();
    });
  });

  describe('drone controls', () => {
    it('should update drone state', () => {
      useGameStore.getState().updateDrone({ position: { x: 5, y: 10, z: 15 } });
      expect(useGameStore.getState().drone.position).toEqual({ x: 5, y: 10, z: 15 });
    });

    it('should merge partial drone state', () => {
      useGameStore.getState().updateDrone({ batteryLevel: 50 });
      const drone = useGameStore.getState().drone;
      expect(drone.batteryLevel).toBe(50);
      expect(drone.position).toEqual({ x: 0, y: 1, z: 0 }); // unchanged
    });

    it('should set flight mode', () => {
      useGameStore.getState().setFlightMode('acro');
      expect(useGameStore.getState().drone.flightMode).toBe('acro');
    });

    it('should toggle arm state', () => {
      expect(useGameStore.getState().drone.isArmed).toBe(false);
      useGameStore.getState().toggleArm();
      expect(useGameStore.getState().drone.isArmed).toBe(true);
      useGameStore.getState().toggleArm();
      expect(useGameStore.getState().drone.isArmed).toBe(false);
    });
  });

  describe('scoring', () => {
    it('should add score with combo multiplier', () => {
      useGameStore.getState().addScore(100);
      expect(useGameStore.getState().score).toBe(100);
    });

    it('should apply combo multiplier to score', () => {
      useGameStore.setState({ comboMultiplier: 2.0 });
      useGameStore.getState().addScore(100);
      expect(useGameStore.getState().score).toBe(200);
    });

    it('should increment combo', () => {
      useGameStore.getState().incrementCombo();
      expect(useGameStore.getState().comboMultiplier).toBe(1.5);
    });

    it('should cap combo at 2.0', () => {
      useGameStore.setState({ comboMultiplier: 2.0 });
      useGameStore.getState().incrementCombo();
      expect(useGameStore.getState().comboMultiplier).toBe(2.0);
    });

    it('should reset combo', () => {
      useGameStore.setState({ comboMultiplier: 2.0 });
      useGameStore.getState().resetCombo();
      expect(useGameStore.getState().comboMultiplier).toBe(1);
    });
  });

  describe('crash', () => {
    it('should penalize score on crash', () => {
      useGameStore.setState({ score: 1000 });
      useGameStore.getState().crash({ x: 0, y: 0, z: 0 });
      expect(useGameStore.getState().score).toBe(500);
    });

    it('should not go below zero score', () => {
      useGameStore.setState({ score: 100 });
      useGameStore.getState().crash({ x: 0, y: 0, z: 0 });
      expect(useGameStore.getState().score).toBe(0);
    });

    it('should reset combo on crash', () => {
      useGameStore.setState({ comboMultiplier: 2.0 });
      useGameStore.getState().crash({ x: 0, y: 0, z: 0 });
      expect(useGameStore.getState().comboMultiplier).toBe(1);
    });
  });

  describe('tick', () => {
    it('should increment game time', () => {
      useGameStore.getState().tick(0.016);
      expect(useGameStore.getState().gameTime).toBeCloseTo(0.016, 3);
    });

    it('should increment mission time when playing', () => {
      useGameStore.getState().startGame('freePlay');
      useGameStore.getState().tick(0.016);
      expect(useGameStore.getState().missionTime).toBeCloseTo(0.016, 3);
    });

    it('should not increment mission time when paused', () => {
      useGameStore.getState().startGame('freePlay');
      useGameStore.getState().pauseGame();
      useGameStore.getState().tick(0.016);
      expect(useGameStore.getState().missionTime).toBe(0);
    });
  });

  describe('selectors', () => {
    it('should select drone position', () => {
      const state = useGameStore.getState();
      expect(selectDronePosition(state)).toEqual({ x: 0, y: 1, z: 0 });
    });

    it('should select isArmed', () => {
      const state = useGameStore.getState();
      expect(selectIsArmed(state)).toBe(false);
    });

    it('should select flight mode', () => {
      const state = useGameStore.getState();
      expect(selectFlightMode(state)).toBe('angle');
    });
  });
});
