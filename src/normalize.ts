/**
 * Pattern normalization shared by Generator and Merger.
 *
 * Goal: produce a canonical form of a .gitignore line so that semantically
 * equivalent rules collapse to the same key during deduplication.
 *
 * Examples (all collapse to the same key):
 *   node_modules     ->  node_modules
 *   node_modules/    ->  node_modules
 *   /node_modules    ->  node_modules
 *   /node_modules/   ->  node_modules
 *   **\u002fnode_modules/ ->  node_modules
 *
 * Negation is preserved so `!.env.example` does NOT collide with `.env.example`.
 * Comments are normalized separately so that `# Logs` and `#  logs` collapse.
 */

export type NormalizedKey = string;

/**
 * Returns a canonical key used only for comparison.
 * Returns null if the line is blank (caller decides what to do).
 */
export function normalizePattern(line: string): NormalizedKey | null {
  const raw = line.replace(/\r$/, '').trim();
  if (raw === '') return null;

  if (raw.startsWith('#')) {
    // Normalize comments: collapse internal whitespace, lowercase
    const text = raw.replace(/^#+\s*/, '').replace(/\s+/g, ' ').toLowerCase();
    return `#${text}`;
  }

  let s = raw;

  const negation = s.startsWith('!');
  if (negation) s = s.slice(1);

  // Strip leading "./" or "/" (anchor at root has no semantic effect for dedup)
  s = s.replace(/^\.?\//, '');
  // Strip leading globstar prefix "**/"
  while (s.startsWith('**/')) s = s.slice(3);
  // Strip trailing slash(es)
  s = s.replace(/\/+$/, '');
  // Collapse internal duplicate slashes
  s = s.replace(/\/+/g, '/');

  return (negation ? '!' : '') + s.toLowerCase();
}

/**
 * Returns true when the line is a comment (after trimming).
 */
export function isComment(line: string): boolean {
  return line.trim().startsWith('#');
}

/**
 * Returns true when the line is blank.
 */
export function isBlank(line: string): boolean {
  return line.trim() === '';
}
