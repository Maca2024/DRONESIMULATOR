import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlayerProgress, TutorialLevel } from '@shared/types';

interface ProgressState {
  progress: PlayerProgress;
  addXP: (amount: number) => void;
  completeTutorial: (level: TutorialLevel) => void;
  completeMission: (missionId: string) => void;
  addAchievement: (achievementId: string) => void;
  updateStatistics: (stats: Partial<PlayerProgress['statistics']>) => void;
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

      resetProgress: () =>
        set({
          progress: { ...initialProgress },
        }),
    }),
    {
      name: 'aetherwing-progress',
      version: 1,
    }
  )
);
