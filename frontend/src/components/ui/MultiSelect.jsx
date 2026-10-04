'use client';

import { useRef, useState } from 'react';
import { useDismiss } from './Dropdown';
import Icon from './Icon';
import styles from './Dropdown.module.css';

/**
 * A themed multi-select dropdown with checkboxes. The menu stays open while you tick options.
 * options: [{ value, label, color? }], values: array of selected values.
 */
export default function MultiSelect({ label, placeholder = '', values, options, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  useDismiss(open, setOpen, rootRef);

  const selected = options.filter((option) => values.includes(option.value));
  const toggle = (value) =>
    onChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);

  return (
    <div className={`${styles.dropdown} ${styles.fullWidth}`} ref={rootRef}>
      <button
        type="button"
        className={`${styles.trigger} ${selected.length ? styles.active : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
      >
        <span className={styles.value}>
          {selected.length === 0 && <span className={styles.placeholder}>{placeholder}</span>}
          {selected.map((option, index) => (
            <span key={option.value} style={option.color ? { color: option.color } : undefined}>
              {option.label}
              {index < selected.length - 1 ? ', ' : ''}
            </span>
          ))}
        </span>
        <Icon name="chevronRight" size={14} strokeWidth={2} className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} />
      </button>

      {open && (
        <ul className={styles.menu} role="listbox" aria-label={label} aria-multiselectable="true">
          {options.map((option) => {
            const isSelected = values.includes(option.value);
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`${styles.option} ${styles.optionCheckbox}`}
                  onClick={() => toggle(option.value)}
                >
                  <span className={`${styles.checkbox} ${isSelected ? styles.checkboxOn : ''}`}>
                    {isSelected && <Icon name="check" size={12} strokeWidth={3} />}
                  </span>
                  <span style={option.color ? { color: option.color } : undefined}>{option.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
