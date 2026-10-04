'use client';

import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import styles from './Dropdown.module.css';

// Open popups, innermost last, so Escape closes only the topmost one
// (e.g. a dropdown inside the filter panel, not the whole panel).
const openPopups = [];

/** Closes a popup on outside click or Escape. */
export function useDismiss(open, setOpen, rootRef) {
  useEffect(() => {
    if (!open) return undefined;
    const token = {};
    openPopups.push(token);

    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && openPopups[openPopups.length - 1] === token) setOpen(false);
    };
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      openPopups.splice(openPopups.indexOf(token), 1);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, setOpen, rootRef]);
}

/**
 * A themed single-select dropdown.
 * options: [{ value, label, color? }]. value '' means "nothing selected" (the button shows `label`).
 * clearable: clicking the selected option again clears it (turn off for "is / is not" style choices).
 * fullWidth: stretch to fill the parent (used inside the filter panel).
 */
export default function Dropdown({ label, value, options, onChange, clearable = true, fullWidth = false }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = options.find((option) => option.value === value);
  useDismiss(open, setOpen, rootRef);

  const choose = (optionValue) => {
    onChange(clearable && optionValue === value ? '' : optionValue);
    setOpen(false);
  };

  return (
    <div className={`${styles.dropdown} ${fullWidth ? styles.fullWidth : ''}`} ref={rootRef}>
      <button
        type="button"
        className={`${styles.trigger} ${selected ? styles.active : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
      >
        <span className={styles.value} style={selected?.color ? { color: selected.color } : undefined}>
          {selected ? selected.label : label}
        </span>
        <Icon name="chevronRight" size={14} strokeWidth={2} className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} />
      </button>

      {open && (
        <ul className={styles.menu} role="listbox" aria-label={label}>
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`${styles.option} ${isSelected ? styles.selected : ''}`}
                  onClick={() => choose(option.value)}
                >
                  <span style={option.color ? { color: option.color } : undefined}>{option.label}</span>
                  {isSelected && <Icon name="check" size={15} strokeWidth={2.25} className={styles.check} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
