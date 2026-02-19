/**
 * TrickDetector - Freestyle trick recognition system
 *
 * Tracks flight frame history and detects:
 * - Flips (forward/back/left/right) via pitch/roll rotation
 * - Rolls (left/right) via roll rotation
 * - Yaw spins (360/720) via yaw rotation
 * - Power loops (pitch flip + altitude gain)
 * - Inverted hang (sustained inverted flight)
 *
 * Combo system with multiplier for chaining tricks.
 */

import type { TrickType, TrickTier, TrickEvent, Vector3 } from '@shared/types';
import { TRICK_SCORES } from '@shared/constants';

interface FlightFrame {
  timestamp: number;
  position: Vector3;
  velocity: Vector3;
  euler: { roll: number; pitch: number; yaw: number }; // degrees
  altitude: number;
}

const MAX_FRAMES = 300; // ~5 seconds at 60fps
const COMBO_WINDOW = 3000; // ms
const TRICK_COOLDOWN = 2000; // ms per trick type

export class TrickDetector {
  private frames: FlightFrame[] = [];
  private cumulativeRoll = 0;
  private cumulativePitch = 0;
  private cumulativeYaw = 0;
  private lastEuler = { roll: 0, pitch: 0, yaw: 0 };

  // Combo tracking
  private comboCount = 0;
  private lastTrickTime = 0;
  private comboMultiplier = 1;

  // Per-trick cooldowns
  private cooldowns: Map<TrickType, number> = new Map();

  // Callback for detected tricks
  private onTrick: ((event: TrickEvent) => void) | null = null;

  // Inverted tracking
  private invertedStartTime = 0;
  private isInverted = false;

  setOnTrick(callback: (event: TrickEvent) => void): void {
    this.onTrick = callback;
  }

  /**
   * Feed a new flight frame for analysis
   */
  addFrame(frame: FlightFrame): void {
    // Track cumulative rotation (handle wrapping)
    if (this.frames.length > 0) {
      const dRoll = this.shortestAngle(this.lastEuler.roll, frame.euler.roll);
      const dPitch = this.shortestAngle(this.lastEuler.pitch, frame.euler.pitch);
      const dYaw = this.shortestAngle(this.lastEuler.yaw, frame.euler.yaw);

      this.cumulativeRoll += dRoll;
      this.cumulativePitch += dPitch;
      this.cumulativeYaw += dYaw;
    }
    this.lastEuler = { ...frame.euler };

    this.frames.push(frame);
    if (this.frames.length > MAX_FRAMES) {
      this.frames.shift();
    }

    // Detect tricks
    this.detectTricks(frame);
  }

  private shortestAngle(from: number, to: number): number {
    let diff = to - from;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    return diff;
  }

  private detectTricks(currentFrame: FlightFrame): void {
    const now = currentFrame.timestamp;

    // Update combo state
    if (now - this.lastTrickTime > COMBO_WINDOW) {
      this.comboCount = 0;
      this.comboMultiplier = 1;
    }

    // Check inverted hang
    this.checkInvertedHang(currentFrame);

    // Check cumulative rotations over recent windows
    this.checkFlips(now);
    this.checkRolls(now);
    this.checkYawSpins(now);
    this.checkPowerLoop(now);

    // Decay cumulative tracking slowly
    this.cumulativeRoll *= 0.995;
    this.cumulativePitch *= 0.995;
    this.cumulativeYaw *= 0.995;
  }

  private checkFlips(now: number): void {
    // Check for pitch flips (>340 degrees within 2 seconds)
    const pitchAbs = Math.abs(this.cumulativePitch);
    if (pitchAbs > 340) {
      const trickType: TrickType = this.cumulativePitch > 0 ? 'FLIP_FORWARD' : 'FLIP_BACKWARD';
      if (this.tryEmitTrick(trickType, now)) {
        this.cumulativePitch = 0;
      }
    }

    // Check for roll-based flips (>340 degrees within 2 seconds)
    const rollAbs = Math.abs(this.cumulativeRoll);
    if (rollAbs > 340 && rollAbs < 380) {
      const trickType: TrickType = this.cumulativeRoll > 0 ? 'FLIP_RIGHT' : 'FLIP_LEFT';
      if (this.tryEmitTrick(trickType, now)) {
        this.cumulativeRoll = 0;
      }
    }
  }

