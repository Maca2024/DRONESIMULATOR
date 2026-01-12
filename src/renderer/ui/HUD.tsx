import { useEffect, useState, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { useInputStore } from '../store/inputStore';
import styles from './HUD.module.css';

function getCompassDirection(heading: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(heading / 45) % 8;
  return directions[index];
}

function getGForceColor(g: number): string {
  if (g > 3) return '#ff4444';
  if (g > 2) return '#ffaa00';
  if (g > 1.5) return '#ffdd00';
  return '#00ff88';
}

export function HUD(): JSX.Element {
  const drone = useGameStore((state) => state.drone);
  const wind = useGameStore((state) => state.wind);
  const score = useGameStore((state) => state.score);
  const missionTime = useGameStore((state) => state.missionTime);
  const comboMultiplier = useGameStore((state) => state.comboMultiplier);
  const input = useInputStore((state) => state.input);
  const pauseGame = useGameStore((state) => state.pauseGame);

  const [fps, setFps] = useState(60);
  const [showTelemetry, setShowTelemetry] = useState(true);
  const [gForce, setGForce] = useState(1);
  const lastVelocity = useRef({ x: 0, y: 0, z: 0 });

  // FPS counter
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();

    const updateFps = (): void => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
      }
      requestAnimationFrame(updateFps);
    };

    const animId = requestAnimationFrame(updateFps);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        pauseGame();
      }
      if (e.code === 'KeyT') {
        setShowTelemetry((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pauseGame]);

  // Calculate G-force from velocity changes
  useEffect(() => {
    const dt = 1 / 60; // Approximate frame time
    const accelX = (drone.velocity.x - lastVelocity.current.x) / dt;
    const accelY = (drone.velocity.y - lastVelocity.current.y) / dt;
    const accelZ = (drone.velocity.z - lastVelocity.current.z) / dt;

    // Total acceleration magnitude (including gravity compensation)
    const totalAccel = Math.sqrt(accelX ** 2 + (accelY + 9.81) ** 2 + accelZ ** 2);
    const gForceValue = totalAccel / 9.81;

    // Smooth the G-force reading
    setGForce((prev) => prev * 0.8 + gForceValue * 0.2);

    lastVelocity.current = { ...drone.velocity };
  }, [drone.velocity]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const altitude = drone.position.y.toFixed(1);
  const speed = Math.sqrt(
    drone.velocity.x ** 2 + drone.velocity.y ** 2 + drone.velocity.z ** 2
  ).toFixed(1);
  const verticalSpeed = drone.velocity.y.toFixed(1);
  const horizontalSpeed = Math.sqrt(drone.velocity.x ** 2 + drone.velocity.z ** 2).toFixed(1);

  // Calculate heading from quaternion (simplified: use atan2 of x/z velocity for direction of movement)
  const heading = Math.round(
    ((Math.atan2(drone.velocity.x, drone.velocity.z) * 180) / Math.PI + 360) % 360
  );
  const compassDirection = getCompassDirection(heading);

  // Motor RPMs normalized for display (0-100%)
  const motorPercents = drone.motorRPM.map((rpm) => Math.min(100, (rpm / 25000) * 100));

  // Battery status calculations
  const batteryPercent = Math.round(drone.batteryLevel);
  const isLowBattery = batteryPercent <= 20;
  const isCriticalBattery = batteryPercent <= 5;
  const getBatteryColor = (): string => {
    if (isCriticalBattery) return '#ff4444';
    if (isLowBattery) return '#ffaa00';
    if (batteryPercent <= 50) return '#ffdd00';
    return '#00ff88';
  };

  return (
    <div className={styles.hud}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.flightInfo}>
          <div className={styles.infoItem}>
            <span className={styles.label}>ALT</span>
            <span className={styles.value}>{altitude}m</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>SPD</span>
            <span className={styles.value}>{speed}m/s</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>MODE</span>
            <span className={styles.value}>{drone.flightMode.toUpperCase()}</span>
          </div>
          {wind.enabled && wind.speed > 0.1 && (
            <div className={styles.infoItem}>
              <span className={styles.label}>WIND</span>
              <div className={styles.windIndicator}>
                <span
                  className={styles.windArrow}
                  style={{ transform: `rotate(${wind.direction}deg)` }}
                >
                  ↑
                </span>
                <span className={styles.value}>{wind.speed.toFixed(1)}m/s</span>
              </div>
            </div>
          )}
        </div>

        <div className={styles.timeScore}>
          <div className={styles.time}>{formatTime(missionTime)}</div>
          <div className={styles.score}>
            <span className={styles.scoreValue}>{score.toLocaleString()}</span>
            {comboMultiplier > 1 && (
              <span className={styles.combo}>x{comboMultiplier.toFixed(1)}</span>
            )}
          </div>
        </div>

        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.label}>FPS</span>
            <span className={styles.value}>{fps}</span>
          </div>
          <div className={`${styles.batteryContainer} ${isLowBattery ? styles.batteryLow : ''} ${isCriticalBattery ? styles.batteryCritical : ''}`}>
            <span className={styles.label}>BAT</span>
            <div className={styles.batteryIndicator}>
              <div
                className={styles.batteryFill}
                style={{
                  width: `${batteryPercent}%`,
                  backgroundColor: getBatteryColor()
                }}
              />
            </div>
            <span
              className={styles.batteryValue}
              style={{ color: getBatteryColor() }}
            >
              {batteryPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Left side - Throttle */}
      <div className={styles.throttleContainer}>
        <div className={styles.throttleBar}>
          <div
            className={styles.throttleFill}
            style={{ height: `${input.throttle * 100}%` }}
          />
          <div className={styles.throttleMarker} style={{ bottom: '50%' }} />
        </div>
        <span className={styles.throttleLabel}>THR</span>
        <span className={styles.throttleValue}>{Math.round(input.throttle * 100)}%</span>
      </div>

      {/* Right side - Attitude indicator */}
      <div className={styles.attitudeContainer}>
        <div className={styles.attitudeIndicator}>
          <div
            className={styles.horizon}
            style={{
              transform: `rotate(${-input.roll * 30}deg) translateY(${input.pitch * 30}px)`,
            }}
          >
            <div className={styles.sky} />
            <div className={styles.ground} />
            <div className={styles.horizonLine} />
          </div>
          <div className={styles.centerMark} />
        </div>

        {/* Compass heading */}
        <div className={styles.compass}>
          <span className={styles.compassHeading}>{heading}°</span>
          <span className={styles.compassDirection}>{compassDirection}</span>
        </div>
      </div>

      {/* Enhanced Telemetry Panel (toggleable with T) */}
      {showTelemetry && (
        <div className={styles.telemetryPanel}>
          {/* Motor RPMs */}
          <div className={styles.motorRPMs}>
            <div className={styles.telemetryTitle}>MOTORS</div>
            <div className={styles.motorGrid}>
              {motorPercents.map((percent, i) => (
                <div key={i} className={styles.motorIndicator}>
                  <div className={styles.motorBar}>
                    <div
                      className={styles.motorFill}
                      style={{
                        height: `${percent}%`,
                        backgroundColor: percent > 90 ? '#ff4444' : percent > 70 ? '#ffaa00' : '#00ff88',
                      }}
                    />
                  </div>
                  <span className={styles.motorLabel}>M{i + 1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Velocity Vector */}
          <div className={styles.velocityInfo}>
            <div className={styles.telemetryTitle}>VELOCITY</div>
            <div className={styles.velocityRow}>
              <span className={styles.velocityLabel}>H:</span>
              <span className={styles.velocityValue}>{horizontalSpeed}m/s</span>
            </div>
            <div className={styles.velocityRow}>
              <span className={styles.velocityLabel}>V:</span>
              <span
                className={styles.velocityValue}
                style={{ color: Number(verticalSpeed) < -2 ? '#ff4444' : Number(verticalSpeed) > 2 ? '#00ff88' : '#fff' }}
              >
                {Number(verticalSpeed) > 0 ? '+' : ''}{verticalSpeed}m/s
              </span>
            </div>
          </div>

          {/* G-Force */}
          <div className={styles.gForceDisplay}>
            <div className={styles.telemetryTitle}>G-FORCE</div>
            <span
              className={styles.gForceValue}
              style={{ color: getGForceColor(gForce) }}
            >
              {gForce.toFixed(1)}G
            </span>
          </div>
        </div>
      )}

      {/* Bottom - Arm status */}
      <div className={styles.bottomBar}>
        <div className={`${styles.armStatus} ${drone.isArmed ? styles.armed : styles.disarmed}`}>
          {drone.isArmed ? '🟢 ARMED' : '🔴 DISARMED'}
        </div>
        <div className={styles.inputSource}>
          Input: {input.source.toUpperCase()}
        </div>
      </div>

      {/* Crosshair */}
      <div className={styles.crosshair}>
        <div className={styles.crosshairH} />
        <div className={styles.crosshairV} />
      </div>
    </div>
  );
}
