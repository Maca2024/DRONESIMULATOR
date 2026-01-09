import styles from './LoadingScreen.module.css';

export function LoadingScreen(): JSX.Element {
  return (
    <div className={styles.container}>
      <div className={styles.spinner} />
      <p className={styles.text}>Loading...</p>
    </div>
  );
}
