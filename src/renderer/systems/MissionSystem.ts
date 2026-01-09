/**
 * MissionSystem - Game missions and objectives
 *
 * Mission Types:
 * - Time Trial: Race through checkpoints
 * - Precision: Land/hover at specific points
 * - CTF: Capture objectives
 * - Search: Find hidden items
 * - Survival: Avoid obstacles
 * - Delivery: Transport items
 */

import type {
  Mission,
  MissionType,
  MissionObjective,
  MissionResult,
  Vector3,
  DroneState,
} from '@shared/types';
import { SCORING } from '@shared/constants';

export interface MissionState {
  mission: Mission;
  startTime: number;
  currentTime: number;
  objectivesCompleted: number;
  score: number;
  crashes: number;
  isComplete: boolean;
  isPassed: boolean;
}

export class MissionSystem {
  private currentMission: MissionState | null = null;
  private missions: Map<string, Mission> = new Map();

  constructor() {
    this.initializeMissions();
  }

  private initializeMissions(): void {
    // Time Trial Missions
    this.addMission({
      id: 'tt_basics',
      type: 'timeTrial',
      name: 'First Flight',
      description: 'Navigate through 3 gates as fast as possible',
      parTime: 30,
      objectives: [
        this.createCheckpoint('cp1', { x: 10, y: 3, z: 0 }),
        this.createCheckpoint('cp2', { x: 20, y: 4, z: 5 }),
        this.createCheckpoint('cp3', { x: 30, y: 3, z: -5 }),
      ],
      rewards: { xp: 100, unlocks: [] },
    });

    this.addMission({
      id: 'tt_circuit',
      type: 'timeTrial',
      name: 'Circuit Training',
      description: 'Complete a full circuit of 6 gates',
      parTime: 60,
      objectives: [
        this.createCheckpoint('cp1', { x: 15, y: 3, z: 0 }),
        this.createCheckpoint('cp2', { x: 25, y: 5, z: 10 }),
        this.createCheckpoint('cp3', { x: 15, y: 4, z: 20 }),
        this.createCheckpoint('cp4', { x: -15, y: 4, z: 20 }),
        this.createCheckpoint('cp5', { x: -25, y: 5, z: 10 }),
        this.createCheckpoint('cp6', { x: -15, y: 3, z: 0 }),
      ],
      rewards: { xp: 250, unlocks: ['freestyle_unlock'] },
    });

    // Precision Missions
    this.addMission({
      id: 'pr_landing',
      type: 'precision',
      name: 'Precision Landing',
      description: 'Land on 3 different pads with precision',
      parTime: 90,
      objectives: [
        this.createLandingZone('lz1', { x: 20, y: 0, z: 0 }),
        this.createLandingZone('lz2', { x: 0, y: 0, z: 20 }),
        this.createLandingZone('lz3', { x: -20, y: 0, z: -20 }),
      ],
      rewards: { xp: 200, unlocks: [] },
    });

    this.addMission({
      id: 'pr_hover',
      type: 'precision',
      name: 'Hover Master',
      description: 'Hold position at each point for 5 seconds',
      parTime: 60,
      objectives: [
        this.createHoverZone('hz1', { x: 0, y: 5, z: 10 }),
        this.createHoverZone('hz2', { x: 10, y: 8, z: 0 }),
        this.createHoverZone('hz3', { x: 0, y: 10, z: -10 }),
      ],
      rewards: { xp: 150, unlocks: [] },
    });

    // Search Missions
    this.addMission({
      id: 'sr_explore',
      type: 'search',
      name: 'Area Survey',
      description: 'Find and photograph 5 hidden markers',
      parTime: 180,
      objectives: [
        this.createCollectible('m1', { x: 30, y: 2, z: 30 }),
        this.createCollectible('m2', { x: -40, y: 5, z: 20 }),
        this.createCollectible('m3', { x: 15, y: 8, z: -35 }),
        this.createCollectible('m4', { x: -25, y: 3, z: -25 }),
        this.createCollectible('m5', { x: 50, y: 6, z: 0 }),
      ],
      rewards: { xp: 300, unlocks: ['night_mode'] },
    });

    // Delivery Mission
    this.addMission({
      id: 'dl_basic',
      type: 'delivery',
      name: 'Special Delivery',
      description: 'Collect and deliver items to destinations',
      parTime: 120,
      objectives: [
        this.createCollectible('pkg1', { x: 25, y: 2, z: 0 }),
        this.createLandingZone('dlv1', { x: -25, y: 0, z: 0 }),
        this.createCollectible('pkg2', { x: 0, y: 2, z: 25 }),
        this.createLandingZone('dlv2', { x: 0, y: 0, z: -25 }),
      ],
      rewards: { xp: 200, unlocks: [] },
    });

    // Survival Mission
    this.addMission({
      id: 'sv_endurance',
      type: 'survival',
      name: 'Endurance Test',
      description: 'Stay airborne while navigating obstacles',
      parTime: 120,
      objectives: [
        this.createCheckpoint('sv1', { x: 20, y: 5, z: 0 }),
        this.createCheckpoint('sv2', { x: 0, y: 10, z: 20 }),
        this.createCheckpoint('sv3', { x: -20, y: 5, z: 0 }),
        this.createCheckpoint('sv4', { x: 0, y: 15, z: -20 }),
      ],
      rewards: { xp: 250, unlocks: [] },
    });
  }

