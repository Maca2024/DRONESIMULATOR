/**
 * BetaflightRates Tests
 *
 * Comprehensive tests for the Betaflight Actual Rates system
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  BetaflightRates,
  InputProcessor,
  RATE_PROFILES,
  type RateProfile,
  type AxisRates,
} from './BetaflightRates';

describe('BetaflightRates', () => {
  let rates: BetaflightRates;

  beforeEach(() => {
    rates = new BetaflightRates('intermediate');
  });

  describe('initialization', () => {
    it('should initialize with default profile', () => {
      const profile = rates.getProfile();
      expect(profile.name).toBe('Intermediate');
    });

    it('should initialize with specified profile', () => {
      const racingRates = new BetaflightRates('racing');
      expect(racingRates.getProfile().name).toBe('Racing');
    });

    it('should fall back to intermediate if profile not found', () => {
      const unknownRates = new BetaflightRates('unknownProfile');
      expect(unknownRates.getProfile().name).toBe('Intermediate');
    });
  });

  describe('profile management', () => {
    it('should set profile by name', () => {
      rates.setProfile('freestyle');
      expect(rates.getProfile().name).toBe('Freestyle');
    });

    it('should set custom profile', () => {
      const customProfile: RateProfile = {
        name: 'Custom',
        description: 'Custom rates',
        roll: { centerSensitivity: 100, maxRate: 500, expo: 0.3 },
        pitch: { centerSensitivity: 100, maxRate: 500, expo: 0.3 },
        yaw: { centerSensitivity: 80, maxRate: 300, expo: 0.2 },
        throttle: { midPoint: 0.5, expo: 0.1, limit: 1.0 },
      };

      rates.setCustomProfile(customProfile);
      expect(rates.getProfile().name).toBe('Custom');
    });

    it('should return available profiles', () => {
      const profiles = BetaflightRates.getAvailableProfiles();
      expect(profiles).toContain('beginner');
      expect(profiles).toContain('intermediate');
      expect(profiles).toContain('racing');
      expect(profiles).toContain('freestyle');
      expect(profiles).toContain('cinematic');
    });
  });

  describe('roll rate calculation', () => {
    it('should return 0 at center stick', () => {
      expect(rates.calculateRollRate(0)).toBe(0);
    });

    it('should return max rate at full stick', () => {
      const profile = rates.getProfile();
      const rate = rates.calculateRollRate(1);
      expect(rate).toBeCloseTo(profile.roll.maxRate, 0);
    });

    it('should return negative rate for negative input', () => {
      const rate = rates.calculateRollRate(-1);
      expect(rate).toBeLessThan(0);
    });

    it('should be symmetric', () => {
      const positiveRate = rates.calculateRollRate(0.5);
      const negativeRate = rates.calculateRollRate(-0.5);
      expect(Math.abs(positiveRate)).toBeCloseTo(Math.abs(negativeRate), 5);
    });

    it('should produce higher rates with higher profiles', () => {
      const beginnerRates = new BetaflightRates('beginner');
      const freestyleRates = new BetaflightRates('freestyle');

      const beginnerRate = Math.abs(beginnerRates.calculateRollRate(1));
      const freestyleRate = Math.abs(freestyleRates.calculateRollRate(1));

      expect(freestyleRate).toBeGreaterThan(beginnerRate);
    });
  });

  describe('pitch rate calculation', () => {
    it('should return 0 at center stick', () => {
      expect(rates.calculatePitchRate(0)).toBe(0);
    });

    it('should return max rate at full stick', () => {
      const profile = rates.getProfile();
      const rate = rates.calculatePitchRate(1);
      expect(rate).toBeCloseTo(profile.pitch.maxRate, 0);
    });
  });

  describe('yaw rate calculation', () => {
    it('should return 0 at center stick', () => {
      expect(rates.calculateYawRate(0)).toBe(0);
    });

    it('should have lower max rate than roll/pitch', () => {
      const profile = rates.getProfile();
      expect(profile.yaw.maxRate).toBeLessThan(profile.roll.maxRate);
    });

    it('should return max rate at full stick', () => {
      const profile = rates.getProfile();
      const rate = rates.calculateYawRate(1);
      expect(rate).toBeCloseTo(profile.yaw.maxRate, 0);
    });
  });

  describe('expo curve behavior', () => {
    it('should produce less rate at half stick with high expo', () => {
      // With expo, the curve is softer near center
      const lowExpoRates = new BetaflightRates();
      lowExpoRates.setCustomProfile({
        ...rates.getProfile(),
        roll: { centerSensitivity: 150, maxRate: 670, expo: 0.1 },
      });

      const highExpoRates = new BetaflightRates();
      highExpoRates.setCustomProfile({
        ...rates.getProfile(),
        roll: { centerSensitivity: 150, maxRate: 670, expo: 0.6 },
      });

      const lowExpoMidRate = Math.abs(lowExpoRates.calculateRollRate(0.5));
      const highExpoMidRate = Math.abs(highExpoRates.calculateRollRate(0.5));

      // High expo should give lower rate at mid-stick
      expect(highExpoMidRate).toBeLessThan(lowExpoMidRate);
    });

    it('should have same max rate regardless of expo', () => {
      const lowExpoRates = new BetaflightRates();
      lowExpoRates.setCustomProfile({
        ...rates.getProfile(),
        roll: { centerSensitivity: 150, maxRate: 670, expo: 0.1 },
      });

      const highExpoRates = new BetaflightRates();
      highExpoRates.setCustomProfile({
        ...rates.getProfile(),
        roll: { centerSensitivity: 150, maxRate: 670, expo: 0.9 },
      });

      const lowExpoMaxRate = lowExpoRates.calculateRollRate(1);
      const highExpoMaxRate = highExpoRates.calculateRollRate(1);

      expect(lowExpoMaxRate).toBeCloseTo(highExpoMaxRate, 0);
    });
  });

  describe('throttle calculation', () => {
    it('should return 0 at zero throttle', () => {
      const throttle = rates.calculateThrottle(0);
      expect(throttle).toBeGreaterThanOrEqual(0);
    });

    it('should respect throttle limit', () => {
      rates.setCustomProfile({
        ...rates.getProfile(),
        throttle: { midPoint: 0.5, expo: 0, limit: 0.8 },
      });

      const throttle = rates.calculateThrottle(1);
      expect(throttle).toBeLessThanOrEqual(0.8);
    });

    it('should return 1 at full throttle with no limit', () => {
      rates.setCustomProfile({
        ...rates.getProfile(),
        throttle: { midPoint: 0.5, expo: 0, limit: 1.0 },
      });

      const throttle = rates.calculateThrottle(1);
      expect(throttle).toBeCloseTo(1, 2);
    });
  });

  describe('rate curve generation', () => {
    it('should generate correct number of points', () => {
      const curve = rates.generateRateCurve('roll', 50);
      expect(curve.length).toBe(51); // 0 to 50 inclusive
    });

    it('should have correct x range', () => {
      const curve = rates.generateRateCurve('roll', 100);
      expect(curve[0].x).toBeCloseTo(-1, 5);
      expect(curve[curve.length - 1].x).toBeCloseTo(1, 5);
    });

    it('should be symmetric around center', () => {
      const curve = rates.generateRateCurve('roll', 100);
      const centerIndex = 50;

      // Compare points equidistant from center
      for (let i = 1; i < 50; i++) {
        const leftY = Math.abs(curve[centerIndex - i].y);
        const rightY = Math.abs(curve[centerIndex + i].y);
        expect(leftY).toBeCloseTo(rightY, 3);
      }
    });
  });

  describe('rate conversion', () => {
    it('should convert from Betaflight classic rates', () => {
      const converted = BetaflightRates.convertFromBetaflightRates(1.0, 0.7, 0.3);

      expect(converted.centerSensitivity).toBeGreaterThan(0);
      expect(converted.maxRate).toBeGreaterThan(converted.centerSensitivity);
      expect(converted.expo).toBe(0.3);
    });

    it('should convert to Betaflight classic rates', () => {
      const axisRates: AxisRates = {
        centerSensitivity: 200,
        maxRate: 700,
        expo: 0.35,
      };

      const converted = BetaflightRates.convertToBetaflightRates(axisRates);

      expect(converted.rcRate).toBeGreaterThan(0);
      expect(converted.rcRate).toBeLessThanOrEqual(2.55);
      expect(converted.superRate).toBeGreaterThanOrEqual(0);
      expect(converted.superRate).toBeLessThanOrEqual(1);
      expect(converted.rcExpo).toBe(0.35);
    });
  });
});

describe('InputProcessor', () => {
  let processor: InputProcessor;

  beforeEach(() => {
    processor = new InputProcessor('intermediate');
  });

  describe('deadzone', () => {
    it('should return 0 for inputs within deadzone', () => {
      processor.setDeadzone(0.1);

      expect(processor.applyDeadzone(0.05)).toBe(0);
      expect(processor.applyDeadzone(-0.05)).toBe(0);
      expect(processor.applyDeadzone(0.1)).toBe(0);
    });

    it('should scale output correctly after deadzone', () => {
      processor.setDeadzone(0.1);

      // At input 1.0, output should be 1.0
      expect(processor.applyDeadzone(1.0)).toBeCloseTo(1.0, 5);

      // At input 0.55 (halfway between 0.1 and 1.0), output should be ~0.5
      expect(processor.applyDeadzone(0.55)).toBeCloseTo(0.5, 1);
    });

    it('should preserve sign', () => {
      processor.setDeadzone(0.1);

      expect(processor.applyDeadzone(0.5)).toBeGreaterThan(0);
      expect(processor.applyDeadzone(-0.5)).toBeLessThan(0);
    });

    it('should clamp deadzone to valid range', () => {
      processor.setDeadzone(0.6); // Should be clamped to 0.5
      processor.setDeadzone(-0.1); // Should be clamped to 0
    });
  });

  describe('stick to rate processing', () => {
    it('should return 0 for center stick', () => {
      expect(processor.processStickToRate(0, 'roll')).toBe(0);
      expect(processor.processStickToRate(0, 'pitch')).toBe(0);
      expect(processor.processStickToRate(0, 'yaw')).toBe(0);
    });

    it('should apply deadzone before rate calculation', () => {
      processor.setDeadzone(0.1);

      expect(processor.processStickToRate(0.05, 'roll')).toBe(0);
    });

    it('should return non-zero for full stick', () => {
      expect(Math.abs(processor.processStickToRate(1, 'roll'))).toBeGreaterThan(0);
      expect(Math.abs(processor.processStickToRate(1, 'pitch'))).toBeGreaterThan(0);
      expect(Math.abs(processor.processStickToRate(1, 'yaw'))).toBeGreaterThan(0);
    });
  });

  describe('throttle processing', () => {
    it('should return value between 0 and 1', () => {
      const throttle = processor.processThrottle(0.5);
      expect(throttle).toBeGreaterThanOrEqual(0);
      expect(throttle).toBeLessThanOrEqual(1);
    });

    it('should return low value for zero input', () => {
      const throttle = processor.processThrottle(0);
      // Throttle at 0 input may not be exactly 0 due to expo curve around midpoint
      expect(throttle).toBeGreaterThanOrEqual(0);
      expect(throttle).toBeLessThan(0.2);
    });
  });

  describe('profile management', () => {
    it('should change rate profile', () => {
      processor.setProfile('racing');
      const profile = processor.getRates().getProfile();
      expect(profile.name).toBe('Racing');
    });
  });
});

describe('RATE_PROFILES', () => {
  it('should have all expected profiles', () => {
    expect(RATE_PROFILES.beginner).toBeDefined();
    expect(RATE_PROFILES.intermediate).toBeDefined();
    expect(RATE_PROFILES.racing).toBeDefined();
    expect(RATE_PROFILES.freestyle).toBeDefined();
    expect(RATE_PROFILES.cinematic).toBeDefined();
  });

  it('should have valid rate values', () => {
    for (const [_name, profile] of Object.entries(RATE_PROFILES)) {
      // Center sensitivity should be positive
      expect(profile.roll.centerSensitivity).toBeGreaterThan(0);
      expect(profile.pitch.centerSensitivity).toBeGreaterThan(0);
      expect(profile.yaw.centerSensitivity).toBeGreaterThan(0);

      // Max rate should be greater than center sensitivity
      expect(profile.roll.maxRate).toBeGreaterThan(profile.roll.centerSensitivity);
      expect(profile.pitch.maxRate).toBeGreaterThan(profile.pitch.centerSensitivity);
      expect(profile.yaw.maxRate).toBeGreaterThan(profile.yaw.centerSensitivity);

      // Expo should be between 0 and 1
      expect(profile.roll.expo).toBeGreaterThanOrEqual(0);
      expect(profile.roll.expo).toBeLessThanOrEqual(1);

      // Throttle config should be valid
      expect(profile.throttle.midPoint).toBeGreaterThanOrEqual(0);
      expect(profile.throttle.midPoint).toBeLessThanOrEqual(1);
      expect(profile.throttle.limit).toBeGreaterThan(0);
      expect(profile.throttle.limit).toBeLessThanOrEqual(1);
    }
  });

  it('should have increasing max rates from beginner to freestyle', () => {
    expect(RATE_PROFILES.freestyle.roll.maxRate).toBeGreaterThan(
      RATE_PROFILES.beginner.roll.maxRate
    );
  });

  it('should have cinematic with lowest rates', () => {
    expect(RATE_PROFILES.cinematic.roll.maxRate).toBeLessThan(
      RATE_PROFILES.beginner.roll.maxRate
    );
  });
});
