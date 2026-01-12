/**
 * PIDController - Generic PID controller with anti-windup
 *
 * Used for cascade flight control:
 * - Attitude PID (outer loop): angle error → rate setpoint
 * - Rate PID (inner loop): rate error → motor commands
 */

export interface PIDGains {
  p: number; // Proportional gain
  i: number; // Integral gain
  d: number; // Derivative gain
}

export interface PIDState {
  integral: number;
  previousError: number;
  previousDerivative: number; // For derivative filtering
}

export interface PIDConfig {
  gains: PIDGains;
  outputLimit: number; // Max output magnitude
  integralLimit: number; // Anti-windup: max integral accumulation
  derivativeFilterCoeff: number; // Low-pass filter for derivative (0-1, lower = more filtering)
}

/**
 * Betaflight-compatible PID defaults
 * Scaled for our physics simulation
 */
export const BETAFLIGHT_DEFAULTS = {
  roll: {
    rate: { p: 45, i: 80, d: 40 },
    attitude: { p: 5.0, i: 0.5, d: 0.1 },
  },
  pitch: {
    rate: { p: 47, i: 84, d: 46 },
    attitude: { p: 5.0, i: 0.5, d: 0.1 },
  },
  yaw: {
    rate: { p: 45, i: 80, d: 0 },
    attitude: { p: 3.0, i: 0.3, d: 0.0 },
  },
};

export class PIDController {
  private config: PIDConfig;
  private state: PIDState;

  constructor(config: Partial<PIDConfig> = {}) {
    this.config = {
      gains: config.gains ?? { p: 1, i: 0, d: 0 },
      outputLimit: config.outputLimit ?? 1000,
      integralLimit: config.integralLimit ?? 500,
      derivativeFilterCoeff: config.derivativeFilterCoeff ?? 0.5,
    };
    this.state = this.createInitialState();
  }

  private createInitialState(): PIDState {
    return {
      integral: 0,
      previousError: 0,
      previousDerivative: 0,
    };
  }

  /**
   * Update PID controller
   * @param setpoint - Desired value
   * @param measured - Current measured value
   * @param dt - Delta time in seconds
   * @returns Control output
   */
  update(setpoint: number, measured: number, dt: number): number {
    if (dt <= 0) return 0;

    const error = setpoint - measured;

    // Proportional term
    const pTerm = this.config.gains.p * error;

    // Integral term with anti-windup
    this.state.integral += error * dt;
    this.state.integral = this.clamp(
      this.state.integral,
      -this.config.integralLimit,
      this.config.integralLimit
    );
    const iTerm = this.config.gains.i * this.state.integral;

    // Derivative term with low-pass filter to reduce noise
    const rawDerivative = (error - this.state.previousError) / dt;
    const filteredDerivative =
      this.state.previousDerivative +
      this.config.derivativeFilterCoeff * (rawDerivative - this.state.previousDerivative);
    const dTerm = this.config.gains.d * filteredDerivative;

    // Store state for next iteration
    this.state.previousError = error;
    this.state.previousDerivative = filteredDerivative;

    // Calculate total output
    const output = pTerm + iTerm + dTerm;

    // Clamp output
    return this.clamp(output, -this.config.outputLimit, this.config.outputLimit);
  }

  /**
   * Reset PID state (call on mode switch or disarm)
   */
  reset(): void {
    this.state = this.createInitialState();
  }

  /**
   * Get current PID gains
   */
  getGains(): PIDGains {
    return { ...this.config.gains };
  }

  /**
   * Set PID gains
   */
  setGains(gains: Partial<PIDGains>): void {
    this.config.gains = { ...this.config.gains, ...gains };
  }

  /**
   * Get full config
   */
  getConfig(): PIDConfig {
    return { ...this.config };
  }

