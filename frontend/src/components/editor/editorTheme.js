// Monaco theme matching LeetCode's dark code editor (VS Dark colours on a #262626 panel).
export const EDITOR_THEME = 'repo-forge';

export function defineEditorTheme(monaco) {
  monaco.editor.defineTheme(EDITOR_THEME, {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#262626',
      'editor.foreground': '#d4d4d4',
      'editorGutter.background': '#262626',
      'editor.lineHighlightBackground': '#ffffff0a',
      'editor.lineHighlightBorder': '#00000000',
      'editorLineNumber.foreground': '#6e6e6e',
      'editorLineNumber.activeForeground': '#c6c6c6',
      'editorCursor.foreground': '#f5f5f5',
      'editor.selectionBackground': '#264f78',
      'editorIndentGuide.background1': '#ffffff12',
      'editorIndentGuide.activeBackground1': '#ffffff26',
      'editorWidget.background': '#303030',
      'editorWidget.border': '#ffffff1a',
      'scrollbarSlider.background': '#ffffff1a',
      'scrollbarSlider.hoverBackground': '#ffffff2a',
      'scrollbarSlider.activeBackground': '#ffffff33',
    },
  });
}

export function monoFontFamily() {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim();
  return value || 'Menlo, Monaco, Consolas, monospace';
}
