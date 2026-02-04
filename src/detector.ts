import { Scanner } from './scanner';

/**
 * Maps found files and directories to technology stacks
 */
export class Detector {
  private readonly scanner: Scanner;

  // Mapping of files/directories to stacks
  private readonly detectionMap: Map<string, string[]> = new Map([
    // Java & Build Tools
    ['pom.xml', ['java', 'maven']],
    ['build.gradle', ['gradle']],
    ['build.gradle.kts', ['gradle']],
    ['settings.gradle', ['gradle']],
    ['settings.gradle.kts', ['gradle']],
    ['gradlew', ['gradle']],
    ['gradlew.bat', ['gradle']],
    
    // Node.js
    ['package.json', ['node']],
    ['yarn.lock', ['node', 'yarn']],
    ['pnpm-lock.yaml', ['node']], // pnpm is not a valid stack in API, but node covers it
    ['package-lock.json', ['node']], // npm is not a valid stack in API, but node covers it
    ['node_modules', ['node']],
    
    // Docker
    ['Dockerfile', ['docker']],
    ['docker-compose.yml', ['docker']],
    ['docker-compose.yaml', ['docker']],
    ['.dockerignore', ['docker']],
    
    // Ruby
    ['Gemfile', ['ruby']],
    ['Gemfile.lock', ['ruby']],
    ['.ruby-version', ['ruby']],
    ['Rakefile', ['ruby']],
    
    // Python
    ['requirements.txt', ['python']],
    ['Pipfile', ['python']],
    ['Pipfile.lock', ['python']],
    ['pyproject.toml', ['python']],
    ['setup.py', ['python']],
    ['manage.py', ['python', 'django']],
    
    // IDEs
    ['.idea', ['intellij']],
    ['.vscode', ['vscode']],
    ['.eclipse', ['eclipse']],
    ['.settings', ['eclipse']],
    ['.project', ['eclipse']],
    ['.classpath', ['eclipse']],
    
    // Outros
    ['.env', ['dotenv']],
    ['.env.local', ['dotenv']],
    ['.env.development', ['dotenv']],
    ['.env.production', ['dotenv']],
    
    // Go
    ['go.mod', ['go']],
    ['go.sum', ['go']],
    
    // Rust
    ['Cargo.toml', ['rust']],
    ['Cargo.lock', ['rust']],
    
    // PHP
    ['composer.json', ['php', 'composer']],
    ['composer.lock', ['php', 'composer']],
    
    // .NET
    ['.csproj', ['visualstudio']],
    ['.sln', ['visualstudio']],
    ['project.json', ['visualstudio']],
  ]);

  constructor(scanner: Scanner) {
    this.scanner = scanner;
  }

  /**
   * Detects all stacks based on found files
   */
  public detectStacks(): string[] {
    const foundFiles = this.scanner.scan();
    const detectedStacks: Set<string> = new Set();

    for (const file of foundFiles) {
      const stacks = this.detectionMap.get(file);
      if (stacks) {
        stacks.forEach(stack => detectedStacks.add(stack));
      }
    }

    // Additional detections based on patterns
    this.detectByPattern(foundFiles, detectedStacks);

    return Array.from(detectedStacks).sort();
  }

  /**
   * Additional detections based on name patterns
   */
  private detectByPattern(files: string[], stacks: Set<string>): void {
    // Detect operating system based on specific files
    if (files.some(f => f === '.DS_Store' || f === 'Thumbs.db')) {
      // macOS and Windows are automatically detected by gitignore.io
      // but we can add explicitly if needed
    }

    // Detect Java by file extension
    if (files.some(f => f.endsWith('.java'))) {
      stacks.add('java');
    }

    // Detect TypeScript
    if (files.some(f => f === 'tsconfig.json' || f.endsWith('.ts'))) {
      stacks.add('node');
    }
  }

  /**
   * Returns the detection mapping (useful for debugging)
   */
  public getDetectionMap(): Map<string, string[]> {
    return new Map(this.detectionMap);
  }
}

