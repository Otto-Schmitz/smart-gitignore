import * as fs from 'fs';
import * as path from 'path';

/**
 * Scans the current directory looking for files and directories
 * that indicate the project's technology stack
 */
export class Scanner {
  private readonly rootDir: string;

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
  }

  /**
   * Scans the directory and returns list of found files
   */
  public scan(): string[] {
    const foundFiles: string[] = [];
    
    try {
      const entries = fs.readdirSync(this.rootDir, { withFileTypes: true });
      
      // List of hidden files/directories that should be included for detection
      const allowedHiddenFiles = [
        '.env', '.env.local', '.env.development', '.env.production',
        '.idea', '.vscode', '.dockerignore', '.ruby-version',
        '.eclipse', '.settings', '.project', '.classpath'
      ];
      
      for (const entry of entries) {
        const fullPath = path.join(this.rootDir, entry.name);
        
        // Ignore hidden files (except those important for detection)
        if (entry.name.startsWith('.') && 
            !allowedHiddenFiles.includes(entry.name)) {
          continue;
        }
        
        if (entry.isDirectory()) {
          foundFiles.push(entry.name);
        } else if (entry.isFile()) {
          foundFiles.push(entry.name);
        }
      }
    } catch (error) {
      throw new Error(`Error scanning directory: ${error}`);
    }
    
    return foundFiles;
  }

  /**
   * Checks if a file or directory exists
   */
  public exists(fileOrDir: string): boolean {
    const fullPath = path.join(this.rootDir, fileOrDir);
    return fs.existsSync(fullPath);
  }

  /**
   * Returns the full path of a file or directory
   */
  public getFullPath(fileOrDir: string): string {
    return path.join(this.rootDir, fileOrDir);
  }
}

