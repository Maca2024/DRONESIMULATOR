import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import styles from './Minimap.module.css';

interface MinimapProps {
  objectives?: { position: { x: number; z: number }; completed: boolean }[];
  gates?: { x: number; z: number }[];
}

const MINIMAP_SIZE = 150;
const SCALE = 1; // 1px = 1 world unit
const UPDATE_RATE = 100; // ms (10Hz)

export function Minimap({ objectives = [], gates = [] }: MinimapProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dronePosition = useGameStore((state) => state.drone.position);
  const droneRotation = useGameStore((state) => state.drone.rotation);

  // Compute yaw from quaternion
  const getYaw = useCallback(() => {
    const q = droneRotation;
    const siny = 2 * (q.w * q.z + q.x * q.y);
    const cosy = 1 - 2 * (q.y * q.y + q.z * q.z);
    return Math.atan2(siny, cosy);
  }, [droneRotation]);

  // Draw minimap
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cx = MINIMAP_SIZE / 2;
    const cy = MINIMAP_SIZE / 2;

    // Clear with dark background
    ctx.clearRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);
    ctx.fillStyle = 'rgba(10, 15, 30, 0.85)';
    ctx.beginPath();
    ctx.arc(cx, cy, cx, 0, Math.PI * 2);
    ctx.fill();

    // Grid lines
    ctx.strokeStyle = 'rgba(0, 255, 170, 0.15)';
    ctx.lineWidth = 0.5;
    for (let i = -70; i <= 70; i += 10) {
      const px = cx + (i - dronePosition.x % 10) * SCALE;
      const py = cy + (i - dronePosition.z % 10) * SCALE;
      if (px > 0 && px < MINIMAP_SIZE) {
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, MINIMAP_SIZE);
        ctx.stroke();
      }
      if (py > 0 && py < MINIMAP_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, py);
        ctx.lineTo(MINIMAP_SIZE, py);
        ctx.stroke();
      }
    }

    // Draw objectives
    objectives.forEach((obj) => {
      const dx = (obj.position.x - dronePosition.x) * SCALE + cx;
      const dz = (obj.position.z - dronePosition.z) * SCALE + cy;

      // Only draw if within minimap bounds
      const dist = Math.sqrt((dx - cx) ** 2 + (dz - cy) ** 2);
      if (dist < cx - 5) {
        ctx.fillStyle = obj.completed ? '#00ff88' : '#ffaa00';
        ctx.beginPath();
        ctx.arc(dx, dz, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw gates
    gates.forEach((gate) => {
      const dx = (gate.x - dronePosition.x) * SCALE + cx;
      const dz = (gate.z - dronePosition.z) * SCALE + cy;

      const dist = Math.sqrt((dx - cx) ** 2 + (dz - cy) ** 2);
      if (dist < cx - 5) {
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(dx, dz, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw drone (rotated arrow)
    const yaw = getYaw();
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(yaw);

    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(-4, 4);
    ctx.lineTo(0, 2);
    ctx.lineTo(4, 4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Border circle
    ctx.strokeStyle = 'rgba(0, 255, 170, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, cx - 1, 0, Math.PI * 2);
    ctx.stroke();
  }, [dronePosition, objectives, gates, getYaw]);

  // Update at 10Hz
  useEffect(() => {
    const interval = setInterval(draw, UPDATE_RATE);
    return () => clearInterval(interval);
  }, [draw]);

  return (
    <div className={styles.container}>
      <canvas
        ref={canvasRef}
        width={MINIMAP_SIZE}
        height={MINIMAP_SIZE}
        className={styles.canvas}
      />
    </div>
  );
}
