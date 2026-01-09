import { useState } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { useGameStore } from '../store/gameStore';
import styles from './SettingsPanel.module.css';

type SettingsTab = 'controls' | 'graphics' | 'audio' | 'accessibility';

export function SettingsPanel(): JSX.Element {
  const [activeTab, setActiveTab] = useState<SettingsTab>('controls');
  const settings = useSettingsStore((state) => state.settings);
  const updateGraphics = useSettingsStore((state) => state.updateGraphics);
  const updateAudio = useSettingsStore((state) => state.updateAudio);
  const updateAccessibility = useSettingsStore((state) => state.updateAccessibility);
  const updateControls = useSettingsStore((state) => state.updateControls);
  const goBack = useGameStore((state) => state.goBack);

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'controls', label: 'Controls' },
    { id: 'graphics', label: 'Graphics' },
    { id: 'audio', label: 'Audio' },
    { id: 'accessibility', label: 'Accessibility' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2 className={styles.title}>Settings</h2>
          <button className={styles.closeButton} onClick={goBack}>
            ✕
          </button>
        </div>

        <div className={styles.tabs}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.content}>
          {activeTab === 'controls' && (
            <ControlsSettings settings={settings.controls} onUpdate={updateControls} />
          )}
          {activeTab === 'graphics' && (
            <GraphicsSettings settings={settings.graphics} onUpdate={updateGraphics} />
          )}
          {activeTab === 'audio' && (
            <AudioSettings settings={settings.audio} onUpdate={updateAudio} />
          )}
          {activeTab === 'accessibility' && (
            <AccessibilitySettings
              settings={settings.accessibility}
              onUpdate={updateAccessibility}
            />
          )}
        </div>
      </div>
    </div>
  );
}

interface ControlsSettingsProps {
  settings: typeof useSettingsStore.getState extends () => { settings: { controls: infer T } } ? T : never;
  onUpdate: (settings: Partial<typeof useSettingsStore.getState extends () => { settings: { controls: infer T } } ? T : never>) => void;
}

