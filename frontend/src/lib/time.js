/** "just now", "5 min ago", "3 hr ago", "2 days ago", or a date for older times. */
export function timeAgo(isoDate) {
  const seconds = Math.round((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  if (seconds < 7 * 86400) {
    const days = Math.floor(seconds / 86400);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }
  return formatDate(isoDate);
}

/** "Oct 4, 2026" */
export function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
