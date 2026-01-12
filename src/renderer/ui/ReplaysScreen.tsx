import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { flightRecorder, type RecordingInfo } from '../systems/FlightRecorder';
import styles from './ReplaysScreen.module.css';

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ReplaysScreen(): JSX.Element {
  const setScreen = useGameStore((state) => state.setScreen);
  const startGame = useGameStore((state) => state.startGame);

  const [recordings, setRecordings] = useState<RecordingInfo[]>([]);
  const [selectedRecording, setSelectedRecording] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Load recordings on mount
  useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = (): void => {
    const list = flightRecorder.getRecordingList();
    setRecordings(list);
  };

  const handleBack = (): void => {
    setScreen('mainMenu');
  };

  const handleSelectRecording = (id: string): void => {
    setSelectedRecording(selectedRecording === id ? null : id);
    setShowDeleteConfirm(null);
  };

  const handlePlayRecording = (id: string): void => {
    const recording = flightRecorder.loadRecordingById(id);
    if (recording) {
      // Store recording ID in session for playback
      sessionStorage.setItem('playbackRecordingId', id);
      // Load the recording into the playback system
      flightRecorder.loadRecording(recording);
      flightRecorder.startPlayback();
      startGame('freePlay');
    }
  };

  const handleDeleteRecording = (id: string): void => {
    if (showDeleteConfirm === id) {
      flightRecorder.deleteRecording(id);
      loadRecordings();
      setSelectedRecording(null);
      setShowDeleteConfirm(null);
    } else {
      setShowDeleteConfirm(id);
    }
  };

  const handleClearAll = (): void => {
    if (confirm('Are you sure you want to delete ALL recordings? This cannot be undone.')) {
      flightRecorder.clearAllRecordings();
      loadRecordings();
      setSelectedRecording(null);
    }
  };

  const selectedInfo = recordings.find((r) => r.id === selectedRecording);
  const selectedFull = selectedRecording ? flightRecorder.loadRecordingById(selectedRecording) : null;

  return (
    <div className={styles.container}>
      <div className={styles.background} />

      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>Flight Replays</h1>
          <p className={styles.subtitle}>View and replay your recorded flights</p>
        </div>

        {recordings.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📹</span>
            <h2>No Recordings Yet</h2>
            <p>Press R during flight to start recording.</p>
            <p>Your recorded flights will appear here.</p>
          </div>
        ) : (
          <div className={styles.mainContent}>
            {/* Recording list */}
            <div className={styles.recordingList}>
              <div className={styles.listHeader}>
                <span>Saved Flights ({recordings.length})</span>
                {recordings.length > 0 && (
                  <button className={styles.clearAllButton} onClick={handleClearAll}>
                    Clear All
                  </button>
                )}
              </div>
              <div className={styles.listItems}>
                {recordings.map((recording) => (
                  <div
                    key={recording.id}
                    className={`${styles.recordingItem} ${selectedRecording === recording.id ? styles.selected : ''}`}
                    onClick={() => handleSelectRecording(recording.id)}
                  >
                    <div className={styles.recordingInfo}>
                      <span className={styles.recordingName}>{recording.name}</span>
                      <span className={styles.recordingMeta}>
                        {formatDate(recording.createdAt)} • {formatDuration(recording.duration)}
                      </span>
                    </div>
                    <span className={styles.recordingFrames}>{recording.frameCount} frames</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recording details */}
            {selectedInfo && selectedFull && (
              <div className={styles.detailsPanel}>
                <h2 className={styles.detailsTitle}>{selectedInfo.name}</h2>

                <div className={styles.statsGrid}>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Duration</span>
                    <span className={styles.statValue}>{formatDuration(selectedInfo.duration)}</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Frames</span>
                    <span className={styles.statValue}>{selectedInfo.frameCount}</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Max Altitude</span>
                    <span className={styles.statValue}>{selectedFull.metadata.maxAltitude.toFixed(1)}m</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Max Speed</span>
                    <span className={styles.statValue}>{selectedFull.metadata.maxSpeed.toFixed(1)}m/s</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Drone</span>
                    <span className={styles.statValue}>{selectedFull.metadata.dronePreset}</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Recorded</span>
                    <span className={styles.statValue}>{formatDate(selectedInfo.createdAt)}</span>
                  </div>
                </div>

                <div className={styles.detailsActions}>
                  <button
                    className={styles.playButton}
                    onClick={() => handlePlayRecording(selectedInfo.id)}
                  >
                    <span className={styles.playIcon}>▶</span>
                    Play Recording
                  </button>
                  <button
                    className={`${styles.deleteButton} ${showDeleteConfirm === selectedInfo.id ? styles.confirmDelete : ''}`}
                    onClick={() => handleDeleteRecording(selectedInfo.id)}
                  >
                    {showDeleteConfirm === selectedInfo.id ? 'Confirm Delete' : 'Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <button className={styles.backButton} onClick={handleBack}>
          Back to Menu
        </button>
      </div>
    </div>
  );
}
