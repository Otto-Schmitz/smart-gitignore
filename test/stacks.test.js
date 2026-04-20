'use strict';

const test = require('node:test');
const assert = require('node:assert');

const {
  STACKS,
  buildFileDetectionMap,
  buildExtensionDetectionMap,
  getValidApiStacks,
  getStack,
  getAllowedHiddenNames,
} = require('../dist/stacks');

test('STACKS: every entry has a unique name', () => {
  const seen = new Set();
  for (const s of STACKS) {
    assert.ok(s.name, 'stack must have a name');
    assert.ok(!seen.has(s.name), `duplicate stack name: ${s.name}`);
    seen.add(s.name);
  }
});

test('buildFileDetectionMap: pom.xml triggers java + maven', () => {
  const map = buildFileDetectionMap();
  const stacks = map.get('pom.xml');
  assert.ok(stacks);
  assert.ok(stacks.includes('java'));
  assert.ok(stacks.includes('maven'));
});

test('buildExtensionDetectionMap: .csproj triggers visualstudio + csharp', () => {
  const map = buildExtensionDetectionMap();
  const stacks = map.get('.csproj');
  assert.ok(stacks);
  assert.ok(stacks.includes('visualstudio'));
  assert.ok(stacks.includes('csharp'));
});

test('getValidApiStacks: includes node, java, python', () => {
  const valid = getValidApiStacks();
  assert.ok(valid.has('node'));
  assert.ok(valid.has('java'));
  assert.ok(valid.has('python'));
});

test('getValidApiStacks: excludes ai/cursor/claude (not on gitignore.io)', () => {
  const valid = getValidApiStacks();
  assert.ok(!valid.has('ai'));
  assert.ok(!valid.has('cursor'));
  assert.ok(!valid.has('claude'));
});

test('getStack: case insensitive lookup', () => {
  assert.ok(getStack('NODE'));
  assert.ok(getStack('  Java  '));
  assert.strictEqual(getStack('nonexistent'), undefined);
});

test('getAllowedHiddenNames: includes essential hidden entries', () => {
  const allowed = getAllowedHiddenNames();
  assert.ok(allowed.has('.env'));
  assert.ok(allowed.has('.cursor'));
  assert.ok(allowed.has('.claude'));
  assert.ok(allowed.has('.github'));
});
