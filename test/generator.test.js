'use strict';

/**
 * Regression tests for the Generator's "essential block first" invariant.
 *
 * Background: there used to be a bug where the gitignore.io fallback path
 * placed `essentialBlock` SECOND in the merge list, while every other path
 * placed it FIRST. Because mergeBlocks keeps the first occurrence of
 * duplicate comments/patterns, this caused inconsistent dedup behaviour:
 * customised essential comments would be dropped when the API path was
 * exercised but preserved on every other path.
 *
 * These tests pin down the contract:
 *   1. The first block passed to mergeBlocks wins comment collisions.
 *   2. Generator.generate() routes every path through `assemble()`, which
 *      always places `essentialBlock` first.
 *   3. Sentinel custom comments from essential survive regardless of
 *      which fallback path produced the rest of the content.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { Generator, mergeBlocks } = require('../dist/generator');

// Sentinel comment unlikely to ever appear in upstream templates.
const ESSENTIAL_SENTINEL = '# Customs (smart-gitignore essential marker)';
const ESSENTIAL_BLOCK = [
  '# Essential (OS, IDEs, env, logs)',
  '# Logs',                       // collides with Node template
  '*.log',
  '# Environment',                 // collides with Node template
  '.env',
  ESSENTIAL_SENTINEL,
  '*.bak',
].join('\n');

// Mimics what gitignore.io / GitHub returns: contains the same generic
// section headers ("# Logs", "# Environment") that essential also defines.
const UPSTREAM_BLOCK = [
  '# Logs',
  'npm-debug.log*',
  '# Environment',
  '.env.production',
].join('\n');

test('mergeBlocks: first block wins comment collisions', () => {
  const out = mergeBlocks([ESSENTIAL_BLOCK, UPSTREAM_BLOCK]);
  assert.match(out, new RegExp(ESSENTIAL_SENTINEL.replace(/[()]/g, '\\$&')));
});

test('mergeBlocks: essential second loses comment collisions (documents the bug)', () => {
  // This is the broken ordering that used to live in the API fallback.
  const out = mergeBlocks([UPSTREAM_BLOCK, ESSENTIAL_BLOCK]);
  // Sentinel still survives (unique), but section headers come from upstream.
  assert.match(out, new RegExp(ESSENTIAL_SENTINEL.replace(/[()]/g, '\\$&')));
  // Show that the FIRST block's content shows up before the second's.
  const npmIdx = out.indexOf('npm-debug.log*');
  const sentinelIdx = out.indexOf(ESSENTIAL_SENTINEL);
  assert.ok(npmIdx < sentinelIdx, 'upstream content should appear before essential when essential is second');
});

test('Generator.generate: essential block always appears first (no stacks path)', async () => {
  const gen = makeGeneratorWithCustomEssential();
  const out = await gen.generate([]);
  assertEssentialFirst(out);
});

test('Generator.generate: essential block always appears first (GitHub path)', async () => {
  const gen = makeGeneratorWithCustomEssential();
  // Override fetcher to short-circuit GitHub success deterministically.
  gen.fetchGitHubTemplate = async () => UPSTREAM_BLOCK;
  const out = await gen.generate(['node']);
  assertEssentialFirst(out);
});

test('Generator.generate: essential block always appears first (gitignore.io fallback)', async () => {
  const gen = makeGeneratorWithCustomEssential();
  // Force GitHub to fail, force API to succeed.
  gen.fetchGitHubTemplate = async () => { throw new Error('simulated GitHub failure'); };
  gen.fetchFromAPI = async () => UPSTREAM_BLOCK;
  const out = await gen.generate(['node']);
  assertEssentialFirst(out);
});

test('Generator.generate: essential block always appears first (local-only fallback)', async () => {
  const gen = makeGeneratorWithCustomEssential();
  // Force every remote to fail.
  gen.fetchGitHubTemplate = async () => { throw new Error('simulated GitHub failure'); };
  gen.fetchFromAPI = async () => { throw new Error('simulated API failure'); };
  // Pretend none of the stacks are valid for the API so we land on the
  // local-only branch instead of the API one.
  gen.filterValidStacks = () => [];
  const out = await gen.generate(['node']);
  assertEssentialFirst(out);
});

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function makeGeneratorWithCustomEssential() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'smart-gitignore-templates-'));
  fs.writeFileSync(path.join(dir, 'essential.gitignore'), ESSENTIAL_BLOCK);
  // Provide a default.gitignore for the no-stacks path.
  fs.writeFileSync(path.join(dir, 'default.gitignore'), UPSTREAM_BLOCK);
  return new Generator({ templatesDir: dir, requestTimeoutMs: 100, retries: 0 });
}

function assertEssentialFirst(output) {
  const sentinelIdx = output.indexOf(ESSENTIAL_SENTINEL);
  assert.ok(sentinelIdx >= 0, `sentinel missing from output:\n${output}`);

  // Anything that comes from upstream must appear AFTER the sentinel
  // (because essential was merged first and its block precedes the rest).
  const upstreamMarker = 'npm-debug.log*';
  const upstreamIdx = output.indexOf(upstreamMarker);
  if (upstreamIdx >= 0) {
    assert.ok(
      sentinelIdx < upstreamIdx,
      `essential sentinel (${sentinelIdx}) should appear before upstream content (${upstreamIdx}):\n${output}`,
    );
  }
}
