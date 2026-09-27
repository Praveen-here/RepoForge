import styles from './Resizer.module.css';

/** A thin drag handle between panes. axis "x" = vertical bar, "y" = horizontal bar. */
export default function Resizer({ axis = 'x', onPointerDown }) {
  return (
    <div
      role="separator"
      aria-orientation={axis === 'x' ? 'vertical' : 'horizontal'}
      className={`${styles.resizer} ${axis === 'x' ? styles.x : styles.y}`}
      onPointerDown={onPointerDown}
    />
  );
}
