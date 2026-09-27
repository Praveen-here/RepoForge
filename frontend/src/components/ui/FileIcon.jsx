import { extensionOf } from '@/lib/files';
import Icon from './Icon';

// Small coloured badges per file type, in the spirit of VS Code file icons.
const BADGES = {
  js: { label: 'JS', color: '#e8c95c' },
  mjs: { label: 'JS', color: '#e8c95c' },
  cjs: { label: 'JS', color: '#e8c95c' },
  jsx: { label: 'JSX', color: '#6fc3df' },
  ts: { label: 'TS', color: '#5a9bea' },
  tsx: { label: 'TSX', color: '#5a9bea' },
  json: { label: '{ }', color: '#9bc76b' },
  md: { label: 'M↓', color: '#78a9f5' },
  css: { label: '#', color: '#b58cf0' },
  html: { label: '</>', color: '#ea8a5b' },
  yml: { label: 'Y', color: '#d9777f' },
  yaml: { label: 'Y', color: '#d9777f' },
  py: { label: 'PY', color: '#6ea8d8' },
  java: { label: 'J', color: '#e0876a' },
};

export default function FileIcon({ path, size = 16 }) {
  const badge = BADGES[extensionOf(path)];

  if (!badge) {
    return <Icon name="file" size={size - 1} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />;
  }

  return (
    <span
      style={{
        width: size,
        flexShrink: 0,
        textAlign: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: badge.label.length > 2 ? 7.5 : 9,
        fontWeight: 700,
        letterSpacing: '-0.02em',
        color: badge.color,
      }}
    >
      {badge.label}
    </span>
  );
}
