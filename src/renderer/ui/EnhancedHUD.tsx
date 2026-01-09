import React, { useMemo } from 'react';
import styles from './EnhancedHUD.module.css';

interface HUDProps {
  altitude: number;
  speed: number;
  heading: number;
  pitch: number;
  roll: number;
  throttle: number;
  batteryLevel: number;
  armed: boolean;
  gpsSignal: number;
  motorRPM: [number, number, number, number];
  flightMode: string;
}

export const EnhancedHUD: React.FC<HUDProps> = ({
  altitude,
  speed,
  heading,
  pitch,
  roll,
  throttle,
  batteryLevel,
  armed,
  gpsSignal,
  motorRPM,
  flightMode
}) => {
  // Compass points
  const compassPoints = useMemo(() => {
    const points = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return points.map((point, i) => ({
      label: point,
      angle: i * 45
    }));
  }, []);

  // Calculate visible compass range
  const visibleCompassRange = 120; // degrees visible
  const compassOffset = ((heading % 360) + 360) % 360;

  // Battery color based on level
  const batteryColor = batteryLevel > 50 ? '#00ff00' : batteryLevel > 20 ? '#ffaa00' : '#ff0000';

  // Calculate artificial horizon offset
  const horizonOffset = pitch * 2; // 2px per degree
  const horizonRotation = -roll;

  return (
    <div className={styles.hudContainer}>
      {/* Top bar - Flight info */}
      <div className={styles.topBar}>
        <div className={styles.flightMode}>
          <span className={armed ? styles.armed : styles.disarmed}>
            {armed ? '● ARMED' : '○ DISARMED'}
          </span>
          <span className={styles.mode}>{flightMode.toUpperCase()}</span>
        </div>

        <div className={styles.compass}>
          <div className={styles.compassStrip}>
            {compassPoints.map((point) => {
              const relativeAngle = ((point.angle - compassOffset + 180 + 360) % 360) - 180;
              if (Math.abs(relativeAngle) > visibleCompassRange / 2) return null;
              const position = (relativeAngle / visibleCompassRange) * 100 + 50;
              return (
                <span
                  key={point.label}
                  className={styles.compassPoint}
                  style={{ left: `${position}%` }}
                >
                  {point.label}
                </span>
              );
            })}
            <div className={styles.compassIndicator}>▼</div>
          </div>
          <div className={styles.headingValue}>{Math.round(heading)}°</div>
        </div>

        <div className={styles.statusIcons}>
          <div className={styles.gpsStatus}>
            <span className={styles.icon}>📡</span>
            <div className={styles.signalBars}>
              {[1, 2, 3, 4].map((bar) => (
                <div
                  key={bar}
                  className={`${styles.signalBar} ${gpsSignal >= bar * 25 ? styles.active : ''}`}
                />
              ))}
            </div>
          </div>
          <div className={styles.battery} style={{ color: batteryColor }}>
            <span className={styles.icon}>🔋</span>
            <span>{Math.round(batteryLevel)}%</span>
          </div>
        </div>
      </div>

      {/* Left side - Altitude */}
      <div className={styles.leftPanel}>
        <div className={styles.altitudeGauge}>
          <div className={styles.gaugeLabel}>ALT</div>
          <div className={styles.gaugeValue}>{altitude.toFixed(1)}</div>
          <div className={styles.gaugeUnit}>m</div>
          <div className={styles.verticalBar}>
            <div
              className={styles.verticalFill}
              style={{ height: `${Math.min(100, (altitude / 100) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Right side - Speed */}
      <div className={styles.rightPanel}>
        <div className={styles.speedGauge}>
          <div className={styles.gaugeLabel}>SPD</div>
          <div className={styles.gaugeValue}>{speed.toFixed(1)}</div>
          <div className={styles.gaugeUnit}>m/s</div>
          <div className={styles.verticalBar}>
            <div
              className={styles.verticalFill}
              style={{ height: `${Math.min(100, (speed / 30) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Center - Artificial Horizon */}
      <div className={styles.centerPanel}>
        <div className={styles.artificialHorizon}>
          <div
            className={styles.horizonBall}
            style={{
              transform: `rotate(${horizonRotation}deg) translateY(${horizonOffset}px)`
            }}
          >
            <div className={styles.sky} />
            <div className={styles.ground} />
            <div className={styles.horizonLine} />
            {/* Pitch ladder */}
            {[-30, -20, -10, 10, 20, 30].map((pitchMark) => (
              <div
                key={pitchMark}
                className={styles.pitchMark}
                style={{ top: `${50 - pitchMark * 2}%` }}
              >
                <span className={styles.pitchMarkLine} />
                <span className={styles.pitchMarkLabel}>{pitchMark}</span>
              </div>
            ))}
          </div>
          {/* Fixed aircraft reference */}
          <div className={styles.aircraftReference}>
            <div className={styles.aircraftWing} />
            <div className={styles.aircraftCenter} />
            <div className={styles.aircraftWing} />
          </div>
        </div>

        {/* Pitch/Roll indicators */}
        <div className={styles.attitudeValues}>
          <span>P: {pitch.toFixed(1)}°</span>
          <span>R: {roll.toFixed(1)}°</span>
        </div>
      </div>

      {/* Bottom bar - Throttle and Motors */}
      <div className={styles.bottomBar}>
        <div className={styles.throttleGauge}>
          <div className={styles.throttleLabel}>THR</div>
          <div className={styles.throttleBar}>
            <div
              className={styles.throttleFill}
              style={{ width: `${throttle * 100}%` }}
            />
          </div>
          <div className={styles.throttleValue}>{Math.round(throttle * 100)}%</div>
        </div>

        <div className={styles.motorIndicators}>
          {motorRPM.map((rpm, index) => {
            const normalizedRPM = rpm / 8000;
            const rpmColor = normalizedRPM > 0.8 ? '#ff0000' : normalizedRPM > 0.5 ? '#ffaa00' : '#00ff00';
            return (
              <div key={index} className={styles.motorGauge}>
                <div className={styles.motorLabel}>M{index + 1}</div>
                <div className={styles.motorBar}>
                  <div
                    className={styles.motorFill}
                    style={{
                      height: `${normalizedRPM * 100}%`,
                      backgroundColor: rpmColor
                    }}
                  />
                </div>
                <div className={styles.motorRPM}>{Math.round(rpm)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Warnings overlay */}
      {altitude < 1 && armed && (
        <div className={styles.warning}>⚠️ LOW ALTITUDE</div>
      )}
      {batteryLevel < 20 && (
        <div className={styles.warning} style={{ top: '60%' }}>⚠️ LOW BATTERY</div>
      )}
    </div>
  );
};
