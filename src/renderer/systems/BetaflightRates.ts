/**
 * BetaflightRates - Professional FPV Drone Rate System
 *
 * Implements Betaflight's "Actual Rates" model which is the default since BF 4.3
 * Based on research from:
 * - Oscar Liang's FPV Drone Rates guide
 * - Betaflight Rate Calculator
 * - GetFPV tuning guides
 *
 * The Actual Rates model uses three independent parameters:
 * - Center Sensitivity: deg/s at stick center (how snappy it feels)
 * - Max Rate: deg/s at full stick deflection
 * - Expo: Curve shape (0 = linear, 1 = maximum expo)
 */

export type RateModel = 'actual' | 'betaflight' | 'kiss' | 'quick';

export interface AxisRates {
  centerSensitivity: number;  // deg/s at center (Actual Rates)
  maxRate: number;            // deg/s at full stick
  expo: number;               // 0-1 curve shape
}

export interface ThrottleConfig {
  midPoint: number;           // 0-1, where hover is (typically 0.5)
  expo: number;               // 0-1 throttle curve
  limit: number;              // 0-1 max throttle (for safety)
}

export interface RateProfile {
  name: string;
  description: string;
  roll: AxisRates;
  pitch: AxisRates;
  yaw: AxisRates;
  throttle: ThrottleConfig;
}

// Pre-defined rate profiles based on common FPV flying styles
export const RATE_PROFILES: Record<string, RateProfile> = {
  beginner: {
    name: 'Beginner',
    description: 'Low rates, high expo for smooth learning',
    roll: { centerSensitivity: 70, maxRate: 360, expo: 0.4 },
    pitch: { centerSensitivity: 70, maxRate: 360, expo: 0.4 },
    yaw: { centerSensitivity: 50, maxRate: 200, expo: 0.3 },
    throttle: { midPoint: 0.5, expo: 0.2, limit: 0.8 },
  },

  intermediate: {
    name: 'Intermediate',
    description: 'Balanced rates for general flying',
    roll: { centerSensitivity: 150, maxRate: 670, expo: 0.35 },
    pitch: { centerSensitivity: 150, maxRate: 670, expo: 0.35 },
    yaw: { centerSensitivity: 100, maxRate: 400, expo: 0.25 },
    throttle: { midPoint: 0.5, expo: 0.15, limit: 1.0 },
  },

  racing: {
    name: 'Racing',
    description: 'Linear response, moderate rates for track racing',
    roll: { centerSensitivity: 200, maxRate: 550, expo: 0.15 },
    pitch: { centerSensitivity: 200, maxRate: 550, expo: 0.15 },
    yaw: { centerSensitivity: 150, maxRate: 400, expo: 0.1 },
    throttle: { midPoint: 0.45, expo: 0.0, limit: 1.0 },
  },

  freestyle: {
    name: 'Freestyle',
    description: 'High rates with expo for tricks and flips',
    roll: { centerSensitivity: 180, maxRate: 860, expo: 0.45 },
    pitch: { centerSensitivity: 180, maxRate: 860, expo: 0.45 },
    yaw: { centerSensitivity: 120, maxRate: 520, expo: 0.35 },
    throttle: { midPoint: 0.5, expo: 0.1, limit: 1.0 },
  },

  cinematic: {
    name: 'Cinematic',
    description: 'Very smooth, low rates for video',
    roll: { centerSensitivity: 40, maxRate: 200, expo: 0.6 },
    pitch: { centerSensitivity: 40, maxRate: 200, expo: 0.6 },
    yaw: { centerSensitivity: 30, maxRate: 150, expo: 0.5 },
    throttle: { midPoint: 0.5, expo: 0.3, limit: 0.7 },
  },

  // Pro pilot presets
  mrSteele: {
    name: 'Mr Steele Style',
    description: 'High rates freestyle inspired by Mr Steele',
    roll: { centerSensitivity: 200, maxRate: 950, expo: 0.4 },
    pitch: { centerSensitivity: 200, maxRate: 950, expo: 0.4 },
    yaw: { centerSensitivity: 150, maxRate: 600, expo: 0.35 },
    throttle: { midPoint: 0.5, expo: 0.1, limit: 1.0 },
  },

  skitzo: {
    name: 'Skitzo Style',
    description: 'Very high rates for aggressive freestyle',
    roll: { centerSensitivity: 250, maxRate: 1100, expo: 0.5 },
    pitch: { centerSensitivity: 250, maxRate: 1100, expo: 0.5 },
    yaw: { centerSensitivity: 180, maxRate: 700, expo: 0.4 },
    throttle: { midPoint: 0.5, expo: 0.0, limit: 1.0 },
  },
};

