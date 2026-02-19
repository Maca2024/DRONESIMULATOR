import { useEffect, useState, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import type { TrickPopupData } from '@shared/types';
import styles from './TrickPopup.module.css';

let nextPopupId = 0;

export function TrickPopup(): JSX.Element {
  const [popups, setPopups] = useState<TrickPopupData[]>([]);
  const trickPopup = useGameStore((state) => state.trickPopup);

  // Listen for new trick events from game store
  useEffect(() => {
    if (trickPopup) {
      const newPopup: TrickPopupData = {
        ...trickPopup,
        id: nextPopupId++,
      };
      setPopups((prev) => [...prev.slice(-3), newPopup]); // Keep max 4 popups
    }
  }, [trickPopup]);

  // Auto-remove popups after animation
  const removePopup = useCallback((id: number) => {
    setPopups((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return (
    <div className={styles.container}>
      {popups.map((popup) => (
        <PopupItem key={popup.id} popup={popup} onComplete={() => removePopup(popup.id)} />
      ))}
    </div>
  );
}

interface PopupItemProps {
  popup: TrickPopupData;
  onComplete: () => void;
}

function PopupItem({ popup, onComplete }: PopupItemProps): JSX.Element {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const tierClass = styles[popup.tier] || styles.basic;

  return (
    <div className={`${styles.popup} ${tierClass}`}>
      <p className={styles.trickName}>{popup.name}</p>
      <p className={styles.score}>+{popup.score}</p>
      {popup.combo > 1 && (
        <p className={styles.combo}>COMBO x{popup.multiplier.toFixed(1)}</p>
      )}
    </div>
  );
}