  /**
   * Set full config
   */
  setConfig(config: Partial<PIDConfig>): void {
    if (config.gains) {
      this.config.gains = { ...this.config.gains, ...config.gains };
    }
    if (config.outputLimit !== undefined) {
      this.config.outputLimit = config.outputLimit;
    }
    if (config.integralLimit !== undefined) {
      this.config.integralLimit = config.integralLimit;
    }
    if (config.derivativeFilterCoeff !== undefined) {
      this.config.derivativeFilterCoeff = config.derivativeFilterCoeff;
    }
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}

/**
 * FlightController - Cascade PID system for drone stabilization
 *
 * Architecture:
 * Pilot Input → Attitude PID (outer) → Rate PID (inner) → Motor Mixer
 *
 * Modes:
 * - ANGLE: Outer + Inner loop (self-leveling)
 * - ACRO: Inner loop only (rate mode)
 */
export interface FlightControllerConfig {
  roll: {
    rate: PIDConfig;
    attitude: PIDConfig;
  };
  pitch: {
    rate: PIDConfig;
    attitude: PIDConfig;
  };
  yaw: {
    rate: PIDConfig;
    attitude: PIDConfig;
  };
}

export interface FlightControllerOutput {
  roll: number; // Motor mix command for roll
  pitch: number; // Motor mix command for pitch
  yaw: number; // Motor mix command for yaw
}

export class FlightController {
  // Rate PIDs (inner loop)
  private rollRatePID: PIDController;
  private pitchRatePID: PIDController;
  private yawRatePID: PIDController;

  // Attitude PIDs (outer loop)
  private rollAttitudePID: PIDController;
  private pitchAttitudePID: PIDController;
  private yawAttitudePID: PIDController;

  // Configuration
  private maxAngle: number = 55; // Max tilt angle in degrees (angle mode)
  private maxRates: { roll: number; pitch: number; yaw: number } = {
    roll: 670, // deg/s
    pitch: 670,
    yaw: 400,
  };

  constructor(config?: Partial<FlightControllerConfig>) {
    // Initialize rate PIDs with Betaflight-like defaults
    this.rollRatePID = new PIDController({
      gains: config?.roll?.rate?.gains ?? { p: 0.045, i: 0.08, d: 0.004 },
      outputLimit: 500,
      integralLimit: 200,
      derivativeFilterCoeff: 0.3,
    });

    this.pitchRatePID = new PIDController({
      gains: config?.pitch?.rate?.gains ?? { p: 0.047, i: 0.084, d: 0.0046 },
      outputLimit: 500,
      integralLimit: 200,
      derivativeFilterCoeff: 0.3,
    });

    this.yawRatePID = new PIDController({
      gains: config?.yaw?.rate?.gains ?? { p: 0.045, i: 0.08, d: 0 },
      outputLimit: 400,
      integralLimit: 150,
      derivativeFilterCoeff: 0.5,
    });

    // Initialize attitude PIDs
    this.rollAttitudePID = new PIDController({
      gains: config?.roll?.attitude?.gains ?? { p: 5.0, i: 0.5, d: 0.1 },
      outputLimit: this.maxRates.roll,
      integralLimit: 100,
      derivativeFilterCoeff: 0.5,
    });

    this.pitchAttitudePID = new PIDController({
      gains: config?.pitch?.attitude?.gains ?? { p: 5.0, i: 0.5, d: 0.1 },
      outputLimit: this.maxRates.pitch,
      integralLimit: 100,
      derivativeFilterCoeff: 0.5,
    });

    this.yawAttitudePID = new PIDController({
      gains: config?.yaw?.attitude?.gains ?? { p: 3.0, i: 0.3, d: 0 },
      outputLimit: this.maxRates.yaw,
      integralLimit: 50,
      derivativeFilterCoeff: 0.5,
    });
  }

  /**
   * Update flight controller in ANGLE mode (self-leveling)
   * @param input - Pilot input (-1 to 1 for roll/pitch/yaw)
   * @param currentAttitude - Current Euler angles in degrees
   * @param currentRates - Current angular velocities in deg/s
   * @param dt - Delta time in seconds
   */
  updateAngleMode(
    input: { roll: number; pitch: number; yaw: number },
    currentAttitude: { roll: number; pitch: number; yaw: number },
    currentRates: { roll: number; pitch: number; yaw: number },
    dt: number
  ): FlightControllerOutput {
    // Convert input to desired angles (scaled by max angle)
    const desiredRoll = input.roll * this.maxAngle;
    const desiredPitch = input.pitch * this.maxAngle;
    // Yaw is rate-based even in angle mode
    const desiredYawRate = input.yaw * this.maxRates.yaw;

    // Outer loop: attitude → rate setpoint
    const rollRateSetpoint = this.rollAttitudePID.update(desiredRoll, currentAttitude.roll, dt);
    const pitchRateSetpoint = this.pitchAttitudePID.update(
      desiredPitch,
      currentAttitude.pitch,
      dt
    );

    // Inner loop: rate → motor command
    const rollOutput = this.rollRatePID.update(rollRateSetpoint, currentRates.roll, dt);
    const pitchOutput = this.pitchRatePID.update(pitchRateSetpoint, currentRates.pitch, dt);
    const yawOutput = this.yawRatePID.update(desiredYawRate, currentRates.yaw, dt);

    return { roll: rollOutput, pitch: pitchOutput, yaw: yawOutput };
  }

