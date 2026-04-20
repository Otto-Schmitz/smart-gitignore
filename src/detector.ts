import { Scanner } from './scanner';
import {
  buildFileDetectionMap,
  buildExtensionDetectionMap,
  buildNestedPathDetectionMap,
  getRegexDetections,
} from './stacks';

/**
 * Maps scanned files/directories to technology stacks using the central
 * STACKS registry as single source of truth.
 */
export class Detector {
  private readonly scanner: Scanner;

  private readonly fileMap = buildFileDetectionMap();
  private readonly extMap = buildExtensionDetectionMap();
  private readonly nestedMap = buildNestedPathDetectionMap();
  private readonly regexRules = getRegexDetections();

  constructor(scanner: Scanner) {
    this.scanner = scanner;
  }

  /**
   * Detects all stacks based on found files (root + optional shallow tree).
   */
  public detectStacks(): string[] {
    const foundFiles = this.scanner.scan();
    const detected = new Set<string>();

    for (const file of foundFiles) {
      // Exact filename match (root scan or recursive basename)
      const base = file.split('/').pop() as string;
      const fileStacks = this.fileMap.get(base);
      if (fileStacks) fileStacks.forEach(s => detected.add(s));

      // Extension match
      const dotIdx = base.lastIndexOf('.');
      if (dotIdx > 0) {
        const ext = base.slice(dotIdx).toLowerCase();
        const extStacks = this.extMap.get(ext);
        if (extStacks) extStacks.forEach(s => detected.add(s));
      }

      // Regex rules (e.g. /^\.aider/)
      for (const { pattern, stacks } of this.regexRules) {
        if (pattern.test(base)) stacks.forEach(s => detected.add(s));
      }
    }

    // Nested existence checks (do not require recursion)
    for (const [relPath, stacks] of this.nestedMap.entries()) {
      if (this.scanner.exists(relPath)) {
        stacks.forEach(s => detected.add(s));
      }
    }

    return Array.from(detected).sort();
  }

  /**
   * Returns the file detection mapping (useful for debugging/tests).
   */
  public getDetectionMap(): Map<string, string[]> {
    return new Map(this.fileMap);
  }
}
