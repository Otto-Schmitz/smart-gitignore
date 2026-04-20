import * as fs from 'fs';
import * as path from 'path';
import { getAllowedHiddenNames, getAllowedHiddenPrefixes } from './stacks';

export interface ScannerOptions {
  /**
   * How deep to walk from rootDir. 1 = root only (default).
   * Use a value >=2 to detect nested project files (e.g. monorepos).
   */
  maxDepth?: number;
  /**
   * Directory basenames to skip when recursing. Combined with the built-in
   * defaults (node_modules, .git, dist, build, ...).
   */
  ignoreDirs?: string[];
}

/**
 * Default directory basenames that should never be recursed into.
 * They tend to be huge and never carry stack-detection signals.
 */
const DEFAULT_IGNORE_DIRS = new Set<string>([
  '.git',
  'node_modules',
  'bower_components',
  'jspm_packages',
  'vendor',
  'dist',
  'build',
  'out',
  '.next',
  '.nuxt',
  '.svelte-kit',
  '.turbo',
  '.cache',
  '.parcel-cache',
  '.vite',
  '.output',
  'coverage',
  '.nyc_output',
  '.venv',
  'venv',
  '__pycache__',
  '.tox',
  '.gradle',
  '.terraform',
  'target', // rust/maven build dir
]);

/**
 * Scans the directory tree looking for files and directories
 * that indicate the project's technology stack.
 *
 * Default behaviour is a shallow root scan (maxDepth=1), preserving the
 * historical contract. Bumping maxDepth enables monorepo-friendly detection.
 */
export class Scanner {
  private readonly rootDir: string;
  private readonly maxDepth: number;
  private readonly ignoreDirs: Set<string>;
  private readonly allowedHidden: Set<string>;
  private readonly allowedHiddenPrefixes: string[];

  constructor(rootDir: string = process.cwd(), opts: ScannerOptions = {}) {
    this.rootDir = rootDir;
    this.maxDepth = Math.max(1, opts.maxDepth ?? 1);
    this.ignoreDirs = new Set([...DEFAULT_IGNORE_DIRS, ...(opts.ignoreDirs ?? [])]);
    this.allowedHidden = getAllowedHiddenNames();
    this.allowedHiddenPrefixes = getAllowedHiddenPrefixes();
  }

  /**
   * Returns scanned entry names. With maxDepth=1 these are basenames of root.
   * With maxDepth>=2 nested entries are returned as posix-style relative paths
   * (e.g. "apps/web/package.json"). Detector uses both basename and full path.
   */
  public scan(): string[] {
    const found: string[] = [];
    try {
      this.walk(this.rootDir, '', 1, found);
    } catch (error) {
      throw new Error(`Error scanning directory: ${error}`);
    }
    return found;
  }

  private walk(absDir: string, relDir: string, depth: number, out: string[]): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(absDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const name = entry.name;
      const isHidden = name.startsWith('.');

      if (isHidden &&
          !this.allowedHidden.has(name) &&
          !this.allowedHiddenPrefixes.some(p => name.startsWith(p))) {
        continue;
      }

      const relPath = relDir ? `${relDir}/${name}` : name;
      out.push(relPath);

      if (entry.isDirectory() && depth < this.maxDepth) {
        if (this.ignoreDirs.has(name)) continue;
        this.walk(path.join(absDir, name), relPath, depth + 1, out);
      }
    }
  }

  /**
   * Checks if a file or directory exists at a path relative to root.
   */
  public exists(fileOrDir: string): boolean {
    const fullPath = path.join(this.rootDir, fileOrDir);
    return fs.existsSync(fullPath);
  }

  /**
   * Returns the full path of a file or directory relative to root.
   */
  public getFullPath(fileOrDir: string): string {
    return path.join(this.rootDir, fileOrDir);
  }
}