  /**
   * Update flight controller in ACRO mode (rate mode)
   * @param input - Pilot input (-1 to 1 for roll/pitch/yaw)
   * @param currentRates - Current angular velocities in deg/s
   * @param dt - Delta time in seconds
   */
  updateAcroMode(
    input: { roll: number; pitch: number; yaw: number },
    currentRates: { roll: number; pitch: number; yaw: number },
    dt: number
  ): FlightControllerOutput {
    // Convert input directly to rate setpoints
    const desiredRollRate = input.roll * this.maxRates.roll;
    const desiredPitchRate = input.pitch * this.maxRates.pitch;
    const desiredYawRate = input.yaw * this.maxRates.yaw;

    // Inner loop only: rate → motor command
    const rollOutput = this.rollRatePID.update(desiredRollRate, currentRates.roll, dt);
    const pitchOutput = this.pitchRatePID.update(desiredPitchRate, currentRates.pitch, dt);
    const yawOutput = this.yawRatePID.update(desiredYawRate, currentRates.yaw, dt);

    return { roll: rollOutput, pitch: pitchOutput, yaw: yawOutput };
  }

  /**
   * Reset all PID controllers
   */
  reset(): void {
    this.rollRatePID.reset();
    this.pitchRatePID.reset();
    this.yawRatePID.reset();
    this.rollAttitudePID.reset();
    this.pitchAttitudePID.reset();
    this.yawAttitudePID.reset();
  }

  /**
   * Set rate PID gains for an axis
   */
  setRatePIDGains(axis: 'roll' | 'pitch' | 'yaw', gains: Partial<PIDGains>): void {
    switch (axis) {
      case 'roll':
        this.rollRatePID.setGains(gains);
        break;
      case 'pitch':
        this.pitchRatePID.setGains(gains);
        break;
      case 'yaw':
        this.yawRatePID.setGains(gains);
        break;
    }
  }

  /**
   * Set attitude PID gains for an axis
   */
  setAttitudePIDGains(axis: 'roll' | 'pitch' | 'yaw', gains: Partial<PIDGains>): void {
    switch (axis) {
      case 'roll':
        this.rollAttitudePID.setGains(gains);
        break;
      case 'pitch':
        this.pitchAttitudePID.setGains(gains);
        break;
      case 'yaw':
        this.yawAttitudePID.setGains(gains);
        break;
    }
  }

  /**
   * Get current rate PID gains
   */
  getRatePIDGains(): { roll: PIDGains; pitch: PIDGains; yaw: PIDGains } {
    return {
      roll: this.rollRatePID.getGains(),
      pitch: this.pitchRatePID.getGains(),
      yaw: this.yawRatePID.getGains(),
    };
  }

  /**
   * Get current attitude PID gains
   */
  getAttitudePIDGains(): { roll: PIDGains; pitch: PIDGains; yaw: PIDGains } {
    return {
      roll: this.rollAttitudePID.getGains(),
      pitch: this.pitchAttitudePID.getGains(),
      yaw: this.yawAttitudePID.getGains(),
    };
  }

  /**
   * Set max rates (deg/s)
   */
  setMaxRates(rates: { roll?: number; pitch?: number; yaw?: number }): void {
    if (rates.roll !== undefined) this.maxRates.roll = rates.roll;
    if (rates.pitch !== undefined) this.maxRates.pitch = rates.pitch;
    if (rates.yaw !== undefined) this.maxRates.yaw = rates.yaw;

    // Update attitude PID output limits to match new rates
    this.rollAttitudePID.setConfig({ outputLimit: this.maxRates.roll });
    this.pitchAttitudePID.setConfig({ outputLimit: this.maxRates.pitch });
    this.yawAttitudePID.setConfig({ outputLimit: this.maxRates.yaw });
  }

  /**
   * Set max angle for angle mode (degrees)
   */
  setMaxAngle(angle: number): void {
    this.maxAngle = angle;
  }
}
