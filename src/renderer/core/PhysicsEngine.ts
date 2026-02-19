/**
 * PhysicsEngine - Realistic quadcopter physics simulation
 *
 * Based on real drone physics:
 * - Thrust from 4 motors
 * - Torque from differential thrust
 * - Aerodynamic drag
 * - Gravity
 * - Ground effect
 */

import type { Vector3, Quaternion, DroneConfig, NormalizedInput } from '@shared/types';
import { PHYSICS } from '@shared/constants';

export interface PhysicsState {
  position: Vector3;
  velocity: Vector3;
  rotation: Quaternion;
  angularVelocity: Vector3;
  motorRPM: [number, number, number, number];
}

export interface PhysicsConfig {
  mass: number; // kg
  armLength: number; // meters from center to motor
  motorKv: number; // RPM per volt
  propDiameter: number; // meters
  propPitch: number; // meters per revolution
  dragCoefficient: number;
  maxRPM: number;
  minRPM: number;
  momentOfInertia: Vector3; // kg*m^2
}

const DEFAULT_CONFIG: PhysicsConfig = {
  mass: 0.5,
  armLength: 0.1,
  motorKv: 2300,
  propDiameter: 0.127, // 5 inch
  propPitch: 0.1016, // 4 inch pitch
  dragCoefficient: 0.3,
  maxRPM: 25000,
  minRPM: 1000,
  momentOfInertia: { x: 0.005, y: 0.005, z: 0.009 },
};

export class PhysicsEngine {
  private config: PhysicsConfig;
  private state: PhysicsState;
  private groundLevel: number = 0;

  constructor(config: Partial<PhysicsConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = this.createInitialState();
  }

