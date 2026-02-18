import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from './settingsStore';

describe('SettingsStore', () => {
  beforeEach(() => {
    // Reset to defaults
    useSettingsStore.getState().resetToDefaults();
  });

  describe('default settings', () => {
    it('should have default graphics settings', () => {
      const { settings } = useSettingsStore.getState();
      expect(settings.graphics.quality).toBe('high');
      expect(settings.graphics.vsync).toBe(true);
      expect(settings.graphics.fpsLimit).toBe(60);
      expect(settings.graphics.shadows).toBe(true);
      expect(settings.graphics.resolution).toEqual([1920, 1080]);
    });

    it('should have default audio settings', () => {
      const { settings } = useSettingsStore.getState();
      expect(settings.audio.masterVolume).toBe(0.8);
      expect(settings.audio.effectsVolume).toBe(0.8);
      expect(settings.audio.musicVolume).toBe(0.5);
      expect(settings.audio.spatialAudio).toBe(true);
    });

    it('should have default control settings', () => {
      const { settings } = useSettingsStore.getState();
      expect(settings.controls.inputMethod).toBe('keyboard');
      expect(settings.controls.inputConfig.sensitivity).toBe(1.0);
      expect(settings.controls.inputConfig.deadzone).toBe(0.02);
      expect(settings.controls.inputConfig.expo).toBe(0.3);
    });

    it('should have default accessibility settings', () => {
      const { settings } = useSettingsStore.getState();
      expect(settings.accessibility.oneHandedMode).toBe(false);
      expect(settings.accessibility.colorblindMode).toBe('none');
      expect(settings.accessibility.highContrast).toBe(false);
      expect(settings.accessibility.uiScale).toBe(1.0);
      expect(settings.accessibility.visualGuides).toBe(true);
    });
  });

  describe('updateGraphics', () => {
    it('should update quality', () => {
      useSettingsStore.getState().updateGraphics({ quality: 'low' });
      expect(useSettingsStore.getState().settings.graphics.quality).toBe('low');
    });

    it('should update vsync', () => {
      useSettingsStore.getState().updateGraphics({ vsync: false });
      expect(useSettingsStore.getState().settings.graphics.vsync).toBe(false);
    });

    it('should update fps limit', () => {
      useSettingsStore.getState().updateGraphics({ fpsLimit: 144 });
      expect(useSettingsStore.getState().settings.graphics.fpsLimit).toBe(144);
    });

    it('should not affect other graphics settings', () => {
      useSettingsStore.getState().updateGraphics({ quality: 'low' });
      expect(useSettingsStore.getState().settings.graphics.shadows).toBe(true);
    });

    it('should not affect other setting categories', () => {
      useSettingsStore.getState().updateGraphics({ quality: 'low' });
      expect(useSettingsStore.getState().settings.audio.masterVolume).toBe(0.8);
    });
  });

  describe('updateAudio', () => {
    it('should update master volume', () => {
      useSettingsStore.getState().updateAudio({ masterVolume: 0.5 });
      expect(useSettingsStore.getState().settings.audio.masterVolume).toBe(0.5);
    });

    it('should update effects volume', () => {
      useSettingsStore.getState().updateAudio({ effectsVolume: 0.3 });
      expect(useSettingsStore.getState().settings.audio.effectsVolume).toBe(0.3);
    });

    it('should update spatial audio', () => {
      useSettingsStore.getState().updateAudio({ spatialAudio: false });
      expect(useSettingsStore.getState().settings.audio.spatialAudio).toBe(false);
    });
  });

  describe('updateControls', () => {
    it('should update input method', () => {
      useSettingsStore.getState().updateControls({ inputMethod: 'gamepad' });
      expect(useSettingsStore.getState().settings.controls.inputMethod).toBe('gamepad');
    });

    it('should update input config', () => {
      useSettingsStore.getState().updateControls({
        inputConfig: {
          sensitivity: 2.0,
          deadzone: 0.05,
          expo: 0.5,
          inverted: { pitch: true, roll: false, yaw: false, throttle: false },
        },
      });
      expect(useSettingsStore.getState().settings.controls.inputConfig.sensitivity).toBe(2.0);
    });
  });

  describe('updateAccessibility', () => {
    it('should update one-handed mode', () => {
      useSettingsStore.getState().updateAccessibility({ oneHandedMode: true });
      expect(useSettingsStore.getState().settings.accessibility.oneHandedMode).toBe(true);
    });

    it('should update colorblind mode', () => {
      useSettingsStore.getState().updateAccessibility({ colorblindMode: 'deuteranopia' });
      expect(useSettingsStore.getState().settings.accessibility.colorblindMode).toBe('deuteranopia');
    });

    it('should update UI scale', () => {
      useSettingsStore.getState().updateAccessibility({ uiScale: 2.0 });
      expect(useSettingsStore.getState().settings.accessibility.uiScale).toBe(2.0);
    });

    it('should update large text', () => {
      useSettingsStore.getState().updateAccessibility({ largeText: true });
      expect(useSettingsStore.getState().settings.accessibility.largeText).toBe(true);
    });

    it('should update reduce motion', () => {
      useSettingsStore.getState().updateAccessibility({ reduceMotion: true });
      expect(useSettingsStore.getState().settings.accessibility.reduceMotion).toBe(true);
    });

    it('should update mono audio', () => {
      useSettingsStore.getState().updateAccessibility({ monoAudio: true });
      expect(useSettingsStore.getState().settings.accessibility.monoAudio).toBe(true);
    });
  });

  describe('resetToDefaults', () => {
    it('should reset all settings to defaults', () => {
      useSettingsStore.getState().updateGraphics({ quality: 'low' });
      useSettingsStore.getState().updateAudio({ masterVolume: 0.1 });
      useSettingsStore.getState().updateAccessibility({ highContrast: true });

      useSettingsStore.getState().resetToDefaults();

      const { settings } = useSettingsStore.getState();
      expect(settings.graphics.quality).toBe('high');
      expect(settings.audio.masterVolume).toBe(0.8);
      expect(settings.accessibility.highContrast).toBe(false);
    });
  });

  describe('loadSettings and saveSettings', () => {
    it('should call loadSettings without error', () => {
      useSettingsStore.getState().loadSettings();
    });

    it('should call saveSettings without error', () => {
      useSettingsStore.getState().saveSettings();
    });
  });
});
