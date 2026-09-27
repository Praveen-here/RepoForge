// Monaco colour theme matching the RepoForge palette.
export const EDITOR_THEME = 'repo-forge';

export function defineEditorTheme(monaco) {
  monaco.editor.defineTheme(EDITOR_THEME, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '5d6576', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'c79bf2' },
      { token: 'string', foreground: 'b5d68c' },
      { token: 'number', foreground: 'f0a46c' },
      { token: 'type', foreground: 'e6c27a' },
      { token: 'delimiter', foreground: '9aa3b5' },
      { token: 'identifier', foreground: 'dfe3ea' },
    ],
    colors: {
      'editor.background': '#0f1218',
      'editor.foreground': '#dfe3ea',
      'editor.lineHighlightBackground': '#151a23',
      'editor.lineHighlightBorder': '#00000000',
      'editorLineNumber.foreground': '#394152',
      'editorLineNumber.activeForeground': '#c9a45c',
      'editorCursor.foreground': '#ddb96f',
      'editor.selectionBackground': '#2b3345',
      'editor.inactiveSelectionBackground': '#222938',
      'editorIndentGuide.background1': '#1b202b',
      'editorIndentGuide.activeBackground1': '#2e3647',
      'editorWhitespace.foreground': '#232a36',
      'editorGutter.background': '#0f1218',
      'editorWidget.background': '#141821',
      'editorWidget.border': '#222834',
      'editorBracketHighlight.foreground1': '#d4b06a',
      'editorBracketHighlight.foreground2': '#c79bf2',
      'editorBracketHighlight.foreground3': '#78a9f5',
      'editorBracketMatch.background': '#c9a45c1f',
      'editorBracketMatch.border': '#c9a45c66',
      'scrollbarSlider.background': '#ffffff12',
      'scrollbarSlider.hoverBackground': '#ffffff22',
      'scrollbarSlider.activeBackground': '#ffffff2e',
    },
  });
}

export function monoFontFamily() {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim();
  return value ? `${value}, Consolas, monospace` : 'Consolas, monospace';
}
