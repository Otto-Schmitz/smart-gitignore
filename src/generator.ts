import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Gera conteúdo de .gitignore usando a API do gitignore.io
 * com fallback para templates locais
 */
export class Generator {
  private readonly apiUrl = 'https://www.toptal.com/developers/gitignore/api';
  private readonly templatesDir: string;

  // Mapeamento de stacks conhecidas válidas na API gitignore.io
  // Stacks inválidas como 'npm', 'pnpm' e 'docker' são filtradas
  // Nota: 'docker' não existe na API, mas pode ser coberto por templates locais
  private readonly validStacks = new Set([
    'node', 'yarn', 'java', 'maven', 'gradle', 'ruby',
    'python', 'django', 'go', 'rust', 'php', 'composer', 'visualstudio',
    'intellij', 'vscode', 'eclipse', 'dotenv', 'c', 'cpp', 'csharp',
    'typescript', 'javascript', 'react', 'vue', 'angular', 'nextjs',
    'nuxt', 'gatsby', 'svelte', 'flutter', 'dart', 'kotlin', 'swift',
    'scala', 'clojure', 'elixir', 'erlang', 'haskell', 'ocaml', 'perl',
    'r', 'matlab', 'julia', 'lua', 'nim', 'crystal', 'zig', 'v',
    'terraform', 'ansible', 'kubernetes', 'helm', 'vagrant', 'packer'
  ]);

  constructor(templatesDir?: string) {
    if (templatesDir) {
      this.templatesDir = templatesDir;
    } else {
      // Resolve o caminho dos templates de forma que funcione tanto em dev quanto em produção
      // Em dev: __dirname = src/, então ../templates
      // Em produção: __dirname = dist/, então ../templates
      const baseDir = path.resolve(__dirname, '..');
      this.templatesDir = path.join(baseDir, 'templates');
    }
  }

  /**
   * Gera o conteúdo do .gitignore para as stacks fornecidas
   */
  public async generate(stacks: string[]): Promise<string> {
    if (stacks.length === 0) {
      return this.getFallbackTemplate('default');
    }

    // Filtra apenas stacks válidas
    const validStacks = this.filterValidStacks(stacks);
    
    if (validStacks.length === 0) {
      console.warn('⚠️  Nenhuma stack válida encontrada. Usando template local...');
      return this.getFallbackTemplate(stacks);
    }

    try {
      return await this.fetchFromAPI(validStacks);
    } catch (error) {
      console.warn(`⚠️  Erro ao buscar da API: ${error}`);
      console.warn('📦 Usando template local como fallback...');
      return this.getFallbackTemplate(stacks);
    }
  }

  /**
   * Filtra apenas as stacks válidas conhecidas
   * Remove duplicatas e stacks inválidas (como 'npm', 'pnpm')
   */
  public filterValidStacks(stacks: string[]): string[] {
    const valid = new Set<string>();
    
    for (const stack of stacks) {
      const normalized = stack.toLowerCase().trim();
      if (normalized && this.validStacks.has(normalized)) {
        valid.add(normalized);
      }
    }
    
    return Array.from(valid).sort();
  }

  /**
   * Busca o .gitignore da API do gitignore.io
   */
  private async fetchFromAPI(stacks: string[]): Promise<string> {
    const stacksParam = stacks.join(',');
    const url = `${this.apiUrl}/${stacksParam}`;

    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          // Verifica se a resposta contém erro da API
          if (data.includes('ERROR:') || data.includes('is undefined')) {
            reject(new Error(`API retornou erro: uma ou mais stacks são inválidas`));
            return;
          }

          if (res.statusCode !== 200) {
            reject(new Error(`API retornou status ${res.statusCode}`));
            return;
          }

          if (data.trim().length === 0) {
            reject(new Error('Resposta vazia da API'));
            return;
          }
          resolve(data);
        });
      }).on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Obtém template local como fallback
   */
  private getFallbackTemplate(stacks: string | string[]): string {
    const stackList = Array.isArray(stacks) ? stacks : [stacks];
    
    // Tenta carregar template específico
    for (const stack of stackList) {
      const templatePath = path.join(this.templatesDir, `${stack}.gitignore`);
      if (fs.existsSync(templatePath)) {
        return fs.readFileSync(templatePath, 'utf-8');
      }
    }

    // Fallback para template padrão
    const defaultPath = path.join(this.templatesDir, 'default.gitignore');
    if (fs.existsSync(defaultPath)) {
      return fs.readFileSync(defaultPath, 'utf-8');
    }

    // Último fallback: template básico
    return this.getBasicTemplate();
  }

  /**
   * Retorna um template básico caso não haja templates locais
   */
  private getBasicTemplate(): string {
    return `# OS
.DS_Store
Thumbs.db

# IDEs
.idea/
.vscode/
*.swp
*.swo
*~

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Dependencies
node_modules/
vendor/

# Environment
.env
.env.local
.env.*.local

# Build
dist/
build/
*.class
*.jar
*.war
`;
  }
}

