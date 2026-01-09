import { describe, it, expect } from 'vitest';
import type {
  NormalizedInput,
  DroneState,
  FlightMode,
  InputSource,
  Vector3,
} from './types';

describe('Types', () => {
  describe('NormalizedInput', () => {
    it('should accept valid input values', () => {
      const input: NormalizedInput = {
        throttle: 0.5,
        yaw: 0,
        pitch: -0.3,
        roll: 0.2,
        aux1: true,
        aux2: 1,
        aux3: 0,
        timestamp: 1234567890,
        source: 'keyboard',
      };

      expect(input.throttle).toBeGreaterThanOrEqual(0);
      expect(input.throttle).toBeLessThanOrEqual(1);
      expect(input.yaw).toBeGreaterThanOrEqual(-1);
      expect(input.yaw).toBeLessThanOrEqual(1);
      expect(input.pitch).toBeGreaterThanOrEqual(-1);
      expect(input.pitch).toBeLessThanOrEqual(1);
      expect(input.roll).toBeGreaterThanOrEqual(-1);
      expect(input.roll).toBeLessThanOrEqual(1);
    });
  });

  describe('InputSource', () => {
    it('should have valid input sources', () => {
      const sources: InputSource[] = ['keyboard', 'mouse', 'trackpad', 'gamepad', 'rc'];
      expect(sources).toHaveLength(5);
    });
  });

  describe('FlightMode', () => {
    it('should have valid flight modes', () => {
      const modes: FlightMode[] = ['angle', 'horizon', 'acro'];
      expect(modes).toHaveLength(3);
    });
  });

  describe('DroneState', () => {
    it('should accept valid drone state', () => {
      const drone: DroneState = {
        position: { x: 0, y: 1, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        velocity: { x: 0, y: 0, z: 0 },
        angularVelocity: { x: 0, y: 0, z: 0 },
        motorRPM: [5000, 5000, 5000, 5000],
        batteryLevel: 100,
        isArmed: true,
        flightMode: 'angle',
      };

      expect(drone.motorRPM).toHaveLength(4);
      expect(drone.batteryLevel).toBeGreaterThanOrEqual(0);
      expect(drone.batteryLevel).toBeLessThanOrEqual(100);
    });
  });

  describe('Vector3', () => {
    it('should have x, y, z components', () => {
      const vec: Vector3 = { x: 1, y: 2, z: 3 };
      expect(vec.x).toBe(1);
      expect(vec.y).toBe(2);
      expect(vec.z).toBe(3);
    });
  });
});
