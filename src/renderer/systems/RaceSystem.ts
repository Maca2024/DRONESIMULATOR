/**
 * RaceSystem - Race checkpoint tracking, ghost recording/playback
 *
 * Features:
 * - Checkpoint-based race progression
 * - Lap timing with splits
 * - Ghost recording (every 3rd frame)
 * - Ghost playback with interpolation
 * - Best lap tracking
 */

import type { RaceConfig, RaceState, GhostFrame, Vector3 } from '@shared/types';
import { RACE } from '@shared/constants';

export class RaceSystem {
  private config: RaceConfig | null = null;
  private state: RaceState;
  private frameCounter = 0;
  private recordingFrames: GhostFrame[] = [];

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): RaceState {
    return {
      isActive: false,
      currentCheckpoint: 0,
      currentLap: 0,
      lapTime: 0,
      totalTime: 0,
      splitTimes: [],
      bestLapTime: Infinity,
      ghostData: [],
      isRecording: false,
    };
  }

  /**
   * Start a new race
   */
  startRace(config: RaceConfig): void {
    this.config = config;
    this.state = {
      ...this.createInitialState(),
      isActive: true,
      isRecording: true,
    };
    this.frameCounter = 0;
    this.recordingFrames = [];

    // Reset checkpoint passed state
    config.checkpoints.forEach(cp => cp.passed = false);
  }

  /**
   * Update race state each frame
   */
  update(
    dt: number,
    dronePosition: Vector3,
    droneRotation: { roll: number; pitch: number; yaw: number }
  ): {
    checkpointPassed: boolean;
    lapComplete: boolean;
    raceComplete: boolean;
  } {
    const result = { checkpointPassed: false, lapComplete: false, raceComplete: false };

    if (!this.state.isActive || !this.config) return result;

    this.state.lapTime += dt;
    this.state.totalTime += dt;

    // Record ghost data
    if (this.state.isRecording) {
      this.frameCounter++;
      if (this.frameCounter % RACE.GHOST_RECORD_INTERVAL === 0) {
        this.recordingFrames.push({
          timestamp: this.state.totalTime,
          position: { ...dronePosition },
          rotation: { ...droneRotation },
        });
      }
    }

    // Check checkpoint proximity
    const currentCP = this.config.checkpoints[this.state.currentCheckpoint];
    if (currentCP && !currentCP.passed) {
      const dx = dronePosition.x - currentCP.position.x;
      const dy = dronePosition.y - currentCP.position.y;
      const dz = dronePosition.z - currentCP.position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distance < (currentCP.radius || RACE.CHECKPOINT_RADIUS)) {
        currentCP.passed = true;
        this.state.splitTimes.push(this.state.lapTime);
        this.state.currentCheckpoint++;
        result.checkpointPassed = true;

        // Check lap completion
        if (this.state.currentCheckpoint >= this.config.checkpoints.length) {
          result.lapComplete = true;

          // Update best lap
          if (this.state.lapTime < this.state.bestLapTime) {
            this.state.bestLapTime = this.state.lapTime;
            this.state.ghostData = [...this.recordingFrames];
          }

          this.state.currentLap++;

          // Check race completion
          if (this.state.currentLap >= this.config.laps) {
            this.state.isActive = false;
            this.state.isRecording = false;
            result.raceComplete = true;
          } else {
            // Reset for next lap
            this.state.currentCheckpoint = 0;
            this.state.lapTime = 0;
            this.state.splitTimes = [];
            this.config.checkpoints.forEach(cp => cp.passed = false);
            this.recordingFrames = [];
          }
        }
      }
    }

    return result;
  }

  /**
   * Get ghost frame for playback at given time
   */
  getGhostFrame(time: number): GhostFrame | null {
    const ghostData = this.state.ghostData;
    if (ghostData.length === 0) return null;

    // Loop ghost based on best lap time
    const loopedTime = time % this.state.bestLapTime;

    // Find surrounding frames
    let low = 0;
    let high = ghostData.length - 1;

    while (low < high - 1) {
      const mid = Math.floor((low + high) / 2);
      if (ghostData[mid].timestamp <= loopedTime) {
        low = mid;
      } else {
        high = mid;
      }
    }

    if (high >= ghostData.length) return ghostData[ghostData.length - 1];

    // Linear interpolation between frames
    const a = ghostData[low];
    const b = ghostData[high];
    const range = b.timestamp - a.timestamp;
    const t = range > 0 ? (loopedTime - a.timestamp) / range : 0;

    return {
      timestamp: loopedTime,
      position: {
        x: a.position.x + (b.position.x - a.position.x) * t,
        y: a.position.y + (b.position.y - a.position.y) * t,
        z: a.position.z + (b.position.z - a.position.z) * t,
      },
      rotation: {
        roll: a.rotation.roll + (b.rotation.roll - a.rotation.roll) * t,
        pitch: a.rotation.pitch + (b.rotation.pitch - a.rotation.pitch) * t,
        yaw: a.rotation.yaw + (b.rotation.yaw - a.rotation.yaw) * t,
      },
    };
  }

  /**
   * Get current race state
   */
  getState(): RaceState {
    return { ...this.state };
  }

  /**
   * Get race config
   */
  getConfig(): RaceConfig | null {
    return this.config;
  }

  /**
   * Check if there's ghost data available
   */
  hasGhostData(): boolean {
    return this.state.ghostData.length > 0;
  }

  /**
   * Stop the race
   */
  stopRace(): void {
    this.state.isActive = false;
    this.state.isRecording = false;
  }

  /**
   * Get default neon race course
   */
  static getDefaultCourse(): RaceConfig {
    return {
      name: 'Neon Circuit',
      laps: 3,
      checkpoints: [
        { position: { x: 20, y: 5, z: 0 }, radius: 4, passed: false },
        { position: { x: 40, y: 8, z: 20 }, radius: 4, passed: false },
        { position: { x: 20, y: 6, z: 40 }, radius: 4, passed: false },
        { position: { x: -10, y: 10, z: 30 }, radius: 4, passed: false },
        { position: { x: -20, y: 5, z: 10 }, radius: 4, passed: false },
        { position: { x: -10, y: 3, z: -10 }, radius: 4, passed: false },
        { position: { x: 10, y: 5, z: -5 }, radius: 4, passed: false },
      ],
    };
  }
}
