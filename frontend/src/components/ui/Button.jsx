import Icon from './Icon';
import Spinner from './Spinner';
import styles from './Button.module.css';

/** variant: "primary" | "secondary" | "ghost";  size: "sm" | "md" */
export default function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}) {
  return (
    <button
      type="button"
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${children ? '' : styles.iconOnly} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner size={13} /> : icon && <Icon name={icon} size={size === 'sm' ? 14 : 15} />}
      {children && <span>{children}</span>}
    </button>
  );
}
