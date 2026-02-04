import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Generates .gitignore content using GitHub/gitignore templates
 * with fallback to gitignore.io and local templates
 */
export class Generator {
  private readonly githubUrl = 'https://raw.githubusercontent.com/github/gitignore/main';
  private readonly apiUrl = 'https://www.toptal.com/developers/gitignore/api';
  private readonly templatesDir: string;

  // Mapping of detected stacks to GitHub template names
  // GitHub templates use PascalCase (e.g., Node.gitignore, Java.gitignore)
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
      // Resolve templates path to work in both dev and production
      // In dev: __dirname = src/, so ../templates
      // In production: __dirname = dist/, so ../templates
      const baseDir = path.resolve(__dirname, '..');
      this.templatesDir = path.join(baseDir, 'templates');
    }
  }

  /**
   * Regras essenciais sempre incluídas (OS, IDEs, .env, logs, tmp)
   * Não dependem da stack detectada.
   */
  private getEssentialTemplate(): string {
    const essentialPath = path.join(this.templatesDir, 'essential.gitignore');
    if (fs.existsSync(essentialPath)) {
      return fs.readFileSync(essentialPath, 'utf-8').trim();
    }
    return `# OS
.DS_Store
Thumbs.db

# IDEs
.idea/
.vscode/

# Environment
.env
.env.local
.env.*.local

# Logs
*.log

# Temporary
*.tmp
.cache/`;
  }

  /**
   * Generates .gitignore content for the provided stacks
   * Priority: GitHub → gitignore.io → local templates
   * Regras essenciais (.env, OS, IDEs, etc.) são sempre incluídas.
   */
  public async generate(stacks: string[]): Promise<string> {
    const essentialBlock = `# Essential (OS, IDEs, env, logs)\n${this.getEssentialTemplate()}`;

    if (stacks.length === 0) {
      return this.mergeTemplates([essentialBlock, this.getFallbackTemplate('default')]);
    }

    // Try to fetch from GitHub first (most complete and up-to-date)
    try {
      return await this.fetchFromGitHub(stacks, essentialBlock);
    } catch (error) {
      console.warn(`⚠️  Error fetching from GitHub: ${error}`);
      
      // Fallback to gitignore.io
      try {
        const validStacks = this.filterValidStacks(stacks);
        if (validStacks.length > 0) {
          const apiContent = await this.fetchFromAPI(validStacks);
          return this.mergeTemplates([essentialBlock, apiContent]);
        }
      } catch (apiError) {
        console.warn(`⚠️  Error fetching from gitignore.io API: ${apiError}`);
      }
      
      // Last fallback: local templates
      console.warn('📦 Using local template as fallback...');
      const fallbackContent = this.getFallbackTemplate(stacks);
      return this.mergeTemplates([essentialBlock, fallbackContent]);
    }
  }

  /**
   * Fetches templates from GitHub/gitignore repository
   */
  private async fetchFromGitHub(stacks: string[], essentialBlock: string): Promise<string> {
    const templates: string[] = [essentialBlock];
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
          // Stack not found on GitHub, try local template later
          notFoundStacks.push(normalized);
        }
      } else {
        // Stack not mapped, try local template later
        notFoundStacks.push(normalized);
      }
    }

    // If no templates found on GitHub, throw error to use fallback
    if (templates.length === 0) {
      throw new Error('No templates found on GitHub');
    }

    // Add local templates for stacks not found on GitHub
    if (notFoundStacks.length > 0) {
      for (const stack of notFoundStacks) {
        const localTemplate = this.getLocalTemplate(stack);
        if (localTemplate) {
          templates.push(`# ${stack} (local)\n${localTemplate}`);
        }
      }
    }

    // Combine all templates, removing duplicates
    return this.mergeTemplates(templates);
  }

  /**
   * Try to get local template for a specific stack
   */
  private getLocalTemplate(stack: string): string | null {
    const templatePath = path.join(this.templatesDir, `${stack}.gitignore`);
    if (fs.existsSync(templatePath)) {
      return fs.readFileSync(templatePath, 'utf-8');
    }
    return null;
  }

  /**
   * Fetches a specific template from GitHub
   */
  private async fetchGitHubTemplate(templateName: string): Promise<string> {
    const url = `${this.githubUrl}/${templateName}.gitignore`;

    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        if (res.statusCode === 404) {
          reject(new Error(`Template ${templateName} not found`));
          return;
        }

        if (res.statusCode !== 200) {
          reject(new Error(`GitHub returned status ${res.statusCode}`));
          return;
        }

        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (data.trim().length === 0) {
            reject(new Error('Empty response from GitHub'));
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
   * Merges multiple templates removing duplicate lines and excessive comments
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
        
        // Empty lines
        if (trimmed === '') {
          // Avoid multiple consecutive empty lines
          if (!lastWasComment || sectionLines.length === 0 || sectionLines[sectionLines.length - 1] !== '') {
            sectionLines.push('');
          }
          lastWasComment = false;
          continue;
        }
        
        // Comments
        if (trimmed.startsWith('#')) {
          // Remove duplicate comments (normalized)
          const normalizedComment = trimmed.toLowerCase();
          if (!allComments.has(normalizedComment)) {
            allComments.add(normalizedComment);
            sectionLines.push(line);
            lastWasComment = true;
          }
          continue;
        }

        // Remove duplicates based on normalized content
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
   * Filters only known valid stacks
   * Removes duplicates and invalid stacks (like 'npm', 'pnpm')
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
   * Fetches .gitignore from gitignore.io API
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
          // Check if response contains API error
          if (data.includes('ERROR:') || data.includes('is undefined')) {
            reject(new Error(`API returned error: one or more stacks are invalid`));
            return;
          }

          if (res.statusCode !== 200) {
            reject(new Error(`API returned status ${res.statusCode}`));
            return;
          }

          if (data.trim().length === 0) {
            reject(new Error('Empty API response'));
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
   * Gets local template as fallback
   */
  private getFallbackTemplate(stacks: string | string[]): string {
    const stackList = Array.isArray(stacks) ? stacks : [stacks];
    
    // Try to load specific template
    for (const stack of stackList) {
      const templatePath = path.join(this.templatesDir, `${stack}.gitignore`);
      if (fs.existsSync(templatePath)) {
        return fs.readFileSync(templatePath, 'utf-8');
      }
    }

    // Fallback to default template
    const defaultPath = path.join(this.templatesDir, 'default.gitignore');
    if (fs.existsSync(defaultPath)) {
      return fs.readFileSync(defaultPath, 'utf-8');
    }

    // Last fallback: basic template
    return this.getBasicTemplate();
  }

  /**
   * Returns a basic template if no local templates exist
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