/**
 * BetaflightRates - Calculate rotation rates from stick input
 */
export class BetaflightRates {
  private profile: RateProfile;

  constructor(profileName: string = 'intermediate') {
    this.profile = RATE_PROFILES[profileName] || RATE_PROFILES.intermediate;
  }

  /**
   * Set the rate profile
   */
  setProfile(profileName: string): void {
    if (RATE_PROFILES[profileName]) {
      this.profile = RATE_PROFILES[profileName];
    }
  }

  /**
   * Set custom profile
   */
  setCustomProfile(profile: RateProfile): void {
    this.profile = profile;
  }

  /**
   * Get current profile
   */
  getProfile(): RateProfile {
    return this.profile;
  }

  /**
   * Get all available profiles
   */
  static getAvailableProfiles(): string[] {
    return Object.keys(RATE_PROFILES);
  }

  /**
   * Calculate roll rate from stick input
   * @param stickInput -1 to 1 stick position
   * @returns deg/s rotation rate
   */
  calculateRollRate(stickInput: number): number {
    return this.calculateAxisRate(stickInput, this.profile.roll);
  }

  /**
   * Calculate pitch rate from stick input
   * @param stickInput -1 to 1 stick position
   * @returns deg/s rotation rate
   */
  calculatePitchRate(stickInput: number): number {
    return this.calculateAxisRate(stickInput, this.profile.pitch);
  }

  /**
   * Calculate yaw rate from stick input
   * @param stickInput -1 to 1 stick position
   * @returns deg/s rotation rate
   */
  calculateYawRate(stickInput: number): number {
    return this.calculateAxisRate(stickInput, this.profile.yaw);
  }

  /**
   * Calculate throttle output from stick input
   * @param stickInput 0 to 1 throttle position
   * @returns 0 to 1 throttle output
   */
  calculateThrottle(stickInput: number): number {
    const { midPoint, expo, limit } = this.profile.throttle;

    // Apply throttle expo curve
    let output: number;

    if (expo > 0) {
      // Expo curve centered around midpoint
      const centered = stickInput - midPoint;
      const expoValue = centered * (1 - expo) + Math.pow(Math.abs(centered), 3) * Math.sign(centered) * expo;
      output = expoValue + midPoint;
    } else {
      output = stickInput;
    }

    // Apply limit
    return Math.max(0, Math.min(limit, output));
  }

  /**
   * Calculate axis rate using Betaflight Actual Rates formula
   *
   * The Actual Rates formula:
   * rate = centerSensitivity + (maxRate - centerSensitivity) * f(x, expo)
   *
   * Where f(x, expo) defines the curve shape:
   * f(x, expo) = x * (1 - expo) + x^3 * expo (for abs(x))
   */
  private calculateAxisRate(stickInput: number, axisRates: AxisRates): number {
    const { centerSensitivity, maxRate, expo } = axisRates;

    const absInput = Math.abs(stickInput);
    const sign = Math.sign(stickInput);

    // Calculate the expo curve factor
    // At stick center (0), this is 0
    // At full stick (1), this is 1
    const expoCurve = absInput * (1 - expo) + Math.pow(absInput, 3) * expo;

    // Calculate final rate
    // At center: rate approaches centerSensitivity * stickInput
    // At full stick: rate = maxRate
    const rate = centerSensitivity * absInput + (maxRate - centerSensitivity) * expoCurve;

    return rate * sign;
  }

