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

    // AI assistants & tooling
    ['.cursor', ['ai', 'cursor']],
    ['.cursorrules', ['ai', 'cursor']],
    ['.cursorignore', ['ai', 'cursor']],
    ['.cursorindexingignore', ['ai', 'cursor']],
    ['.claude', ['ai', 'claude']],
    ['CLAUDE.md', ['ai', 'claude']],
    ['.aider.conf.yml', ['ai', 'aider']],
    ['.aider.conf.yaml', ['ai', 'aider']],
    ['.aider.chat.history.md', ['ai', 'aider']],
    ['.aider.input.history', ['ai', 'aider']],
    ['.aider.llm.history', ['ai', 'aider']],
    ['.codex', ['ai', 'codex']],
    ['AGENTS.md', ['ai', 'codex']],
    ['.continue', ['ai', 'continue']],
    ['.continuerules', ['ai', 'continue']],
    ['.windsurf', ['ai', 'windsurf']],
    ['.windsurfrules', ['ai', 'windsurf']],
    ['.copilot', ['ai', 'copilot']],
    ['.codeium', ['ai']],
    ['.cody', ['ai']],
    ['.tabnine', ['ai']],
    ['.ai', ['ai']],
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

    // Detect AI tooling by glob/nested patterns
    if (files.some(f => /^\.aider/.test(f))) {
      stacks.add('ai');
      stacks.add('aider');
    }

    // Nested AI artifacts (require explicit existence check)
    const nestedAiPaths: Array<[string, string[]]> = [
      ['docs/ai', ['ai']],
      ['ai-docs', ['ai']],
      ['.github/copilot-instructions.md', ['ai', 'copilot']],
      ['.github/chatmodes', ['ai', 'copilot']],
      ['.github/prompts', ['ai', 'copilot']],
      ['.cursor/rules', ['ai', 'cursor']],
      ['.cursor/mcp.json', ['ai', 'cursor']],
      ['.claude/settings.json', ['ai', 'claude']],
      ['.claude/agents', ['ai', 'claude']],
      ['.claude/commands', ['ai', 'claude']],
    ];

    for (const [relPath, addStacks] of nestedAiPaths) {
      if (this.scanner.exists(relPath)) {
        addStacks.forEach(s => stacks.add(s));
      }
    }
  }

  /**
   * Returns the detection mapping (useful for debugging)
   */
  public getDetectionMap(): Map<string, string[]> {
    return new Map(this.detectionMap);
  }
}