function ControlsSettings({ settings, onUpdate }: ControlsSettingsProps): JSX.Element {
  return (
    <div className={styles.settingsGroup}>
      <h3 className={styles.groupTitle}>Input Settings</h3>

      <div className={styles.setting}>
        <label className={styles.label}>Input Method</label>
        <select
          className={styles.select}
          value={settings.inputMethod}
          onChange={(e) => onUpdate({ inputMethod: e.target.value as 'keyboard' | 'mouse' | 'gamepad' })}
        >
          <option value="keyboard">Keyboard</option>
          <option value="mouse">Mouse</option>
          <option value="gamepad">Gamepad</option>
        </select>
      </div>

      <div className={styles.setting}>
        <label className={styles.label}>Sensitivity</label>
        <input
          type="range"
          className={styles.slider}
          min="0.3"
          max="3"
          step="0.1"
          value={settings.inputConfig.sensitivity}
          onChange={(e) =>
            onUpdate({
              inputConfig: { ...settings.inputConfig, sensitivity: parseFloat(e.target.value) },
            })
          }
        />
        <span className={styles.value}>{settings.inputConfig.sensitivity.toFixed(1)}</span>
      </div>

      <div className={styles.setting}>
        <label className={styles.label}>Deadzone</label>
        <input
          type="range"
          className={styles.slider}
          min="0"
          max="0.25"
          step="0.01"
          value={settings.inputConfig.deadzone}
          onChange={(e) =>
            onUpdate({
              inputConfig: { ...settings.inputConfig, deadzone: parseFloat(e.target.value) },
            })
          }
        />
        <span className={styles.value}>{(settings.inputConfig.deadzone * 100).toFixed(0)}%</span>
      </div>

      <div className={styles.setting}>
        <label className={styles.label}>Expo</label>
        <input
          type="range"
          className={styles.slider}
          min="0"
          max="1"
          step="0.05"
          value={settings.inputConfig.expo}
          onChange={(e) =>
            onUpdate({
              inputConfig: { ...settings.inputConfig, expo: parseFloat(e.target.value) },
            })
          }
        />
        <span className={styles.value}>{(settings.inputConfig.expo * 100).toFixed(0)}%</span>
      </div>

      <h3 className={styles.groupTitle}>Inversion</h3>
      <div className={styles.checkboxGroup}>
        {(['pitch', 'roll', 'yaw', 'throttle'] as const).map((axis) => (
          <label key={axis} className={styles.checkbox}>
            <input
              type="checkbox"
              checked={settings.inputConfig.inverted[axis]}
              onChange={(e) =>
                onUpdate({
                  inputConfig: {
                    ...settings.inputConfig,
                    inverted: { ...settings.inputConfig.inverted, [axis]: e.target.checked },
                  },
                })
              }
            />
            <span>Invert {axis}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

interface GraphicsSettingsProps {
  settings: typeof useSettingsStore.getState extends () => { settings: { graphics: infer T } } ? T : never;
  onUpdate: (settings: Partial<typeof useSettingsStore.getState extends () => { settings: { graphics: infer T } } ? T : never>) => void;
}

function GraphicsSettings({ settings, onUpdate }: GraphicsSettingsProps): JSX.Element {
  return (
    <div className={styles.settingsGroup}>
      <h3 className={styles.groupTitle}>Display</h3>

      <div className={styles.setting}>
        <label className={styles.label}>Quality</label>
        <select
          className={styles.select}
          value={settings.quality}
          onChange={(e) => onUpdate({ quality: e.target.value as 'low' | 'medium' | 'high' | 'ultra' })}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="ultra">Ultra</option>
        </select>
      </div>

      <div className={styles.setting}>
        <label className={styles.label}>FPS Limit</label>
        <select
          className={styles.select}
          value={settings.fpsLimit}
          onChange={(e) => onUpdate({ fpsLimit: parseInt(e.target.value, 10) })}
        >
          <option value="30">30 FPS</option>
          <option value="60">60 FPS</option>
          <option value="120">120 FPS</option>
          <option value="0">Unlimited</option>
        </select>
      </div>

      <div className={styles.checkboxGroup}>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={settings.vsync}
            onChange={(e) => onUpdate({ vsync: e.target.checked })}
          />
          <span>VSync</span>
        </label>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={settings.shadows}
            onChange={(e) => onUpdate({ shadows: e.target.checked })}
          />
          <span>Shadows</span>
        </label>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={settings.postProcessing}
            onChange={(e) => onUpdate({ postProcessing: e.target.checked })}
          />
          <span>Post Processing</span>
        </label>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={settings.motionBlur}
            onChange={(e) => onUpdate({ motionBlur: e.target.checked })}
          />
          <span>Motion Blur</span>
        </label>
      </div>
    </div>
  );
}

interface AudioSettingsProps {
  settings: typeof useSettingsStore.getState extends () => { settings: { audio: infer T } } ? T : never;
  onUpdate: (settings: Partial<typeof useSettingsStore.getState extends () => { settings: { audio: infer T } } ? T : never>) => void;
}

function AudioSettings({ settings, onUpdate }: AudioSettingsProps): JSX.Element {
  return (
    <div className={styles.settingsGroup}>
      <h3 className={styles.groupTitle}>Volume</h3>

      <div className={styles.setting}>
        <label className={styles.label}>Master</label>
        <input
          type="range"
          className={styles.slider}
          min="0"
          max="1"
          step="0.05"
          value={settings.masterVolume}
          onChange={(e) => onUpdate({ masterVolume: parseFloat(e.target.value) })}
        />
        <span className={styles.value}>{Math.round(settings.masterVolume * 100)}%</span>
      </div>

      <div className={styles.setting}>
        <label className={styles.label}>Effects</label>
        <input
          type="range"
          className={styles.slider}
          min="0"
          max="1"
          step="0.05"
          value={settings.effectsVolume}
          onChange={(e) => onUpdate({ effectsVolume: parseFloat(e.target.value) })}
        />
        <span className={styles.value}>{Math.round(settings.effectsVolume * 100)}%</span>
      </div>

      <div className={styles.setting}>
        <label className={styles.label}>Music</label>
        <input
          type="range"
          className={styles.slider}
          min="0"
          max="1"
          step="0.05"
          value={settings.musicVolume}
          onChange={(e) => onUpdate({ musicVolume: parseFloat(e.target.value) })}
        />
        <span className={styles.value}>{Math.round(settings.musicVolume * 100)}%</span>
      </div>

      <div className={styles.checkboxGroup}>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={settings.spatialAudio}
            onChange={(e) => onUpdate({ spatialAudio: e.target.checked })}
          />
          <span>Spatial Audio (3D)</span>
        </label>
      </div>
    </div>
  );
}

interface AccessibilitySettingsProps {
  settings: typeof useSettingsStore.getState extends () => { settings: { accessibility: infer T } } ? T : never;
  onUpdate: (settings: Partial<typeof useSettingsStore.getState extends () => { settings: { accessibility: infer T } } ? T : never>) => void;
}

function AccessibilitySettings({ settings, onUpdate }: AccessibilitySettingsProps): JSX.Element {
  return (
    <div className={styles.settingsGroup}>
      <h3 className={styles.groupTitle}>Motor Accessibility</h3>
      <div className={styles.checkboxGroup}>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={settings.oneHandedMode}
            onChange={(e) => onUpdate({ oneHandedMode: e.target.checked })}
          />
          <span>One-Handed Mode</span>
        </label>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={settings.holdToConfirm}
            onChange={(e) => onUpdate({ holdToConfirm: e.target.checked })}
          />
          <span>Hold to Confirm</span>
        </label>
      </div>

      <div className={styles.setting}>
        <label className={styles.label}>Auto-Stabilization</label>
        <input
          type="range"
          className={styles.slider}
          min="0"
          max="100"
          step="5"
          value={settings.autoStabilization}
          onChange={(e) => onUpdate({ autoStabilization: parseInt(e.target.value, 10) })}
        />
        <span className={styles.value}>{settings.autoStabilization}%</span>
      </div>

      <h3 className={styles.groupTitle}>Visual Accessibility</h3>
      <div className={styles.setting}>
        <label className={styles.label}>Colorblind Mode</label>
        <select
          className={styles.select}
          value={settings.colorblindMode}
          onChange={(e) => onUpdate({ colorblindMode: e.target.value as 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia' })}
        >
          <option value="none">None</option>
          <option value="deuteranopia">Deuteranopia</option>
          <option value="protanopia">Protanopia</option>
          <option value="tritanopia">Tritanopia</option>
        </select>
      </div>

      <div className={styles.setting}>
        <label className={styles.label}>UI Scale</label>
        <input
          type="range"
          className={styles.slider}
          min="1"
          max="3"
          step="0.1"
          value={settings.uiScale}
          onChange={(e) => onUpdate({ uiScale: parseFloat(e.target.value) })}
        />
        <span className={styles.value}>{(settings.uiScale * 100).toFixed(0)}%</span>
      </div>

      <div className={styles.checkboxGroup}>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={settings.highContrast}
            onChange={(e) => onUpdate({ highContrast: e.target.checked })}
          />
          <span>High Contrast</span>
        </label>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={settings.largeText}
            onChange={(e) => onUpdate({ largeText: e.target.checked })}
          />
          <span>Large Text</span>
        </label>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={settings.reduceMotion}
            onChange={(e) => onUpdate({ reduceMotion: e.target.checked })}
          />
          <span>Reduce Motion</span>
        </label>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={settings.disableScreenShake}
            onChange={(e) => onUpdate({ disableScreenShake: e.target.checked })}
          />
          <span>Disable Screen Shake</span>
        </label>
      </div>

      <h3 className={styles.groupTitle}>Audio Accessibility</h3>
      <div className={styles.checkboxGroup}>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={settings.visualAudioCues}
            onChange={(e) => onUpdate({ visualAudioCues: e.target.checked })}
          />
          <span>Visual Audio Cues</span>
        </label>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={settings.subtitles}
            onChange={(e) => onUpdate({ subtitles: e.target.checked })}
          />
          <span>Subtitles</span>
        </label>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={settings.monoAudio}
            onChange={(e) => onUpdate({ monoAudio: e.target.checked })}
          />
          <span>Mono Audio</span>
        </label>
      </div>

      <h3 className={styles.groupTitle}>Cognitive Accessibility</h3>
      <div className={styles.checkboxGroup}>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={settings.simplifiedHUD}
            onChange={(e) => onUpdate({ simplifiedHUD: e.target.checked })}
          />
          <span>Simplified HUD</span>
        </label>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={settings.extendedTimeLimits}
            onChange={(e) => onUpdate({ extendedTimeLimits: e.target.checked })}
          />
          <span>Extended Time Limits</span>
        </label>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={settings.visualGuides}
            onChange={(e) => onUpdate({ visualGuides: e.target.checked })}
          />
          <span>Visual Guides</span>
        </label>
      </div>
    </div>
  );
}
