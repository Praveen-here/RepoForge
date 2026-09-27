const LANGUAGES = {
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  json: 'json',
  md: 'markdown',
  css: 'css',
  html: 'html',
  yml: 'yaml',
  yaml: 'yaml',
  py: 'python',
  java: 'java',
  xml: 'xml',
};

export function extensionOf(path) {
  const name = path.split('/').pop();
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
}

export function fileName(path) {
  return path.split('/').pop();
}

export function languageFor(path) {
  return LANGUAGES[extensionOf(path)] || 'plaintext';
}

export function languageLabel(path) {
  const language = languageFor(path);
  if (language === 'plaintext') return 'Plain Text';
  if (language === 'javascript') return 'JavaScript';
  if (language === 'typescript') return 'TypeScript';
  if (language === 'json') return 'JSON';
  if (language === 'css' || language === 'html' || language === 'xml' || language === 'yaml') {
    return language.toUpperCase();
  }
  return language.charAt(0).toUpperCase() + language.slice(1);
}

/** Directories to expand when the explorer first loads. */
export function initialExpanded(tree, editableDirs) {
  const expanded = new Set(tree.filter((node) => node.type === 'directory').map((node) => node.path));
  for (const dir of editableDirs) {
    const parts = dir.split('/');
    for (let i = 1; i <= parts.length; i += 1) expanded.add(parts.slice(0, i).join('/'));
  }
  return expanded;
}