  private createInitialState(): PhysicsState {
    return {
      position: { x: 0, y: 1, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      angularVelocity: { x: 0, y: 0, z: 0 },
      motorRPM: [0, 0, 0, 0],
    };
  }

  /**
   * Reset physics state to initial
   */
  reset(position?: Vector3): void {
    this.state = this.createInitialState();
    if (position) {
      this.state.position = { ...position };
    }
  }

  /**
   * Get current physics state
   */
  getState(): PhysicsState {
    return { ...this.state };
  }

  /**
   * Update physics simulation
   * @param input - Normalized input from controller
   * @param dt - Delta time in seconds
   * @param droneConfig - Optional drone configuration
   */
  update(input: NormalizedInput, dt: number, droneConfig?: DroneConfig, windForce?: Vector3): void {
    // Apply drone config rates if provided
    const rates = droneConfig?.rates ?? { roll: 400, pitch: 400, yaw: 300 };

    // Calculate target motor RPMs based on input
    const targetRPMs = this.calculateMotorRPMs(input, rates);

    // Smooth motor response (motors can't change RPM instantly)
    const motorResponseRate = 10; // How fast motors respond
    for (let i = 0; i < 4; i++) {
      const diff = targetRPMs[i] - this.state.motorRPM[i];
      this.state.motorRPM[i] += diff * Math.min(1, motorResponseRate * dt);
    }

    // Calculate forces and torques
    const thrust = this.calculateTotalThrust();
    const torque = this.calculateTorque();

    // Apply gravity
    const gravity: Vector3 = { x: 0, y: -PHYSICS.GRAVITY * this.config.mass, z: 0 };

    // Calculate thrust direction (based on drone rotation)
    const thrustWorld = this.rotateVector({ x: 0, y: thrust, z: 0 }, this.state.rotation);

    // Calculate drag
    const drag = this.calculateDrag();

    // Ground effect (increased thrust efficiency near ground)
    const groundEffectMultiplier = this.calculateGroundEffect();
    thrustWorld.y *= groundEffectMultiplier;

    // Wind force (defaults to zero if not provided)
    const wind = windForce ?? { x: 0, y: 0, z: 0 };

    // Sum forces
    const totalForce: Vector3 = {
      x: thrustWorld.x + gravity.x + drag.x + wind.x * this.config.mass,
      y: thrustWorld.y + gravity.y + drag.y + wind.y * this.config.mass,
      z: thrustWorld.z + gravity.z + drag.z + wind.z * this.config.mass,
    };

    // Calculate acceleration (F = ma)
    const acceleration: Vector3 = {
      x: totalForce.x / this.config.mass,
      y: totalForce.y / this.config.mass,
      z: totalForce.z / this.config.mass,
    };

    // Update velocity
    this.state.velocity.x += acceleration.x * dt;
    this.state.velocity.y += acceleration.y * dt;
    this.state.velocity.z += acceleration.z * dt;

    // Update position
    this.state.position.x += this.state.velocity.x * dt;
    this.state.position.y += this.state.velocity.y * dt;
    this.state.position.z += this.state.velocity.z * dt;

    // Calculate angular acceleration
    const angularAcceleration: Vector3 = {
      x: torque.x / this.config.momentOfInertia.x,
      y: torque.y / this.config.momentOfInertia.y,
      z: torque.z / this.config.momentOfInertia.z,
    };

    // Update angular velocity
    this.state.angularVelocity.x += angularAcceleration.x * dt;
    this.state.angularVelocity.y += angularAcceleration.y * dt;
    this.state.angularVelocity.z += angularAcceleration.z * dt;

    // Apply angular drag
    const angularDrag = 0.95;
    this.state.angularVelocity.x *= angularDrag;
    this.state.angularVelocity.y *= angularDrag;
    this.state.angularVelocity.z *= angularDrag;

    // Update rotation quaternion
    this.state.rotation = this.integrateRotation(
      this.state.rotation,
      this.state.angularVelocity,
      dt
    );

    // Ground collision
    this.handleGroundCollision();

    // Boundary checks
    this.handleBoundaries();
  }

  /**
   * Calculate motor RPMs based on input
   * Motor layout (top view):
   *   1 (CW)  2 (CCW)
   *      \  /
   *       \/
   *       /\
   *      /  \
   *   4 (CCW) 3 (CW)
   */
  private calculateMotorRPMs(
    input: NormalizedInput,
    rates: { roll: number; pitch: number; yaw: number }
  ): [number, number, number, number] {
    const { throttle, roll, pitch, yaw } = input;
    const { maxRPM, minRPM } = this.config;

    // Base throttle RPM
    const baseRPM = minRPM + throttle * (maxRPM - minRPM);

    // Scale inputs by rates (convert to RPM differential)
    const rollDiff = roll * (rates.roll / 400) * 2000;
    const pitchDiff = pitch * (rates.pitch / 400) * 2000;
    const yawDiff = yaw * (rates.yaw / 300) * 1500;

    // Calculate individual motor RPMs
    // Motor 1 (front-right, CW): +pitch, +roll, +yaw
    // Motor 2 (front-left, CCW): +pitch, -roll, -yaw
    // Motor 3 (back-right, CW): -pitch, +roll, -yaw
    // Motor 4 (back-left, CCW): -pitch, -roll, +yaw
    const motor1 = baseRPM + pitchDiff + rollDiff + yawDiff;
    const motor2 = baseRPM + pitchDiff - rollDiff - yawDiff;
    const motor3 = baseRPM - pitchDiff + rollDiff - yawDiff;
    const motor4 = baseRPM - pitchDiff - rollDiff + yawDiff;

    // Clamp to valid range
    return [
      Math.max(minRPM, Math.min(maxRPM, motor1)),
      Math.max(minRPM, Math.min(maxRPM, motor2)),
      Math.max(minRPM, Math.min(maxRPM, motor3)),
      Math.max(minRPM, Math.min(maxRPM, motor4)),
    ];
  }

  /**
   * Calculate total thrust from all motors
   */
  private calculateTotalThrust(): number {
    const { propDiameter } = this.config;
    let totalThrust = 0;

    // Simplified thrust calculation: T = Ct * rho * n^2 * D^4
    // Where Ct is thrust coefficient, rho is air density, n is RPM, D is diameter
    const Ct = 0.1; // Approximate thrust coefficient
    const rho = PHYSICS.AIR_DENSITY;

    for (const rpm of this.state.motorRPM) {
      const n = rpm / 60; // Convert to RPS
      const thrust = Ct * rho * n * n * Math.pow(propDiameter, 4);
      totalThrust += thrust;
    }

    return totalThrust;
  }

  /**
   * Calculate torque from differential motor thrust
   */
  private calculateTorque(): Vector3 {
    const { armLength } = this.config;
    const [m1, m2, m3, m4] = this.state.motorRPM;

    // Calculate thrust per motor (simplified)
    const thrustPerRPM = 0.00001; // Simplified conversion
    const t1 = m1 * thrustPerRPM;
    const t2 = m2 * thrustPerRPM;
    const t3 = m3 * thrustPerRPM;
    const t4 = m4 * thrustPerRPM;

    // Roll torque (difference between left and right motors)
    const rollTorque = (t1 + t3 - t2 - t4) * armLength;

    // Pitch torque (difference between front and back motors)
    const pitchTorque = (t1 + t2 - t3 - t4) * armLength;

    // Yaw torque (from motor reaction torque - CW vs CCW)
    const yawTorqueCoeff = 0.01;
    const yawTorque = (t1 - t2 + t3 - t4) * yawTorqueCoeff;

    return { x: pitchTorque, y: yawTorque, z: rollTorque };
  }

  /**
   * Calculate aerodynamic drag
   */
  private calculateDrag(): Vector3 {
    const { dragCoefficient } = this.config;
    const { velocity } = this.state;

    const speed = Math.sqrt(
      velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z
    );

    if (speed < 0.01) return { x: 0, y: 0, z: 0 };

    // Drag force = 0.5 * Cd * rho * A * v^2
    const dragMagnitude = 0.5 * dragCoefficient * PHYSICS.AIR_DENSITY * 0.01 * speed * speed;

    // Apply drag opposite to velocity direction
    return {
      x: (-velocity.x / speed) * dragMagnitude,
      y: (-velocity.y / speed) * dragMagnitude,
      z: (-velocity.z / speed) * dragMagnitude,
    };
  }

  /**
   * Calculate ground effect multiplier
   */
  private calculateGroundEffect(): number {
    const heightAboveGround = this.state.position.y - this.groundLevel;
    const rotorDiameter = this.config.propDiameter;

    if (heightAboveGround > rotorDiameter * 2) {
      return 1.0; // No ground effect
    }

    // Ground effect increases thrust by up to 30% when very close to ground
    const effectStrength = 1 - heightAboveGround / (rotorDiameter * 2);
    return 1 + effectStrength * 0.3;
  }

  /**
   * Handle ground collision
   */
  private handleGroundCollision(): void {
    const groundOffset = 0.1; // Drone center height when on ground

    if (this.state.position.y < this.groundLevel + groundOffset) {
      this.state.position.y = this.groundLevel + groundOffset;

      // Bounce or stop based on velocity
      if (this.state.velocity.y < -2) {
        // Hard landing - could trigger crash
        this.state.velocity.y = -this.state.velocity.y * 0.2;
        this.state.velocity.x *= 0.5;
        this.state.velocity.z *= 0.5;
      } else {
        this.state.velocity.y = 0;
        // Ground friction
        this.state.velocity.x *= 0.9;
        this.state.velocity.z *= 0.9;
      }

      // Reset angular velocity on ground
      this.state.angularVelocity.x *= 0.5;
      this.state.angularVelocity.z *= 0.5;
    }
  }

  /**
   * Handle boundary limits
   */
  private handleBoundaries(): void {
    const maxAltitude = PHYSICS.MAX_ALTITUDE;
    const maxDistance = 500;

    // Altitude limit
    if (this.state.position.y > maxAltitude) {
      this.state.position.y = maxAltitude;
      this.state.velocity.y = Math.min(0, this.state.velocity.y);
    }

    // Horizontal boundaries
    if (Math.abs(this.state.position.x) > maxDistance) {
      this.state.position.x = Math.sign(this.state.position.x) * maxDistance;
      this.state.velocity.x = 0;
    }
    if (Math.abs(this.state.position.z) > maxDistance) {
      this.state.position.z = Math.sign(this.state.position.z) * maxDistance;
      this.state.velocity.z = 0;
    }
  }

  /**
   * Rotate a vector by a quaternion
   */
  private rotateVector(v: Vector3, q: Quaternion): Vector3 {
    // Convert quaternion rotation to matrix and apply
    const x = v.x,
      y = v.y,
      z = v.z;
    const qx = q.x,
      qy = q.y,
      qz = q.z,
      qw = q.w;

    // Calculate quaternion * vector * quaternion^-1
    const ix = qw * x + qy * z - qz * y;
    const iy = qw * y + qz * x - qx * z;
    const iz = qw * z + qx * y - qy * x;
    const iw = -qx * x - qy * y - qz * z;

    return {
      x: ix * qw + iw * -qx + iy * -qz - iz * -qy,
      y: iy * qw + iw * -qy + iz * -qx - ix * -qz,
      z: iz * qw + iw * -qz + ix * -qy - iy * -qx,
    };
  }

  /**
   * Integrate rotation using angular velocity
   */
  private integrateRotation(q: Quaternion, omega: Vector3, dt: number): Quaternion {
    const halfDt = dt * 0.5;

    // Create quaternion from angular velocity
    const dq: Quaternion = {
      x: omega.x * halfDt,
      y: omega.y * halfDt,
      z: omega.z * halfDt,
      w: 1,
    };

    // Multiply quaternions
    const result = this.multiplyQuaternions(q, dq);

    // Normalize
    return this.normalizeQuaternion(result);
  }

  /**
   * Multiply two quaternions
   */
  private multiplyQuaternions(a: Quaternion, b: Quaternion): Quaternion {
    return {
      x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
      y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
      z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
      w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
    };
  }

  /**
   * Normalize a quaternion
   */
  private normalizeQuaternion(q: Quaternion): Quaternion {
    const len = Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w);
    if (len === 0) return { x: 0, y: 0, z: 0, w: 1 };
    return {
      x: q.x / len,
      y: q.y / len,
      z: q.z / len,
      w: q.w / len,
    };
  }

