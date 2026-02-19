import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlayerProgress, TutorialLevel, GhostFrame } from '@shared/types';

interface ProgressState {
  progress: PlayerProgress;
  ghostData: Record<string, GhostFrame[]>;
  bestTrickCombo: number;
  totalTricksPerformed: number;
  addXP: (amount: number) => void;
  completeTutorial: (level: TutorialLevel) => void;
  completeMission: (missionId: string) => void;
  addAchievement: (achievementId: string) => void;
  updateStatistics: (stats: Partial<PlayerProgress['statistics']>) => void;
  saveGhostData: (courseId: string, data: GhostFrame[]) => void;
  recordTrick: (combo: number) => void;
  resetProgress: () => void;
}

const initialProgress: PlayerProgress = {
  level: 1,
  xp: 0,
  tutorialProgress: {
    novice: false,
    beginner: false,
    intermediate: false,
    advanced: false,
    expert: false,
  },
  completedMissions: [],
  achievements: [],
  totalFlightTime: 0,
  statistics: {
    totalFlights: 0,
    totalCrashes: 0,
    totalDistance: 0,
    bestLapTimes: {},
    tricksPerformed: 0,
  },
};

const XP_PER_LEVEL = 1000;

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      progress: { ...initialProgress },
      ghostData: {},
      bestTrickCombo: 0,
      totalTricksPerformed: 0,

      addXP: (amount) =>
        set((state) => {
          const newXP = state.progress.xp + amount;
          const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;

          return {
            progress: {
              ...state.progress,
              xp: newXP,
              level: newLevel,
            },
          };
        }),

      completeTutorial: (level) =>
        set((state) => ({
          progress: {
            ...state.progress,
            tutorialProgress: {
              ...state.progress.tutorialProgress,
              [level]: true,
            },
          },
        })),

      completeMission: (missionId) =>
        set((state) => ({
          progress: {
            ...state.progress,
            completedMissions: state.progress.completedMissions.includes(missionId)
              ? state.progress.completedMissions
              : [...state.progress.completedMissions, missionId],
          },
        })),

      addAchievement: (achievementId) =>
        set((state) => ({
          progress: {
            ...state.progress,
            achievements: state.progress.achievements.includes(achievementId)
              ? state.progress.achievements
              : [...state.progress.achievements, achievementId],
          },
        })),

      updateStatistics: (stats) =>
        set((state) => ({
          progress: {
            ...state.progress,
            statistics: {
              ...state.progress.statistics,
              ...stats,
            },
          },
        })),

      saveGhostData: (courseId, data) =>
        set((state) => ({
          ghostData: { ...state.ghostData, [courseId]: data },
        })),

      recordTrick: (combo) =>
        set((state) => ({
          totalTricksPerformed: state.totalTricksPerformed + 1,
          bestTrickCombo: Math.max(state.bestTrickCombo, combo),
        })),

      resetProgress: () =>
        set({
          progress: { ...initialProgress },
          ghostData: {},
          bestTrickCombo: 0,
          totalTricksPerformed: 0,
        }),
    }),
    {
      name: 'aetherwing-progress',
      version: 1,
    }
  )
);
