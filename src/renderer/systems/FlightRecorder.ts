/**
 * FlightRecorder - Records and plays back flight sessions
 *
 * Features:
 * - Records position, rotation, motor RPMs, inputs at 60fps
 * - Saves recordings to localStorage (IndexedDB for larger storage)
 * - Playback with play/pause/speed controls
 * - Ghost drone visualization support
 */

import type { Vector3, Quaternion, NormalizedInput } from '@shared/types';

export interface FlightFrame {
  timestamp: number; // ms from start
  position: Vector3;
  rotation: Quaternion;
  motorRPM: [number, number, number, number];
  velocity: Vector3;
  input: {
    throttle: number;
    roll: number;
    pitch: number;
    yaw: number;
  };
}

export interface FlightRecording {
  id: string;
  name: string;
  createdAt: number;
  duration: number; // ms
  frameCount: number;
  frames: FlightFrame[];
  metadata: {
    dronePreset: string;
    weather: string;
    maxAltitude: number;
    maxSpeed: number;
  };
}

export interface RecordingInfo {
  id: string;
  name: string;
  createdAt: number;
  duration: number;
  frameCount: number;
}

const STORAGE_KEY = 'aetherwing_recordings';
const MAX_RECORDINGS = 10;
const FRAME_INTERVAL = 1000 / 60; // 60fps

export class FlightRecorder {
  private isRecording: boolean = false;
  private frames: FlightFrame[] = [];
  private startTime: number = 0;
  private lastFrameTime: number = 0;
  private currentRecording: FlightRecording | null = null;

  // Playback state
  private isPlaying: boolean = false;
  private playbackSpeed: number = 1;
  private playbackTime: number = 0;
  private playbackStartTime: number = 0;

  /**
   * Start recording a new flight
   */
  startRecording(): void {
    this.isRecording = true;
    this.frames = [];
    this.startTime = performance.now();
    this.lastFrameTime = 0;
  }

  /**
   * Stop recording and return the recording
   */
  stopRecording(name: string, dronePreset: string = 'BEGINNER'): FlightRecording | null {
    if (!this.isRecording || this.frames.length === 0) {
      this.isRecording = false;
      return null;
    }

    this.isRecording = false;

    // Calculate metadata
    let maxAltitude = 0;
    let maxSpeed = 0;

    for (const frame of this.frames) {
      maxAltitude = Math.max(maxAltitude, frame.position.y);
      const speed = Math.sqrt(
        frame.velocity.x ** 2 + frame.velocity.y ** 2 + frame.velocity.z ** 2
      );
      maxSpeed = Math.max(maxSpeed, speed);
    }

    const recording: FlightRecording = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      createdAt: Date.now(),
      duration: this.frames[this.frames.length - 1].timestamp,
      frameCount: this.frames.length,
      frames: this.frames,
      metadata: {
        dronePreset,
        weather: 'clear',
        maxAltitude: Math.round(maxAltitude * 10) / 10,
        maxSpeed: Math.round(maxSpeed * 10) / 10,
      },
    };

