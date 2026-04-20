'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { Scanner } = require('../dist/scanner');
const { Detector } = require('../dist/detector');

function makeFixture(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'smart-gitignore-'));
  for (const rel of files) {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, '');
  }
  return dir;
}

function detect(files, options = {}) {
  const dir = makeFixture(files);
  const scanner = new Scanner(dir, options);
  return new Detector(scanner).detectStacks();
}

test('Detector: package.json -> node', () => {
  const stacks = detect(['package.json']);
  assert.ok(stacks.includes('node'));
});

test('Detector: pom.xml -> java + maven', () => {
  const stacks = detect(['pom.xml']);
  assert.ok(stacks.includes('java'));
  assert.ok(stacks.includes('maven'));
});

test('Detector: .csproj detected via extension (regression)', () => {
  const stacks = detect(['MyApp.csproj']);
  assert.ok(stacks.includes('visualstudio'));
  assert.ok(stacks.includes('csharp'));
});

test('Detector: .sln detected via extension (regression)', () => {
  const stacks = detect(['MyApp.sln']);
  assert.ok(stacks.includes('visualstudio'));
});

test('Detector: AI tooling detected', () => {
  const stacks = detect([
    '.cursorrules',
    'CLAUDE.md',
    '.aider.conf.yml',
    'AGENTS.md',
    '.windsurfrules',
  ]);
  assert.ok(stacks.includes('cursor'));
  assert.ok(stacks.includes('claude'));
  assert.ok(stacks.includes('aider'));
  assert.ok(stacks.includes('codex'));
  assert.ok(stacks.includes('windsurf'));
  assert.ok(stacks.includes('ai'));
});

test('Detector: nested AI artifacts detected via existence check', () => {
  const stacks = detect([
    '.cursor/rules/main.md',
    '.github/copilot-instructions.md',
  ]);
  assert.ok(stacks.includes('cursor'));
  assert.ok(stacks.includes('copilot'));
  assert.ok(stacks.includes('ai'));
});

test('Scanner: shallow by default (no detection inside subdirs)', () => {
  const stacks = detect(['apps/web/package.json']);
  // With depth=1 we do NOT detect package.json deep inside apps/web/.
  assert.ok(!stacks.includes('node'), `unexpected node detection at depth=1: ${stacks}`);
});

test('Scanner: depth=3 enables monorepo detection', () => {
  const stacks = detect(['apps/web/package.json', 'services/api/Cargo.toml'], { maxDepth: 3 });
  assert.ok(stacks.includes('node'));
  assert.ok(stacks.includes('rust'));
});

test('Scanner: ignores heavy default dirs even with deep scan', () => {
  const dir = makeFixture(['node_modules/some-pkg/package.json']);
  const scanner = new Scanner(dir, { maxDepth: 5 });
  const found = scanner.scan();
  // node_modules should appear (root-level entry) but its contents should not.
  assert.ok(found.includes('node_modules'));
  assert.ok(!found.some(f => f.startsWith('node_modules/')),
    `expected no recursion into node_modules, got: ${found.join(', ')}`);
});
