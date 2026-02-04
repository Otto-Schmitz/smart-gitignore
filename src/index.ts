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
  .version('1.1.0')
  .option('-d, --dir <path>', 'Directory to scan (default: current directory)', process.cwd())
  .option('-f, --force', 'Overwrite existing .gitignore without merging', false)
  .option('-v, --verbose', 'Verbose mode', false)
  .action(async (options) => {
    try {
      await run(options);
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

async function run(options: { dir: string; force: boolean; verbose: boolean }) {
  const { dir, force, verbose } = options;
  const gitignorePath = path.join(dir, '.gitignore');

  if (verbose) {
    console.log(`📂 Scanning directory: ${dir}`);
  }

  // 1. Scan directory
  const scanner = new Scanner(dir);
  const detector = new Detector(scanner);

  if (verbose) {
    console.log('🔍 Detecting stacks...');
  }

  // 2. Detect stacks
  const detectedStacks = detector.detectStacks();

  if (detectedStacks.length === 0) {
    console.log('⚠️  No stacks detected. Generating default .gitignore...');
  } else {
    console.log(`✅ Stacks detected: ${detectedStacks.join(', ')}`);
  }

  // 3. Generate content
  if (verbose) {
    console.log('🌐 Fetching templates from GitHub/gitignore...');
  }

  const generator = new Generator();
  const newContent = await generator.generate(detectedStacks);

  // 4. Merge if necessary
  const merger = new Merger();
  let finalContent: string;

  if (fs.existsSync(gitignorePath) && !force) {
    if (verbose) {
      console.log('🔄 Merging with existing .gitignore...');
    }
    const existingContent = merger.readExisting(gitignorePath);
    finalContent = merger.merge(existingContent, newContent, detectedStacks);
    console.log('✅ .gitignore updated successfully!');
  } else {
    if (verbose && force) {
      console.log('⚠️  Force mode enabled, overwriting .gitignore...');
    }
    const header = merger.generateHeader(detectedStacks);
    finalContent = header + newContent;
    console.log('✅ .gitignore created successfully!');
  }

  // 5. Write file
  merger.write(gitignorePath, finalContent);

  if (verbose) {
    console.log(`📝 File saved to: ${gitignorePath}`);
  }
}

program.parse();

