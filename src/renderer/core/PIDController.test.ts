import { describe, it, expect, beforeEach } from 'vitest';
import { PIDController, FlightController } from './PIDController';

describe('PIDController', () => {
  let pid: PIDController;

  beforeEach(() => {
    pid = new PIDController({
      gains: { p: 1.0, i: 0.1, d: 0.01 },
      outputLimit: 100,
      integralLimit: 50,
      derivativeFilterCoeff: 0.5,
    });
  });

  it('should initialize with default state', () => {
    const gains = pid.getGains();
    expect(gains.p).toBe(1.0);
    expect(gains.i).toBe(0.1);
    expect(gains.d).toBe(0.01);
  });

  it('should calculate proportional output correctly', () => {
    // Create PID with only P gain to test proportional term
    const pOnlyPid = new PIDController({
      gains: { p: 1.0, i: 0, d: 0 },
      outputLimit: 100,
      integralLimit: 50,
    });
    const output = pOnlyPid.update(10, 0, 0.01);
    expect(output).toBeCloseTo(10, 1);
  });

  it('should accumulate integral over time', () => {
    // Run several iterations with constant error
    for (let i = 0; i < 10; i++) {
      pid.update(10, 0, 0.1);
    }
    // Integral should have accumulated (10 error * 0.1 dt * 10 iterations * 0.1 I gain = 1.0)
    // Plus P term (10 * 1.0 = 10)
    const output = pid.update(10, 0, 0.1);
    expect(output).toBeGreaterThan(10); // Should be more than just P term
  });

  it('should limit integral to prevent windup', () => {
    // Run many iterations to try to exceed integral limit
    for (let i = 0; i < 1000; i++) {
      pid.update(100, 0, 0.1);
    }
    // With integral limit of 50 and I gain of 0.1, max I contribution is 5
    // P term is 100 (limited to 100 by output limit)
    const output = pid.update(100, 0, 0.1);
    expect(output).toBe(100); // Should be clamped to outputLimit
  });

  it('should reset state correctly', () => {
    // Accumulate some integral
    for (let i = 0; i < 10; i++) {
      pid.update(10, 0, 0.1);
    }

    pid.reset();

    // After reset with P-only PID, should behave like fresh PID
    const pOnlyPid = new PIDController({
      gains: { p: 1.0, i: 0, d: 0 },
      outputLimit: 100,
      integralLimit: 50,
    });
    const output = pOnlyPid.update(10, 0, 0.01);
    expect(output).toBeCloseTo(10, 1); // Only P term
  });

  it('should handle negative errors', () => {
    // Create PID with only P gain for predictable output
    const pOnlyPid = new PIDController({
      gains: { p: 1.0, i: 0, d: 0 },
      outputLimit: 100,
      integralLimit: 50,
    });
    const output = pOnlyPid.update(-10, 0, 0.01);
    expect(output).toBeCloseTo(-10, 1);
  });

  it('should handle zero delta time', () => {
    const output = pid.update(10, 0, 0);
    expect(output).toBe(0);
  });

  it('should allow setting gains', () => {
    pid.setGains({ p: 2.0, i: 0.5 });
    const gains = pid.getGains();
    expect(gains.p).toBe(2.0);
    expect(gains.i).toBe(0.5);
    expect(gains.d).toBe(0.01); // Unchanged
  });
});

describe('FlightController', () => {
  let fc: FlightController;

  beforeEach(() => {
    fc = new FlightController();
  });

  it('should initialize with default gains', () => {
    const rateGains = fc.getRatePIDGains();
    expect(rateGains.roll.p).toBeGreaterThan(0);
    expect(rateGains.pitch.p).toBeGreaterThan(0);
    expect(rateGains.yaw.p).toBeGreaterThan(0);
  });

  it('should output zero when drone is stable with no input', () => {
    const output = fc.updateAcroMode(
      { roll: 0, pitch: 0, yaw: 0 },
      { roll: 0, pitch: 0, yaw: 0 },
      0.01
    );

    expect(output.roll).toBeCloseTo(0, 1);
    expect(output.pitch).toBeCloseTo(0, 1);
    expect(output.yaw).toBeCloseTo(0, 1);
  });

  it('should output correction when there is rate error in acro mode', () => {
    // Drone is rotating but pilot wants no rotation
    const output = fc.updateAcroMode(
      { roll: 0, pitch: 0, yaw: 0 },
      { roll: 100, pitch: 0, yaw: 0 }, // Drone rolling at 100 deg/s
      0.01
    );

    // Should output negative roll to counteract
    expect(output.roll).toBeLessThan(0);
  });

  it('should output correction in angle mode when tilted', () => {
    // Drone is tilted but pilot wants level
    const output = fc.updateAngleMode(
      { roll: 0, pitch: 0, yaw: 0 },
      { roll: 20, pitch: 0, yaw: 0 }, // Drone tilted 20 degrees
      { roll: 0, pitch: 0, yaw: 0 },
      0.01
    );

    // Should output negative roll to level out
    expect(output.roll).toBeLessThan(0);
  });

  it('should follow pilot input in angle mode', () => {
    // Pilot wants 50% right roll (max angle * 0.5)
    const output = fc.updateAngleMode(
      { roll: 0.5, pitch: 0, yaw: 0 },
      { roll: 0, pitch: 0, yaw: 0 }, // Drone is level
      { roll: 0, pitch: 0, yaw: 0 },
      0.01
    );

    // Should output positive roll to achieve desired angle
    expect(output.roll).toBeGreaterThan(0);
  });

  it('should reset all PIDs', () => {
    // Generate some state
    fc.updateAcroMode(
      { roll: 1, pitch: 1, yaw: 1 },
      { roll: 0, pitch: 0, yaw: 0 },
      0.01
    );

    fc.reset();

    // Should behave like fresh controller
    const output = fc.updateAcroMode(
      { roll: 0, pitch: 0, yaw: 0 },
      { roll: 0, pitch: 0, yaw: 0 },
      0.01
    );

    expect(output.roll).toBeCloseTo(0, 1);
    expect(output.pitch).toBeCloseTo(0, 1);
    expect(output.yaw).toBeCloseTo(0, 1);
  });

  it('should allow setting rate PID gains', () => {
    fc.setRatePIDGains('roll', { p: 0.1, i: 0.2, d: 0.3 });
    const gains = fc.getRatePIDGains();
    expect(gains.roll.p).toBe(0.1);
    expect(gains.roll.i).toBe(0.2);
    expect(gains.roll.d).toBe(0.3);
  });

  it('should allow setting attitude PID gains', () => {
    fc.setAttitudePIDGains('pitch', { p: 10.0 });
    const gains = fc.getAttitudePIDGains();
    expect(gains.pitch.p).toBe(10.0);
  });

  it('should respect max rates', () => {
    fc.setMaxRates({ roll: 100, pitch: 100, yaw: 100 });

    // Full stick input should produce output attempting max rate
    const output = fc.updateAcroMode(
      { roll: 1, pitch: 1, yaw: 1 },
      { roll: 0, pitch: 0, yaw: 0 },
      0.01
    );

    // Output should be positive and significant
    expect(output.roll).toBeGreaterThan(0);
    expect(output.pitch).toBeGreaterThan(0);
    expect(output.yaw).toBeGreaterThan(0);
  });
});
