'use client';

import { useRef, useState } from 'react';
import Dropdown, { useDismiss } from '@/components/ui/Dropdown';
import Icon from '@/components/ui/Icon';
import MultiSelect from '@/components/ui/MultiSelect';
import { activeRows, FILTER_FIELDS } from '@/lib/problemFilters';
import styles from './FilterPanel.module.css';

const MATCH_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'any', label: 'Any' },
];

const OPERATOR_OPTIONS = [
  { value: 'is', label: 'is' },
  { value: 'not', label: 'is not' },
];

/**
 * A filter button with a LeetCode-style panel.
 * fields: { difficulty: { label, icon, options }, framework: { ... } }
 */
export default function FilterPanel({ filters, onChange, onReset, fields }) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const rootRef = useRef(null);
  useDismiss(open, setOpen, rootRef);

  const activeCount = activeRows(filters).length;
  const missingFields = FILTER_FIELDS.filter((field) => !filters.rows.some((row) => row.field === field));

  const updateRow = (field, patch) =>
    onChange({ ...filters, rows: filters.rows.map((row) => (row.field === field ? { ...row, ...patch } : row)) });
  const removeRow = (field) => onChange({ ...filters, rows: filters.rows.filter((row) => row.field !== field) });
  const addRow = (field) => {
    onChange({ ...filters, rows: [...filters.rows, { field, op: 'is', values: [] }] });
    setAdding(false);
  };

  return (
    <div className={styles.wrapper} ref={rootRef}>
      <button
        type="button"
        className={`${styles.toggle} ${open || activeCount ? styles.toggleActive : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Filter problems"
        title="Filter"
      >
        <Icon name="filter" size={17} strokeWidth={1.9} />
        {activeCount > 0 && <span className={styles.badge}>{activeCount}</span>}
      </button>

      {open && (
        <div className={styles.panel} role="dialog" aria-label="Filters">
          <div className={styles.body}>
            <div className={styles.matchLine}>
              <span>Match</span>
              <div className={styles.matchSelect}>
                <Dropdown
                  label="Match"
                  value={filters.match}
                  options={MATCH_OPTIONS}
                  onChange={(match) => onChange({ ...filters, match })}
                  clearable={false}
                  fullWidth
                />
              </div>
              <span>of the following filters:</span>
            </div>

            {filters.rows.map((row) => {
              const field = fields[row.field];
              return (
                <div key={row.field} className={styles.row}>
                  <span className={styles.fieldName}>
                    <Icon name={field.icon} size={17} />
                    {field.label}
                  </span>
                  <div className={styles.operator}>
                    <Dropdown
                      label={`${field.label} operator`}
                      value={row.op}
                      options={OPERATOR_OPTIONS}
                      onChange={(op) => updateRow(row.field, { op })}
                      clearable={false}
                      fullWidth
                    />
                  </div>
                  <div className={styles.values}>
                    <MultiSelect
                      label={field.label}
                      values={row.values}
                      options={field.options}
                      onChange={(values) => updateRow(row.field, { values })}
                    />
                  </div>
                  <button
                    type="button"
                    className={styles.iconButton}
                    onClick={() => removeRow(row.field)}
                    aria-label={`Remove ${field.label} filter`}
                    title="Remove filter"
                  >
                    <Icon name="minus" size={16} strokeWidth={2} />
                  </button>
                </div>
              );
            })}

            {filters.rows.length === 0 && <p className={styles.empty}>No filters. Add one below.</p>}

            {missingFields.length > 0 && (
              <div className={styles.addWrap}>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => setAdding((a) => !a)}
                  aria-label="Add filter"
                  title="Add filter"
                >
                  <Icon name="plus" size={18} strokeWidth={2} />
                </button>
                {adding && (
                  <ul className={styles.addMenu}>
                    {missingFields.map((fieldId) => (
                      <li key={fieldId}>
                        <button type="button" onClick={() => addRow(fieldId)}>
                          <Icon name={fields[fieldId].icon} size={16} />
                          {fields[fieldId].label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.reset} onClick={onReset}>
              <Icon name="restart" size={16} strokeWidth={2} />
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
