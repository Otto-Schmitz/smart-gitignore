import { Scanner } from './scanner';

/**
 * Mapeia arquivos e diretórios encontrados para stacks tecnológicas
 */
export class Detector {
  private readonly scanner: Scanner;

  // Mapeamento de arquivos/diretórios para stacks
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
    ['pnpm-lock.yaml', ['node']], // pnpm não é stack válida na API, mas node cobre
    ['package-lock.json', ['node']], // npm não é stack válida na API, mas node cobre
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
   * Detecta todas as stacks baseado nos arquivos encontrados
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

    // Detecções adicionais baseadas em padrões
    this.detectByPattern(foundFiles, detectedStacks);

    return Array.from(detectedStacks).sort();
  }

  /**
   * Detecções adicionais baseadas em padrões de nomes
   */
  private detectByPattern(files: string[], stacks: Set<string>): void {
    // Detecta sistema operacional baseado em arquivos específicos
    if (files.some(f => f === '.DS_Store' || f === 'Thumbs.db')) {
      // macOS e Windows são detectados automaticamente pelo gitignore.io
      // mas podemos adicionar explicitamente se necessário
    }

    // Detecta Java por extensão de arquivo
    if (files.some(f => f.endsWith('.java'))) {
      stacks.add('java');
    }

    // Detecta TypeScript
    if (files.some(f => f === 'tsconfig.json' || f.endsWith('.ts'))) {
      stacks.add('node');
    }
  }

  /**
   * Retorna o mapeamento de detecção (útil para debug)
   */
  public getDetectionMap(): Map<string, string[]> {
    return new Map(this.detectionMap);
  }
}

