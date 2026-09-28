// Small inline SVG icon set (24x24 stroke icons), so the app needs no icon library.
const PATHS = {
  chevronRight: 'M9 6l6 6-6 6',
  code: 'M8.5 7l-5 5 5 5 M15.5 7l5 5-5 5',
  logout: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3 M10 17l5-5-5-5 M15 12H4',
  mail: 'M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z M3.5 7l8.5 6 8.5-6',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z M20 20l-4-4',
  history: 'M3 12a9 9 0 1 0 2.64-6.36 M3 4v5h5 M12 8v4l3 2',
  circleCheck: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z M8.5 12.2l2.4 2.4 4.6-5',
  circleDashed: 'M12 3a9 9 0 0 1 9 9 9 9 0 0 1-9 9 9 9 0 0 1-9-9 9 9 0 0 1 9-9z',
  panelBottom: 'M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z M4 14.5h16',
  panelRight: 'M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z M14.5 4v16',
  checkSquare: 'M5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-13A1.5 1.5 0 0 1 5.5 4z M8.5 12.2l2.4 2.4 4.6-5',
  list: 'M9 6h11 M9 12h11 M9 18h11 M4 6h1.5 M4 12h1.5 M4 18h1.5',
  description: 'M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z M9 12h6 M9 16h6 M9 8h2',
  tag: 'M3.5 12.3V4.5a1 1 0 0 1 1-1h7.8a1 1 0 0 1 .7.3l7.5 7.5a1 1 0 0 1 0 1.4l-7.8 7.8a1 1 0 0 1-1.4 0l-7.5-7.5a1 1 0 0 1-.3-.7z M8 8h.01',
  upload: 'M12 13v8 M8.5 16.5L12 13l3.5 3.5 M19.5 17.5A4.5 4.5 0 0 0 17 9h-1.2A6.5 6.5 0 1 0 5 15.3',
  folder: 'M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2h7.5A2.5 2.5 0 0 1 21 9.5v7a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5z',
  file: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z M14 3v5h5',
  lock: 'M6.5 11h11a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1z M8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  refresh: 'M20 11a8 8 0 1 0-2.34 5.66 M20 4v7h-7',
  restart: 'M3 12a9 9 0 1 0 2.64-6.36 M3 4v5h5',
  play: 'M7 5.5v13a.5.5 0 0 0 .77.42l10.2-6.5a.5.5 0 0 0 0-.84L7.77 5.08A.5.5 0 0 0 7 5.5z',
  send: 'M21 3L10 14 M21 3l-6.5 18-4.5-7-7-4.5z',
  terminal: 'M4 17l6-5-6-5 M12 19h8',
  logs: 'M9 6h11 M9 12h11 M9 18h11 M4.5 6h.01 M4.5 12h.01 M4.5 18h.01',
  beaker: 'M9 3h6 M10 3v6.5L4.6 18.2A2 2 0 0 0 6.3 21h11.4a2 2 0 0 0 1.7-2.8L14 9.5V3 M7 15h10',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  x: 'M6 6l12 12 M18 6L6 18',
  external: 'M14 4h6v6 M20 4l-9 9 M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5',
  globe: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z M3 12h18 M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z',
  alert: 'M12 9v4 M12 17h.01 M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z M12 7v5l3 2',
  box: 'M21 8l-9-5-9 5 9 5 9-5z M3 8v8l9 5 9-5V8 M12 13v8',
  files: 'M15 3H9a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7z M15 3v4h4 M7 7H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2',
};

export default function Icon({ name, size = 16, strokeWidth = 1.75, className, style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
