import { describe, it, expect } from 'vitest';
import { PHYSICS, INPUT, SCORING, DEFAULT_KEY_BINDINGS } from './constants';

describe('Constants', () => {
  describe('PHYSICS', () => {
    it('should have correct timestep for 500Hz physics', () => {
      expect(PHYSICS.TIMESTEP).toBe(1 / 500);
    });

    it('should have realistic gravity', () => {
      expect(PHYSICS.GRAVITY).toBe(9.81);
    });

    it('should have reasonable altitude limits', () => {
      expect(PHYSICS.GROUND_LEVEL).toBe(0);
      expect(PHYSICS.MAX_ALTITUDE).toBeGreaterThan(100);
    });
  });

  describe('INPUT', () => {
    it('should have reasonable tap duration', () => {
      expect(INPUT.TAP_DURATION).toBeGreaterThan(50);
      expect(INPUT.TAP_DURATION).toBeLessThan(200);
    });

    it('should have tap input between 0 and 1', () => {
      expect(INPUT.TAP_INPUT_PERCENT).toBeGreaterThan(0);
      expect(INPUT.TAP_INPUT_PERCENT).toBeLessThan(1);
    });

    it('should have reasonable latency targets', () => {
      expect(INPUT.CONTROLLER_LATENCY_TARGET).toBeLessThanOrEqual(16);
      expect(INPUT.KEYBOARD_LATENCY_TARGET).toBeLessThanOrEqual(16);
    });
  });

  describe('SCORING', () => {
    it('should have positive time bonus multiplier', () => {
      expect(SCORING.TIME_BONUS_MULTIPLIER).toBeGreaterThan(0);
    });

    it('should have negative crash penalties', () => {
      expect(SCORING.CRASH_PENALTY_COLLISION).toBeLessThan(0);
      expect(SCORING.CRASH_PENALTY_RESET).toBeLessThan(0);
    });

    it('should have combo multiplier limits', () => {
      expect(SCORING.COMBO_MULTIPLIER_INCREMENT).toBeGreaterThan(0);
      expect(SCORING.COMBO_MULTIPLIER_MAX).toBeGreaterThan(1);
    });
  });

  describe('DEFAULT_KEY_BINDINGS', () => {
    it('should have movement keys defined', () => {
      expect(DEFAULT_KEY_BINDINGS.moveUp).toContain('KeyW');
      expect(DEFAULT_KEY_BINDINGS.moveDown).toContain('KeyS');
      expect(DEFAULT_KEY_BINDINGS.moveLeft).toContain('KeyA');
      expect(DEFAULT_KEY_BINDINGS.moveRight).toContain('KeyD');
    });

    it('should have thrust keys defined', () => {
      expect(DEFAULT_KEY_BINDINGS.thrustUp).toContain('Space');
      expect(DEFAULT_KEY_BINDINGS.thrustDown.length).toBeGreaterThan(0);
    });

    it('should have pause key defined', () => {
      expect(DEFAULT_KEY_BINDINGS.pause).toContain('KeyP');
    });
  });
});
