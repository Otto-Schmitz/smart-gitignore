import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Gera conteúdo de .gitignore usando templates do GitHub/gitignore
 * com fallback para gitignore.io e templates locais
 */
export class Generator {
  private readonly githubUrl = 'https://raw.githubusercontent.com/github/gitignore/main';
  private readonly apiUrl = 'https://www.toptal.com/developers/gitignore/api';
  private readonly templatesDir: string;

  // Mapeamento de stacks detectadas para nomes de templates do GitHub
  // Os templates do GitHub usam PascalCase (ex: Node.gitignore, Java.gitignore)
  private readonly githubTemplateMap: Map<string, string> = new Map([
    ['node', 'Node'],
    ['java', 'Java'],
    ['maven', 'Maven'],
    ['gradle', 'Gradle'],
    ['ruby', 'Ruby'],
    ['python', 'Python'],
    ['django', 'Django'],
    ['go', 'Go'],
    ['rust', 'Rust'],
    ['php', 'PHP'],
    ['composer', 'Composer'],
    ['visualstudio', 'VisualStudio'],
    ['intellij', 'Global/JetBrains'],
    ['vscode', 'Global/VisualStudioCode'],
    ['eclipse', 'Global/Eclipse'],
    ['dotenv', 'Global/Env'],
    ['c', 'C'],
    ['cpp', 'C++'],
    ['csharp', 'VisualStudio'],
    ['typescript', 'TypeScript'],
    ['javascript', 'JavaScript'],
    ['react', 'React'],
    ['vue', 'Vue'],
    ['angular', 'Angular'],
    ['nextjs', 'Nextjs'],
    ['nuxt', 'Nuxt'],
    ['gatsby', 'Gatsby'],
    ['svelte', 'Svelte'],
    ['yarn', 'Yarn'],
    ['flutter', 'Flutter'],
    ['dart', 'Dart'],
    ['kotlin', 'Kotlin'],
    ['swift', 'Swift'],
    ['scala', 'Scala'],
    ['clojure', 'Clojure'],
    ['elixir', 'Elixir'],
    ['erlang', 'Erlang'],
    ['haskell', 'Haskell'],
    ['ocaml', 'OCaml'],
    ['perl', 'Perl'],
    ['r', 'R'],
    ['matlab', 'MATLAB'],
    ['julia', 'Julia'],
    ['lua', 'Lua'],
    ['nim', 'Nim'],
    ['crystal', 'Crystal'],
    ['zig', 'Zig'],
    ['terraform', 'Terraform'],
    ['ansible', 'Ansible'],
    ['kubernetes', 'Kubernetes'],
    ['helm', 'Helm'],
    ['vagrant', 'Vagrant'],
  ]);

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
   * Prioridade: GitHub → gitignore.io → templates locais
   */
  public async generate(stacks: string[]): Promise<string> {
    if (stacks.length === 0) {
      return this.getFallbackTemplate('default');
    }

    // Tenta buscar do GitHub primeiro (mais completo e atualizado)
    try {
      return await this.fetchFromGitHub(stacks);
    } catch (error) {
      console.warn(`⚠️  Erro ao buscar do GitHub: ${error}`);
      
      // Fallback para gitignore.io
      try {
        const validStacks = this.filterValidStacks(stacks);
        if (validStacks.length > 0) {
          return await this.fetchFromAPI(validStacks);
        }
      } catch (apiError) {
        console.warn(`⚠️  Erro ao buscar da API gitignore.io: ${apiError}`);
      }
      
      // Último fallback: templates locais
      console.warn('📦 Usando template local como fallback...');
      return this.getFallbackTemplate(stacks);
    }
  }

  /**
   * Busca templates do repositório GitHub/gitignore
   */
  private async fetchFromGitHub(stacks: string[]): Promise<string> {
    const templates: string[] = [];
    const fetchedStacks: string[] = [];
    const notFoundStacks: string[] = [];
    
    for (const stack of stacks) {
      const normalized = stack.toLowerCase().trim();
      const templateName = this.githubTemplateMap.get(normalized);
      
      if (templateName) {
        try {
          const content = await this.fetchGitHubTemplate(templateName);
          if (content) {
            templates.push(`# ${templateName}\n${content}`);
            fetchedStacks.push(normalized);
          }
        } catch (error) {
          // Stack não encontrada no GitHub, tenta template local depois
          notFoundStacks.push(normalized);
        }
      } else {
        // Stack não mapeada, tenta template local depois
        notFoundStacks.push(normalized);
      }
    }

    // Se não encontrou nenhum template no GitHub, lança erro para usar fallback
    if (templates.length === 0) {
      throw new Error('Nenhum template encontrado no GitHub');
    }

    // Adiciona templates locais para stacks não encontradas no GitHub
    if (notFoundStacks.length > 0) {
      for (const stack of notFoundStacks) {
        const localTemplate = this.getLocalTemplate(stack);
        if (localTemplate) {
          templates.push(`# ${stack} (local)\n${localTemplate}`);
        }
      }
    }

    // Combina todos os templates, removendo duplicatas
    return this.mergeTemplates(templates);
  }

  /**
   * Tenta obter template local para uma stack específica
   */
  private getLocalTemplate(stack: string): string | null {
    const templatePath = path.join(this.templatesDir, `${stack}.gitignore`);
    if (fs.existsSync(templatePath)) {
      return fs.readFileSync(templatePath, 'utf-8');
    }
    return null;
  }

  /**
   * Busca um template específico do GitHub
   */
  private async fetchGitHubTemplate(templateName: string): Promise<string> {
    const url = `${this.githubUrl}/${templateName}.gitignore`;

    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        if (res.statusCode === 404) {
          reject(new Error(`Template ${templateName} não encontrado`));
          return;
        }

        if (res.statusCode !== 200) {
          reject(new Error(`GitHub retornou status ${res.statusCode}`));
          return;
        }

        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (data.trim().length === 0) {
            reject(new Error('Resposta vazia do GitHub'));
            return;
          }
          resolve(data.trim());
        });
      }).on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Mescla múltiplos templates removendo linhas duplicadas e comentários excessivos
   */
  private mergeTemplates(templates: string[]): string {
    const allLines = new Set<string>();
    const allComments = new Set<string>();
    const sections: string[] = [];

    for (const template of templates) {
      const lines = template.split('\n');
      const sectionLines: string[] = [];
      let lastWasComment = false;

      for (const line of lines) {
        const trimmed = line.trim();
        
        // Linhas vazias
        if (trimmed === '') {
          // Evita múltiplas linhas vazias consecutivas
          if (!lastWasComment || sectionLines.length === 0 || sectionLines[sectionLines.length - 1] !== '') {
            sectionLines.push('');
          }
          lastWasComment = false;
          continue;
        }
        
        // Comentários
        if (trimmed.startsWith('#')) {
          // Remove comentários duplicados (normalizados)
          const normalizedComment = trimmed.toLowerCase();
          if (!allComments.has(normalizedComment)) {
            allComments.add(normalizedComment);
            sectionLines.push(line);
            lastWasComment = true;
          }
          continue;
        }

        // Remove duplicatas baseado no conteúdo normalizado
        const normalized = trimmed.toLowerCase();
        if (!allLines.has(normalized)) {
          allLines.add(normalized);
          sectionLines.push(line);
          lastWasComment = false;
        }
      }

      if (sectionLines.length > 0) {
        sections.push(sectionLines.join('\n'));
      }
    }

    return sections.join('\n\n');
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