  private createCheckpoint(id: string, position: Vector3): MissionObjective {
    return {
      id,
      type: 'checkpoint',
      position,
      radius: 3,
      completed: false,
      required: true,
    };
  }

  private createLandingZone(id: string, position: Vector3): MissionObjective {
    return {
      id,
      type: 'land',
      position,
      radius: 2,
      completed: false,
      required: true,
    };
  }

  private createHoverZone(id: string, position: Vector3): MissionObjective {
    return {
      id,
      type: 'hover',
      position,
      radius: 1.5,
      completed: false,
      required: true,
    };
  }

  private createCollectible(id: string, position: Vector3): MissionObjective {
    return {
      id,
      type: 'collect',
      position,
      radius: 2,
      completed: false,
      required: true,
    };
  }

  private addMission(mission: Mission): void {
    this.missions.set(mission.id, mission);
  }

  /**
   * Get all available missions
   */
  getAllMissions(): Mission[] {
    return Array.from(this.missions.values());
  }

  /**
   * Get missions by type
   */
  getMissionsByType(type: MissionType): Mission[] {
    return this.getAllMissions().filter((m) => m.type === type);
  }

  /**
   * Get mission by ID
   */
  getMission(id: string): Mission | undefined {
    return this.missions.get(id);
  }

  /**
   * Start a mission
   */
  startMission(missionId: string): boolean {
    const mission = this.missions.get(missionId);
    if (!mission) return false;

    // Reset objectives
    const objectives = mission.objectives.map((obj) => ({
      ...obj,
      completed: false,
    }));

    this.currentMission = {
      mission: { ...mission, objectives },
      startTime: performance.now(),
      currentTime: 0,
      objectivesCompleted: 0,
      score: 0,
      crashes: 0,
      isComplete: false,
      isPassed: false,
    };

    return true;
  }

  /**
   * Update mission state
   */
  update(drone: DroneState, deltaTime: number): void {
    if (!this.currentMission || this.currentMission.isComplete) return;

    this.currentMission.currentTime += deltaTime;

    // Check objectives
    for (const objective of this.currentMission.mission.objectives) {
      if (objective.completed) continue;

      if (this.checkObjective(objective, drone)) {
        objective.completed = true;
        this.currentMission.objectivesCompleted++;
        this.currentMission.score += SCORING.OBJECTIVE_POINTS;
      }
    }

    // Check mission completion
    const allRequired = this.currentMission.mission.objectives
      .filter((o) => o.required)
      .every((o) => o.completed);

    if (allRequired) {
      this.completeMission();
    }
  }

  private checkObjective(objective: MissionObjective, drone: DroneState): boolean {
    const distance = this.calculateDistance(drone.position, objective.position);

    switch (objective.type) {
      case 'checkpoint':
      case 'collect':
        return distance < objective.radius;

      case 'land':
        return (
          distance < objective.radius &&
          drone.position.y < 0.3 &&
          Math.abs(drone.velocity.y) < 0.5
        );

      case 'hover':
        return distance < objective.radius && Math.abs(drone.velocity.y) < 0.3;

      case 'photograph':
        // Would need camera system
        return distance < objective.radius * 2;

      default:
        return false;
    }
  }

  private calculateDistance(a: Vector3, b: Vector3): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Complete current mission
   */
  private completeMission(): void {
    if (!this.currentMission) return;

    const timeBonus = Math.max(
      0,
      (this.currentMission.mission.parTime - this.currentMission.currentTime) *
        SCORING.TIME_BONUS_MULTIPLIER
    );

    this.currentMission.score += Math.min(timeBonus, SCORING.TIME_BONUS_MAX);
    this.currentMission.score += this.currentMission.crashes * SCORING.CRASH_PENALTY_COLLISION;

    this.currentMission.isComplete = true;
    this.currentMission.isPassed =
      this.currentMission.currentTime <= this.currentMission.mission.parTime;
  }

  /**
   * Record a crash
   */
  recordCrash(): void {
    if (this.currentMission) {
      this.currentMission.crashes++;
      this.currentMission.score += SCORING.CRASH_PENALTY_COLLISION;
    }
  }

  /**
   * Abort current mission
   */
  abortMission(): void {
    this.currentMission = null;
  }

  /**
   * Get current mission state
   */
  getCurrentMissionState(): MissionState | null {
    return this.currentMission;
  }

  /**
   * Get mission result
   */
  getMissionResult(): MissionResult | null {
    if (!this.currentMission || !this.currentMission.isComplete) return null;

    return {
      missionId: this.currentMission.mission.id,
      completed: this.currentMission.isPassed,
      time: this.currentMission.currentTime,
      score: Math.max(0, this.currentMission.score),
      objectives: this.currentMission.mission.objectives.map((o) => ({
        id: o.id,
        completed: o.completed,
      })),
      crashes: this.currentMission.crashes,
    };
  }

  /**
   * Get next objective
   */
  getNextObjective(): MissionObjective | null {
    if (!this.currentMission) return null;

    return (
      this.currentMission.mission.objectives.find((o) => !o.completed && o.required) || null
    );
  }

  /**
   * Get progress percentage
   */
  getProgress(): number {
    if (!this.currentMission) return 0;

    const required = this.currentMission.mission.objectives.filter((o) => o.required);
    const completed = required.filter((o) => o.completed);

    return (completed.length / required.length) * 100;
  }
}