  /**
   * Check if drone has crashed (hard landing)
   */
  isCrashed(): boolean {
    // Check if drone hit ground with high velocity
    const { velocity, position } = this.state;
    const groundOffset = 0.15;

    if (position.y <= this.groundLevel + groundOffset) {
      const impactSpeed = Math.sqrt(
        velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z
      );
      return impactSpeed > 5; // Crash if impact > 5 m/s
    }

    return false;
  }

  /**
   * Get Euler angles from current rotation
   */
  getEulerAngles(): { roll: number; pitch: number; yaw: number } {
    const { rotation: q } = this.state;

    // Convert quaternion to Euler angles
    const sinr_cosp = 2 * (q.w * q.x + q.y * q.z);
    const cosr_cosp = 1 - 2 * (q.x * q.x + q.y * q.y);
    const roll = Math.atan2(sinr_cosp, cosr_cosp);

    const sinp = 2 * (q.w * q.y - q.z * q.x);
    const pitch = Math.abs(sinp) >= 1 ? (Math.sign(sinp) * Math.PI) / 2 : Math.asin(sinp);

    const siny_cosp = 2 * (q.w * q.z + q.x * q.y);
    const cosy_cosp = 1 - 2 * (q.y * q.y + q.z * q.z);
    const yaw = Math.atan2(siny_cosp, cosy_cosp);

    return {
      roll: roll * (180 / Math.PI),
      pitch: pitch * (180 / Math.PI),
      yaw: yaw * (180 / Math.PI),
    };
  }
}
