// The last line of defence: every reply is checked here before the user can see it.
//
// A prompt alone can be talked around, so this check is plain code. It compares the reply
// with solution.patch, which stays on the server and is never sent to the model.

const MAX_CODE_BLOCK_LINES = 5;
const MIN_LINE_LENGTH = 8;
const MIN_TOKEN_LENGTH = 3;

// Everyday code words that appear in almost any explanation, so they prove nothing.
const COMMON_WORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'new', 'true', 'false', 'null', 'none', 'undefined',
  'self', 'this', 'def', 'class', 'public', 'private', 'static', 'void', 'for', 'while', 'try', 'catch',
  'except', 'throw', 'raise', 'error', 'err', 'and', 'not', 'else', 'elif', 'string', 'int', 'list',
]);

// Spacing and quote style don't change what a piece of code means.
const squeeze = (text) => text.replace(/\s+/g, '').replace(/["`]/g, "'");
const words = (text) => text.match(/[A-Za-z_]\w*/g) || [];
const isComment = (line) => /^\s*(\/\/|#|\/\*|\*)/.test(line);

/** Turns solution.patch into the things a reply must not contain. */
export function parseSolutionPatch(patch) {
  const added = [];
  const existing = [];

  for (const line of patch.split(/\r?\n/)) {
    if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) continue;
    const code = line.slice(1).replace(/\s(\/\/|#)\s.*$/, ''); // drop trailing comments
    if (line.startsWith('+')) {
      if (!isComment(code)) added.push(code);
    } else if (line.startsWith('-') || line.startsWith(' ')) {
      existing.push(code);
    }
  }

  const existingWords = new Set(existing.flatMap(words));
  const fixTokens = new Set(
    added
      .flatMap(words)
      .filter((word) => word.length >= MIN_TOKEN_LENGTH && !existingWords.has(word) && !COMMON_WORDS.has(word)),
  );

  return {
    // Without the final ; or , so the same line still matches when it is written without them.
    lines: added.map((line) => squeeze(line).replace(/[;,]+$/, '')).filter((line) => line.length >= MIN_LINE_LENGTH),
    fixTokens,
  };
}

function codeFragments(reply) {
  const blocks = [...reply.matchAll(/```[^\n]*\n([\s\S]*?)(?:```|$)/g)].map((match) => match[1]);
  const withoutBlocks = reply.replace(/```[\s\S]*?(?:```|$)/g, '');
  const spans = [...withoutBlocks.matchAll(/`([^`\n]+)`/g)].map((match) => match[1]);
  return { blocks, spans };
}

/**
 * Returns why a reply gives away too much, or null if it is fine.
 *
 * The user's own code earns no exception here. The fix can already appear elsewhere in the
 * buggy code (problem 5 calls book.save() in return_book), so finding it there proves nothing.
 * A false alarm only costs a vaguer reply; a miss gives the answer away.
 */
export function findLeak(reply, solution) {
  const { blocks, spans } = codeFragments(reply);

  if (blocks.some((block) => block.trim().split('\n').length > MAX_CODE_BLOCK_LINES)) {
    return 'it contains a long code block';
  }
  if (!solution) return null;

  const squeezedReply = squeeze(reply);
  if (solution.lines.some((line) => squeezedReply.includes(line))) {
    return 'it contains a line of the fix';
  }

  const tokens = [...solution.fixTokens];
  const codeWords = new Set([...blocks, ...spans].flatMap(words));
  if (tokens.some((token) => codeWords.has(token))) {
    return 'it shows code that belongs to the fix';
  }
  // Also catches calls written in plain text, e.g. "just call .save() afterwards".
  if (tokens.some((token) => new RegExp(`(^|[^\\w])${token}\\(`).test(reply))) {
    return 'it names a call that belongs to the fix';
  }
  return null;
}