    this.currentRecording = recording;
    return recording;
  }

  /**
   * Record a frame (call this every frame during recording)
   */
  recordFrame(
    position: Vector3,
    rotation: Quaternion,
    motorRPM: [number, number, number, number],
    velocity: Vector3,
    input: NormalizedInput
  ): void {
    if (!this.isRecording) return;

    const now = performance.now();
    const timestamp = now - this.startTime;

    // Only record at target frame rate
    if (timestamp - this.lastFrameTime < FRAME_INTERVAL) {
      return;
    }

    this.lastFrameTime = timestamp;

    this.frames.push({
      timestamp,
      position: { ...position },
      rotation: { ...rotation },
      motorRPM: [...motorRPM],
      velocity: { ...velocity },
      input: {
        throttle: input.throttle,
        roll: input.roll,
        pitch: input.pitch,
        yaw: input.yaw,
      },
    });
  }

  /**
   * Get recording status
   */
  getIsRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Get current recording duration in ms
   */
  getRecordingDuration(): number {
    if (!this.isRecording) return 0;
    return performance.now() - this.startTime;
  }

  /**
   * Get frame count
   */
  getFrameCount(): number {
    return this.frames.length;
  }

  // ========================================
  // Playback Methods
  // ========================================

  /**
   * Load a recording for playback
   */
  loadRecording(recording: FlightRecording): void {
    this.currentRecording = recording;
    this.playbackTime = 0;
    this.isPlaying = false;
  }

  /**
   * Start playback
   */
  startPlayback(): void {
    if (!this.currentRecording) return;
    this.isPlaying = true;
    this.playbackStartTime = performance.now() - this.playbackTime / this.playbackSpeed;
  }

  /**
   * Pause playback
   */
  pausePlayback(): void {
    this.isPlaying = false;
  }

  /**
   * Stop playback and reset
   */
  stopPlayback(): void {
    this.isPlaying = false;
    this.playbackTime = 0;
    this.currentRecording = null;
  }

  /**
   * Set playback speed (0.25, 0.5, 1, 2, 4)
   */
  setPlaybackSpeed(speed: number): void {
    this.playbackSpeed = Math.max(0.25, Math.min(4, speed));
    if (this.isPlaying) {
      this.playbackStartTime = performance.now() - this.playbackTime / this.playbackSpeed;
    }
  }

  /**
   * Seek to specific time
   */
  seekTo(timeMs: number): void {
    if (!this.currentRecording) return;
    this.playbackTime = Math.max(0, Math.min(timeMs, this.currentRecording.duration));
    if (this.isPlaying) {
      this.playbackStartTime = performance.now() - this.playbackTime / this.playbackSpeed;
    }
  }

  /**
   * Get current playback frame (call this every frame during playback)
   */
  getPlaybackFrame(): FlightFrame | null {
    if (!this.currentRecording || this.currentRecording.frames.length === 0) {
      return null;
    }

    if (this.isPlaying) {
      this.playbackTime = (performance.now() - this.playbackStartTime) * this.playbackSpeed;

      // Loop or stop at end
      if (this.playbackTime >= this.currentRecording.duration) {
        this.playbackTime = 0;
        this.playbackStartTime = performance.now();
      }
    }

    // Find the frame at current playback time (binary search for efficiency)
    const frames = this.currentRecording.frames;
    let low = 0;
    let high = frames.length - 1;

    while (low < high) {
      const mid = Math.floor((low + high + 1) / 2);
      if (frames[mid].timestamp <= this.playbackTime) {
        low = mid;
      } else {
        high = mid - 1;
      }
    }

    return frames[low];
  }

  /**
   * Get interpolated playback frame for smoother visualization
   */
  getInterpolatedFrame(): FlightFrame | null {
    if (!this.currentRecording || this.currentRecording.frames.length < 2) {
      return this.getPlaybackFrame();
    }

    if (this.isPlaying) {
      this.playbackTime = (performance.now() - this.playbackStartTime) * this.playbackSpeed;

      if (this.playbackTime >= this.currentRecording.duration) {
        this.playbackTime = 0;
        this.playbackStartTime = performance.now();
      }
    }

    const frames = this.currentRecording.frames;

    // Find surrounding frames
    let frameIndex = 0;
    for (let i = 0; i < frames.length - 1; i++) {
      if (frames[i + 1].timestamp > this.playbackTime) {
        frameIndex = i;
        break;
      }
      frameIndex = i;
    }

    const frame1 = frames[frameIndex];
    const frame2 = frames[Math.min(frameIndex + 1, frames.length - 1)];

    // Calculate interpolation factor
    const timeDiff = frame2.timestamp - frame1.timestamp;
    const t = timeDiff > 0 ? (this.playbackTime - frame1.timestamp) / timeDiff : 0;

    // Interpolate position and velocity
    return {
      timestamp: this.playbackTime,
      position: {
        x: frame1.position.x + (frame2.position.x - frame1.position.x) * t,
        y: frame1.position.y + (frame2.position.y - frame1.position.y) * t,
        z: frame1.position.z + (frame2.position.z - frame1.position.z) * t,
      },
      rotation: this.slerpQuaternion(frame1.rotation, frame2.rotation, t),
      motorRPM: [
        frame1.motorRPM[0] + (frame2.motorRPM[0] - frame1.motorRPM[0]) * t,
        frame1.motorRPM[1] + (frame2.motorRPM[1] - frame1.motorRPM[1]) * t,
        frame1.motorRPM[2] + (frame2.motorRPM[2] - frame1.motorRPM[2]) * t,
        frame1.motorRPM[3] + (frame2.motorRPM[3] - frame1.motorRPM[3]) * t,
      ],
      velocity: {
        x: frame1.velocity.x + (frame2.velocity.x - frame1.velocity.x) * t,
        y: frame1.velocity.y + (frame2.velocity.y - frame1.velocity.y) * t,
        z: frame1.velocity.z + (frame2.velocity.z - frame1.velocity.z) * t,
      },
      input: frame1.input,
    };
  }

  /**
   * Spherical linear interpolation for quaternions
   */
  private slerpQuaternion(q1: Quaternion, q2: Quaternion, t: number): Quaternion {
    // Dot product
    let dot = q1.x * q2.x + q1.y * q2.y + q1.z * q2.z + q1.w * q2.w;

    // If negative dot, negate one quaternion to take shorter arc
    const q2Copy = { ...q2 };
    if (dot < 0) {
      q2Copy.x = -q2Copy.x;
      q2Copy.y = -q2Copy.y;
      q2Copy.z = -q2Copy.z;
      q2Copy.w = -q2Copy.w;
      dot = -dot;
    }

    // Linear interpolation for close quaternions
    if (dot > 0.9995) {
      return {
        x: q1.x + (q2Copy.x - q1.x) * t,
        y: q1.y + (q2Copy.y - q1.y) * t,
        z: q1.z + (q2Copy.z - q1.z) * t,
        w: q1.w + (q2Copy.w - q1.w) * t,
      };
    }

    const theta0 = Math.acos(dot);
    const theta = theta0 * t;
    const sinTheta = Math.sin(theta);
    const sinTheta0 = Math.sin(theta0);

    const s0 = Math.cos(theta) - (dot * sinTheta) / sinTheta0;
    const s1 = sinTheta / sinTheta0;

    return {
      x: s0 * q1.x + s1 * q2Copy.x,
      y: s0 * q1.y + s1 * q2Copy.y,
      z: s0 * q1.z + s1 * q2Copy.z,
      w: s0 * q1.w + s1 * q2Copy.w,
    };
  }

  /**
   * Get playback state
   */
  getPlaybackState(): {
    isPlaying: boolean;
    speed: number;
    currentTime: number;
    duration: number;
    progress: number;
  } {
    return {
      isPlaying: this.isPlaying,
      speed: this.playbackSpeed,
      currentTime: this.playbackTime,
      duration: this.currentRecording?.duration ?? 0,
      progress: this.currentRecording
        ? this.playbackTime / this.currentRecording.duration
        : 0,
    };
  }

  // ========================================
  // Storage Methods
  // ========================================

  /**
   * Save recording to localStorage
   */
  saveRecording(recording: FlightRecording): boolean {
    try {
      const recordings = this.loadAllRecordings();

      // Check if we need to remove old recordings
      while (recordings.length >= MAX_RECORDINGS) {
        recordings.shift(); // Remove oldest
      }

      recordings.push(recording);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recordings));
      return true;
    } catch {
      console.error('Failed to save recording');
      return false;
    }
  }

  /**
   * Load all recordings from storage
   */
  loadAllRecordings(): FlightRecording[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data) as FlightRecording[];
    } catch {
      return [];
    }
  }

  /**
   * Get recording list (without frame data for performance)
   */
  getRecordingList(): RecordingInfo[] {
    const recordings = this.loadAllRecordings();
    return recordings.map((r) => ({
      id: r.id,
      name: r.name,
      createdAt: r.createdAt,
      duration: r.duration,
      frameCount: r.frameCount,
    }));
  }

  /**
   * Load a specific recording by ID
   */
  loadRecordingById(id: string): FlightRecording | null {
    const recordings = this.loadAllRecordings();
    return recordings.find((r) => r.id === id) ?? null;
  }

  /**
   * Delete a recording
   */
  deleteRecording(id: string): boolean {
    try {
      const recordings = this.loadAllRecordings();
      const filtered = recordings.filter((r) => r.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear all recordings
   */
  clearAllRecordings(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}
