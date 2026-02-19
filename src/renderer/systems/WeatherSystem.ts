/**
 * WeatherSystem - Dynamic weather and wind simulation
 *
 * Manages:
 * - Wind direction, base speed, and gusts
 * - Weather presets (clear, windy, stormy, foggy, rain)
 * - Continuous time-of-day (0-24)
 * - Fog density and rain intensity
 */

import type { WeatherState, WeatherPreset, Vector3 } from '@shared/types';
import { WEATHER_PRESETS } from '@shared/constants';

export class WeatherSystem {
  private state: WeatherState;
  private elapsed: number = 0;
  private transitionProgress: number = 1; // 1 = fully transitioned
  private targetState: WeatherState | null = null;
  private transitionDuration: number = 5; // seconds

  constructor() {
    this.state = {
      preset: 'clear',
      wind: {
        direction: { x: 1, y: 0, z: 0.3 },
        baseSpeed: 1,
        gustSpeed: 0,
        gustFrequency: 0.3,
      },
      fogDensity: 0,
      rainIntensity: 0,
      timeOfDay: 12, // noon
    };
    this.normalizeWindDirection();
  }

  private normalizeWindDirection(): void {
    const d = this.state.wind.direction;
    const len = Math.sqrt(d.x * d.x + d.y * d.y + d.z * d.z);
    if (len > 0) {
      d.x /= len;
      d.y /= len;
      d.z /= len;
    }
  }

  /**
   * Set weather preset with smooth transition
   */
  setPreset(preset: WeatherPreset): void {
    const config = this.getPresetConfig(preset);
    this.targetState = {
      preset,
      wind: {
        direction: { ...this.state.wind.direction },
        baseSpeed: (config.windMin + config.windMax) / 2,
        gustSpeed: 0,
        gustFrequency: preset === 'stormy' ? 0.8 : 0.3,
      },
      fogDensity: config.fogDensity,
      rainIntensity: config.rainIntensity,
      timeOfDay: this.state.timeOfDay,
    };
    this.transitionProgress = 0;
  }

  private getPresetConfig(preset: WeatherPreset) {
    switch (preset) {
      case 'clear': return WEATHER_PRESETS.CALM;
      case 'windy': return WEATHER_PRESETS.WINDY;
      case 'stormy': return WEATHER_PRESETS.STORMY;
      case 'foggy': return WEATHER_PRESETS.FOGGY;
      case 'rain': return WEATHER_PRESETS.RAINY;
      default: return WEATHER_PRESETS.CALM;
    }
  }

  /**
   * Set time of day (0-24, continuous)
   */
  setTimeOfDay(time: number): void {
    this.state.timeOfDay = ((time % 24) + 24) % 24;
  }

  /**
   * Set wind direction
   */
  setWindDirection(direction: Vector3): void {
    this.state.wind.direction = { ...direction };
    this.normalizeWindDirection();
  }

  /**
   * Update weather system each frame
   */
  update(dt: number): void {
    this.elapsed += dt;

    // Smooth transition to target state
    if (this.targetState && this.transitionProgress < 1) {
      this.transitionProgress = Math.min(1, this.transitionProgress + dt / this.transitionDuration);
      const t = this.transitionProgress;

      this.state.wind.baseSpeed = this.lerp(this.state.wind.baseSpeed, this.targetState.wind.baseSpeed, t * 0.05);
      this.state.fogDensity = this.lerp(this.state.fogDensity, this.targetState.fogDensity, t * 0.05);
      this.state.rainIntensity = this.lerp(this.state.rainIntensity, this.targetState.rainIntensity, t * 0.05);

      if (this.transitionProgress >= 1) {
        this.state.preset = this.targetState.preset;
        this.targetState = null;
      }
    }

    // Update wind gusts using sinusoidal modulation for organic feel
    const gustFreq = this.state.wind.gustFrequency;
    this.state.wind.gustSpeed =
      Math.sin(this.elapsed * gustFreq * Math.PI * 2) *
      Math.sin(this.elapsed * gustFreq * 0.7 * Math.PI * 2) *
      this.state.wind.baseSpeed * 0.5;

    // Slowly rotate wind direction for variation
    const windRotation = Math.sin(this.elapsed * 0.05) * 0.01;
    const cos = Math.cos(windRotation);
    const sin = Math.sin(windRotation);
    const dx = this.state.wind.direction.x;
    const dz = this.state.wind.direction.z;
    this.state.wind.direction.x = dx * cos - dz * sin;
    this.state.wind.direction.z = dx * sin + dz * cos;

    // Advance time of day slowly (1 game minute = 1 real second by default)
    // This can be overridden by setTimeOfDay
  }

  /**
   * Get wind force vector for physics integration
   * Accounts for base wind + gusts + direction
   */
  getWindForce(): Vector3 {
    const totalSpeed = this.state.wind.baseSpeed + this.state.wind.gustSpeed;
    const d = this.state.wind.direction;
    return {
      x: d.x * totalSpeed,
      y: d.y * totalSpeed * 0.1, // Minimal vertical wind
      z: d.z * totalSpeed,
    };
  }

  /**
   * Get current weather state (read-only snapshot)
   */
  getState(): WeatherState {
    return {
      ...this.state,
      wind: { ...this.state.wind, direction: { ...this.state.wind.direction } },
    };
  }

  /**
   * Get current wind speed (magnitude)
   */
  getWindSpeed(): number {
    return this.state.wind.baseSpeed + Math.abs(this.state.wind.gustSpeed);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }
}
