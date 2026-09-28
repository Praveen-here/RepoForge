export default function Logo({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="rf-logo-orange" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffb940" />
          <stop offset="100%" stopColor="#f08c00" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="8" fill="url(#rf-logo-orange)" />
      <path
        d="M11 11l-4 5 4 5 M21 11l4 5-4 5 M17.5 9l-3 14"
        fill="none"
        stroke="#1a1a1a"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
