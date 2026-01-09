import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameSettings, AccessibilitySettings, GraphicsSettings, AudioSettings, ControlSettings } from '@shared/types';
import { DEFAULT_KEY_BINDINGS } from '@shared/constants';

interface SettingsState {
  settings: GameSettings;
  loadSettings: () => void;
  saveSettings: () => void;
  updateGraphics: (settings: Partial<GraphicsSettings>) => void;
  updateAudio: (settings: Partial<AudioSettings>) => void;
  updateControls: (settings: Partial<ControlSettings>) => void;
  updateAccessibility: (settings: Partial<AccessibilitySettings>) => void;
  resetToDefaults: () => void;
}

const defaultSettings: GameSettings = {
  graphics: {
    resolution: [1920, 1080],
    quality: 'high',
    vsync: true,
    fpsLimit: 60,
    shadows: true,
    postProcessing: true,
    motionBlur: false,
  },
  audio: {
    masterVolume: 0.8,
    effectsVolume: 0.8,
    musicVolume: 0.5,
    spatialAudio: true,
  },
  controls: {
    inputMethod: 'keyboard',
    keyBindings: { ...DEFAULT_KEY_BINDINGS },
    inputConfig: {
      sensitivity: 1.0,
      deadzone: 0.02,
      expo: 0.3,
      inverted: {
        pitch: false,
        roll: false,
        yaw: false,
        throttle: false,
      },
    },
    controllerProfile: null,
  },
  accessibility: {
    // Motor accessibility
    oneHandedMode: false,
    extendedDeadzone: false,
    inputSmoothing: 0,
    holdToConfirm: false,
    autoStabilization: 0,

    // Visual accessibility
    colorblindMode: 'none',
    highContrast: false,
    uiScale: 1.0,
    largeText: false,
    reduceMotion: false,
    disableScreenShake: false,
    brightnessLimit: 1.0,

    // Audio accessibility
    visualAudioCues: false,
    subtitles: false,
    monoAudio: false,

    // Cognitive accessibility
    simplifiedHUD: false,
    extendedTimeLimits: false,
    visualGuides: true,
  },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: { ...defaultSettings },

      loadSettings: () => {
        // Settings are automatically loaded by persist middleware
        // This is a placeholder for any additional initialization
      },

      saveSettings: () => {
        // Settings are automatically saved by persist middleware
        // This is a placeholder for any additional save logic
      },

      updateGraphics: (newSettings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            graphics: { ...state.settings.graphics, ...newSettings },
          },
        })),

      updateAudio: (newSettings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            audio: { ...state.settings.audio, ...newSettings },
          },
        })),

      updateControls: (newSettings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            controls: { ...state.settings.controls, ...newSettings },
          },
        })),

      updateAccessibility: (newSettings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            accessibility: { ...state.settings.accessibility, ...newSettings },
          },
        })),

      resetToDefaults: () =>
        set({
          settings: { ...defaultSettings },
        }),
    }),
    {
      name: 'aetherwing-settings',
      version: 1,
    }
  )
);
