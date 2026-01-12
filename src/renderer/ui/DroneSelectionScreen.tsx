import { useGameStore } from '../store/gameStore';
import { DRONE_PRESETS } from '@shared/constants';
import type { DronePresetId } from '@shared/types';
import styles from './DroneSelectionScreen.module.css';

interface DronePresetInfo {
  id: DronePresetId;
  name: string;
  description: string;
  icon: string;
}

const PRESET_INFO: DronePresetInfo[] = [
  {
    id: 'BEGINNER',
    name: 'Beginner',
    description: 'Stable and forgiving. Perfect for learning the basics with slower response and self-leveling assist.',
    icon: '🛡️',
  },
  {
    id: 'INTERMEDIATE',
    name: 'Intermediate',
    description: 'Balanced performance. Good mix of agility and stability for improving pilots.',
    icon: '⚡',
  },
  {
    id: 'RACING',
    name: 'Racing',
    description: 'Maximum speed and response. Lightweight build with aggressive rates for competitive flying.',
    icon: '🏁',
  },
  {
    id: 'FREESTYLE',
    name: 'Freestyle',
    description: 'Optimized for tricks and aerobatics. High power with smooth control for creative flying.',
    icon: '🎯',
  },
];

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }): JSX.Element {
  const percentage = (value / max) * 100;
  return (
    <div className={styles.statBar}>
      <span className={styles.statLabel}>{label}</span>
      <div className={styles.statTrack}>
        <div
          className={styles.statFill}
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
      <span className={styles.statValue}>{value.toFixed(1)}</span>
    </div>
  );
}

export function DroneSelectionScreen(): JSX.Element {
  const selectedPreset = useGameStore((state) => state.selectedDronePreset);
  const setDronePreset = useGameStore((state) => state.setDronePreset);
  const setScreen = useGameStore((state) => state.setScreen);
  const startGame = useGameStore((state) => state.startGame);

  const handleSelectDrone = (presetId: DronePresetId): void => {
    setDronePreset(presetId);
  };

  const handleStartFlight = (): void => {
    startGame('freePlay');
  };

  const handleBack = (): void => {
    setScreen('mainMenu');
  };

  // Calculate display stats from preset values
  const getDisplayStats = (presetId: DronePresetId) => {
    const preset = DRONE_PRESETS[presetId];
    return {
      weight: preset.mass * 1000, // Convert to grams
      power: preset.thrustMultiplier * 50, // Scale for display
      agility: preset.rates.roll / 10, // Scale for display
      speed: (preset.thrustMultiplier / preset.dragCoefficient) * 20, // Approximate max speed
    };
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={handleBack}>
          ← Back
        </button>
        <h1 className={styles.title}>Select Your Drone</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.droneGrid}>
          {PRESET_INFO.map((info) => {
            const isSelected = selectedPreset === info.id;
            const stats = getDisplayStats(info.id);

            return (
              <button
                key={info.id}
                className={`${styles.droneCard} ${isSelected ? styles.selected : ''}`}
                onClick={() => handleSelectDrone(info.id)}
              >
                <div className={styles.droneIcon}>{info.icon}</div>
                <h2 className={styles.droneName}>{info.name}</h2>
                <p className={styles.droneDescription}>{info.description}</p>

                <div className={styles.statsContainer}>
                  <StatBar
                    label="Weight"
                    value={stats.weight}
                    max={600}
                    color="#ff6b6b"
                  />
                  <StatBar
                    label="Power"
                    value={stats.power}
                    max={100}
                    color="#4ecdc4"
                  />
                  <StatBar
                    label="Agility"
                    value={stats.agility}
                    max={70}
                    color="#ffe66d"
                  />
                  <StatBar
                    label="Speed"
                    value={stats.speed}
                    max={200}
                    color="#a78bfa"
                  />
                </div>

                {isSelected && (
                  <div className={styles.selectedBadge}>Selected</div>
                )}
              </button>
            );
          })}
        </div>

        <div className={styles.previewSection}>
          <h3 className={styles.previewTitle}>
            {PRESET_INFO.find(p => p.id === selectedPreset)?.name} Drone
          </h3>
          <div className={styles.dronePreview}>
            <div className={styles.drone3DPlaceholder}>
              <span className={styles.previewIcon}>
                {PRESET_INFO.find(p => p.id === selectedPreset)?.icon}
              </span>
              <span className={styles.previewText}>3D Preview</span>
            </div>
          </div>

          <div className={styles.detailedStats}>
            <h4>Detailed Specifications</h4>
            <div className={styles.specGrid}>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>Mass</span>
                <span className={styles.specValue}>
                  {(DRONE_PRESETS[selectedPreset].mass * 1000).toFixed(0)}g
                </span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>Thrust</span>
                <span className={styles.specValue}>
                  {DRONE_PRESETS[selectedPreset].thrustMultiplier.toFixed(1)}x
                </span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>Roll Rate</span>
                <span className={styles.specValue}>
                  {DRONE_PRESETS[selectedPreset].rates.roll}°/s
                </span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>Pitch Rate</span>
                <span className={styles.specValue}>
                  {DRONE_PRESETS[selectedPreset].rates.pitch}°/s
                </span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>Yaw Rate</span>
                <span className={styles.specValue}>
                  {DRONE_PRESETS[selectedPreset].rates.yaw}°/s
                </span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>Drag</span>
                <span className={styles.specValue}>
                  {DRONE_PRESETS[selectedPreset].dragCoefficient.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <button className={styles.startButton} onClick={handleStartFlight}>
          Start Flight →
        </button>
      </div>
    </div>
  );
}