  /**
   * Get rate at specific stick position (for visualization)
   */
  getRateCurvePoint(stickPosition: number, axis: 'roll' | 'pitch' | 'yaw'): number {
    switch (axis) {
      case 'roll':
        return this.calculateRollRate(stickPosition);
      case 'pitch':
        return this.calculatePitchRate(stickPosition);
      case 'yaw':
        return this.calculateYawRate(stickPosition);
    }
  }

  /**
   * Generate rate curve data for visualization
   * @param axis Which axis to generate curve for
   * @param points Number of points to generate
   */
  generateRateCurve(axis: 'roll' | 'pitch' | 'yaw', points: number = 100): { x: number; y: number }[] {
    const curve: { x: number; y: number }[] = [];

    for (let i = 0; i <= points; i++) {
      const x = (i / points) * 2 - 1; // -1 to 1
      const y = this.getRateCurvePoint(x, axis);
      curve.push({ x, y });
    }

    return curve;
  }

  /**
   * Convert between different rate systems (for import/export)
   */
  static convertFromBetaflightRates(
    rcRate: number,
    superRate: number,
    rcExpo: number
  ): AxisRates {
    // Betaflight classic rates conversion
    // Center sensitivity ≈ rcRate * 200
    // Max rate depends on superRate
    // Expo maps directly

    const centerSensitivity = rcRate * 200;
    const maxRate = rcRate * 200 * (1 + superRate * 2.5);

    return {
      centerSensitivity,
      maxRate,
      expo: rcExpo,
    };
  }

  /**
   * Convert to Betaflight classic rates format
   */
  static convertToBetaflightRates(axisRates: AxisRates): {
    rcRate: number;
    superRate: number;
    rcExpo: number;
  } {
    const rcRate = axisRates.centerSensitivity / 200;
    const superRate = (axisRates.maxRate / axisRates.centerSensitivity - 1) / 2.5;

    return {
      rcRate: Math.min(2.55, Math.max(0.01, rcRate)),
      superRate: Math.min(1.0, Math.max(0, superRate)),
      rcExpo: axisRates.expo,
    };
  }
}

/**
 * Input processing utilities
 */
export class InputProcessor {
  private deadzone: number = 0.02;
  private rates: BetaflightRates;

  constructor(profileName: string = 'intermediate') {
    this.rates = new BetaflightRates(profileName);
  }

  /**
   * Set deadzone
   */
  setDeadzone(deadzone: number): void {
    this.deadzone = Math.max(0, Math.min(0.5, deadzone));
  }

  /**
   * Apply deadzone to input
   */
  applyDeadzone(input: number): number {
    const absInput = Math.abs(input);
    if (absInput < this.deadzone) return 0;

    const sign = Math.sign(input);
    return sign * ((absInput - this.deadzone) / (1 - this.deadzone));
  }

  /**
   * Process raw stick input to rotation rate
   */
  processStickToRate(
    rawInput: number,
    axis: 'roll' | 'pitch' | 'yaw'
  ): number {
    const deadzoned = this.applyDeadzone(rawInput);

    switch (axis) {
      case 'roll':
        return this.rates.calculateRollRate(deadzoned);
      case 'pitch':
        return this.rates.calculatePitchRate(deadzoned);
      case 'yaw':
        return this.rates.calculateYawRate(deadzoned);
    }
  }

  /**
   * Process throttle input
   */
  processThrottle(rawInput: number): number {
    // Throttle typically doesn't use deadzone, just expo
    return this.rates.calculateThrottle(rawInput);
  }

  /**
   * Get the rates calculator
   */
  getRates(): BetaflightRates {
    return this.rates;
  }

  /**
   * Set rate profile
   */
  setProfile(profileName: string): void {
    this.rates.setProfile(profileName);
  }
}

// Default singleton instance
export const betaflightRates = new BetaflightRates('intermediate');
export const inputProcessor = new InputProcessor('intermediate');
