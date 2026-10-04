// Problem-list filters, modelled on LeetCode's filter panel:
//   "Match [all | any] of the following filters"
//   each row: <field> <is | is not> <one or more values>
// Rows with no values selected are ignored.

export const FILTER_FIELDS = ['difficulty', 'framework'];

export function createFilters() {
  return {
    match: 'all',
    rows: FILTER_FIELDS.map((field) => ({ field, op: 'is', values: [] })),
  };
}

export function activeRows(filters) {
  return filters.rows.filter((row) => row.values.length > 0);
}

/** Does this problem pass the filters? */
export function matchesFilters(problem, filters) {
  const rows = activeRows(filters);
  if (rows.length === 0) return true;

  const results = rows.map((row) => {
    const hit = row.values.includes(problem[row.field]);
    return row.op === 'is' ? hit : !hit;
  });
  return filters.match === 'all' ? results.every(Boolean) : results.some(Boolean);
}
