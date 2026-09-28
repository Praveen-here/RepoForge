// A small Markdown-to-HTML converter for problem READMEs.
// Supports headings, paragraphs, bold/italic, inline code, code blocks and (nested) lists.
// All text is HTML-escaped before formatting is applied, so the output is safe to render.

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function inline(text) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
}

function renderList(list) {
  const items = list.items
    .map((item) => {
      const children = item.children.length
        ? `<ul>${item.children.map((child) => `<li>${inline(child)}</li>`).join('')}</ul>`
        : '';
      return `<li>${inline(item.text)}${children}</li>`;
    })
    .join('');
  return `<${list.type}>${items}</${list.type}>`;
}

/** skipTitle: drop the first "# Heading" (the page already shows the title). */
export function markdownToHtml(markdown, { skipTitle = false } = {}) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let paragraph = [];
  let list = null;
  let skippedTitle = !skipTitle;

  const flushParagraph = () => {
    if (paragraph.length) out.push(`<p>${inline(paragraph.join(' '))}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (list) out.push(renderList(list));
    list = null;
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (line.startsWith('```')) {
      flushParagraph();
      flushList();
      const code = [];
      for (i += 1; i < lines.length && !lines[i].startsWith('```'); i += 1) code.push(lines[i]);
      out.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      if (level === 1 && !skippedTitle) {
        skippedTitle = true;
      } else {
        out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      }
      continue;
    }

    const item = /^(\s*)([-*]|\d+\.)\s+(.*)$/.exec(line);
    if (item) {
      flushParagraph();
      const [, indent, marker, text] = item;
      if (indent.length >= 2 && list) {
        list.items[list.items.length - 1].children.push(text);
        continue;
      }
      const type = /\d/.test(marker) ? 'ol' : 'ul';
      if (list && list.type !== type) flushList();
      if (!list) list = { type, items: [] };
      list.items.push({ text, children: [] });
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      continue;
    }

    flushList();
    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();
  return out.join('\n');
}
