'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { mergeBlocks } = require('../dist/generator');
const { normalizePattern } = require('../dist/normalize');

test('normalizePattern: trailing slash variants collapse', () => {
  assert.strictEqual(normalizePattern('node_modules'), normalizePattern('node_modules/'));
  assert.strictEqual(normalizePattern('node_modules/'), normalizePattern('/node_modules/'));
  assert.strictEqual(normalizePattern('/node_modules'), normalizePattern('**/node_modules/'));
});

test('normalizePattern: negation kept distinct', () => {
  assert.notStrictEqual(normalizePattern('.env.example'), normalizePattern('!.env.example'));
});

test('normalizePattern: case-insensitive', () => {
  assert.strictEqual(normalizePattern('Node_Modules/'), normalizePattern('node_modules'));
});

test('normalizePattern: comments collapse on whitespace and case', () => {
  assert.strictEqual(normalizePattern('# Logs'), normalizePattern('#  logs'));
  assert.strictEqual(normalizePattern('# IDEs'), normalizePattern('#ides'));
});

test('normalizePattern: blank line returns null', () => {
  assert.strictEqual(normalizePattern(''), null);
  assert.strictEqual(normalizePattern('   '), null);
});

test('mergeBlocks: dedupes trailing-slash variants', () => {
  const out = mergeBlocks([
    '# Cache\n.cache',
    '# Cache\n.cache/',
  ]);
  // Only one `.cache` entry should survive.
  const matches = out.match(/^\.cache\/?$/gm) ?? [];
  assert.strictEqual(matches.length, 1, `expected 1 cache rule, got ${matches.length} in:\n${out}`);
});

test('mergeBlocks: dedupes section-header comments across templates', () => {
  const out = mergeBlocks([
    '# Logs\n*.log',
    '# Logs\nyarn-debug.log*',
  ]);
  const matches = out.match(/^# Logs$/gm) ?? [];
  assert.strictEqual(matches.length, 1);
  assert.match(out, /\*\.log/);
  assert.match(out, /yarn-debug\.log\*/);
});

test('mergeBlocks: collapses redundant blank lines', () => {
  const out = mergeBlocks(['a\n\n\n\nb', 'c']);
  assert.ok(!out.includes('\n\n\n'), `unexpected triple newline in:\n${out}`);
});

test('mergeBlocks: preserves negation patterns', () => {
  const out = mergeBlocks(['*.env\n!.env.example']);
  assert.match(out, /\*\.env/);
  assert.match(out, /!\.env\.example/);
});
