#!/usr/bin/env node

import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { Scanner } from './scanner';
import { Detector } from './detector';
import { Generator } from './generator';
import { Merger } from './merger';

const program = new Command();

program
  .name('smart-gitignore')
  .description('Smart .gitignore generator with automatic stack detection')
  .version('1.4.0')
  .option('-d, --dir <path>', 'Directory to scan (default: current directory)', process.cwd())
  .option('-f, --force', 'Overwrite existing .gitignore without merging', false)
  .option('-v, --verbose', 'Verbose mode', false)
  .option(
    '--depth <n>',
    'Scanner depth (1 = root only, >=2 enables monorepo/nested detection)',
    (v) => parseInt(v, 10),
    1,
  )
  .option('--timeout <ms>', 'HTTP timeout per request in ms', (v) => parseInt(v, 10), 8000)
  .option('--retries <n>', 'HTTP retry attempts', (v) => parseInt(v, 10), 2)
  .action(async (options) => {
    try {
      await run(options);
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

interface RunOptions {
  dir: string;
  force: boolean;
  verbose: boolean;
  depth: number;
  timeout: number;
  retries: number;
}

async function run(options: RunOptions) {
  const { dir, force, verbose, depth, timeout, retries } = options;
  const gitignorePath = path.join(dir, '.gitignore');

  if (verbose) {
    console.log(`📂 Scanning directory: ${dir} (depth=${depth})`);
  }

  const scanner = new Scanner(dir, { maxDepth: depth });
  const detector = new Detector(scanner);

  if (verbose) console.log('🔍 Detecting stacks...');

  const detectedStacks = detector.detectStacks();

  if (detectedStacks.length === 0) {
    console.log('⚠️  No stacks detected. Generating default .gitignore...');
  } else {
    console.log(`✅ Stacks detected: ${detectedStacks.join(', ')}`);
  }

  if (verbose) console.log('🌐 Fetching templates from GitHub/gitignore...');

  const generator = new Generator({
    requestTimeoutMs: timeout,
    retries,
  });
  const newContent = await generator.generate(detectedStacks);

  const merger = new Merger();
  let finalContent: string;

  if (fs.existsSync(gitignorePath) && !force) {
    if (verbose) console.log('🔄 Merging with existing .gitignore...');
    const existingContent = merger.readExisting(gitignorePath);
    finalContent = merger.merge(existingContent, newContent, detectedStacks);
    console.log('✅ .gitignore updated successfully!');
  } else {
    if (verbose && force) {
      console.log('⚠️  Force mode enabled, overwriting .gitignore...');
    }
    finalContent = merger.buildFreshFile(newContent, detectedStacks);
    console.log('✅ .gitignore created successfully!');
  }

  merger.write(gitignorePath, finalContent);

  if (verbose) console.log(`📝 File saved to: ${gitignorePath}`);
}

program.parse();