  private checkRolls(now: number): void {
    // Full rolls (>340 degrees roll within 1.5 seconds, higher threshold)
    const rollAbs = Math.abs(this.cumulativeRoll);
    if (rollAbs >= 380) {
      const trickType: TrickType = this.cumulativeRoll > 0 ? 'ROLL_RIGHT' : 'ROLL_LEFT';
      if (this.tryEmitTrick(trickType, now)) {
        this.cumulativeRoll = this.cumulativeRoll % 360;
      }
    }
  }

  private checkYawSpins(now: number): void {
    const yawAbs = Math.abs(this.cumulativeYaw);

    if (yawAbs > 700) {
      if (this.tryEmitTrick('YAW_SPIN_720', now)) {
        this.cumulativeYaw = this.cumulativeYaw % 360;
      }
    } else if (yawAbs > 340) {
      if (this.tryEmitTrick('YAW_SPIN_360', now)) {
        this.cumulativeYaw = this.cumulativeYaw % 360;
      }
    }
  }

  private checkPowerLoop(now: number): void {
    if (this.frames.length < 60) return; // Need at least 1 second of data

    // Power loop: pitch flip + altitude gain during the maneuver
    const recent = this.frames.slice(-60);
    const startAlt = recent[0].altitude;
    const maxAlt = Math.max(...recent.map(f => f.altitude));
    const altGain = maxAlt - startAlt;

    const pitchAbs = Math.abs(this.cumulativePitch);

    if (pitchAbs > 300 && altGain > 3) {
      if (this.tryEmitTrick('POWER_LOOP', now)) {
        this.cumulativePitch = 0;
      }
    }
  }

  private checkInvertedHang(frame: FlightFrame): void {
    const rollAbs = Math.abs(frame.euler.roll);
    const isCurrentlyInverted = rollAbs > 150;

    if (isCurrentlyInverted && !this.isInverted) {
      this.invertedStartTime = frame.timestamp;
      this.isInverted = true;
    } else if (!isCurrentlyInverted && this.isInverted) {
      this.isInverted = false;
    }

    if (this.isInverted && frame.timestamp - this.invertedStartTime > 1000) {
      if (this.tryEmitTrick('INVERTED_HANG', frame.timestamp)) {
        this.invertedStartTime = frame.timestamp; // Reset for next detection
      }
    }
  }

  private tryEmitTrick(type: TrickType, now: number): boolean {
    // Check cooldown
    const lastCooldown = this.cooldowns.get(type) || 0;
    if (now - lastCooldown < TRICK_COOLDOWN) return false;

    // Set cooldown
    this.cooldowns.set(type, now);

    // Update combo
    if (now - this.lastTrickTime < COMBO_WINDOW) {
      this.comboCount++;
      this.comboMultiplier = Math.min(3, 1 + this.comboCount * 0.5);
    } else {
      this.comboCount = 1;
      this.comboMultiplier = 1;
    }
    this.lastTrickTime = now;

    const trickInfo = TRICK_SCORES[type];
    const score = Math.floor(trickInfo.score * this.comboMultiplier);

    const event: TrickEvent = {
      type,
      tier: trickInfo.tier as TrickTier,
      score,
      combo: this.comboCount,
      multiplier: this.comboMultiplier,
      timestamp: now,
    };

    this.onTrick?.(event);
    return true;
  }

  /**
   * Reset trick detection state
   */
  reset(): void {
    this.frames = [];
    this.cumulativeRoll = 0;
    this.cumulativePitch = 0;
    this.cumulativeYaw = 0;
    this.comboCount = 0;
    this.lastTrickTime = 0;
    this.comboMultiplier = 1;
    this.cooldowns.clear();
    this.isInverted = false;
  }

  /**
   * Get current combo state
   */
  getComboState(): { count: number; multiplier: number } {
    return { count: this.comboCount, multiplier: this.comboMultiplier };
  }
}
