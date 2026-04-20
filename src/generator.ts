import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import { normalizePattern } from './normalize';
import { getStack, getValidApiStacks } from './stacks';

export interface GeneratorOptions {
  /** Directory containing local fallback templates */
  templatesDir?: string;
  /** Per-request timeout in ms (default 8000) */
  requestTimeoutMs?: number;
  /** Number of retry attempts for HTTP failures (default 2) */
  retries?: number;
}

const USER_AGENT = 'smart-gitignore (+https://github.com/Otto-Schmitz/smart-gitignore)';

/**
 * Generates .gitignore content using GitHub/gitignore templates
 * with fallback to gitignore.io and local templates.
 */
export class Generator {
  private readonly githubUrl = 'https://raw.githubusercontent.com/github/gitignore/main';
  private readonly apiUrl = 'https://www.toptal.com/developers/gitignore/api';
  private readonly templatesDir: string;
  private readonly requestTimeoutMs: number;
  private readonly retries: number;

  constructor(opts: GeneratorOptions | string = {}) {
    // Backwards-compat: previously accepted a string templatesDir.
    const options: GeneratorOptions = typeof opts === 'string' ? { templatesDir: opts } : opts;

    if (options.templatesDir) {
      this.templatesDir = options.templatesDir;
    } else {
      const baseDir = path.resolve(__dirname, '..');
      this.templatesDir = path.join(baseDir, 'templates');
    }
    this.requestTimeoutMs = options.requestTimeoutMs ?? 8000;
    this.retries = options.retries ?? 2;
  }

  // --------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------

  /**
   * Generates .gitignore content for the provided stacks.
   * Priority: GitHub -> gitignore.io -> local templates.
   * Essential rules (.env, OS, IDEs, ...) are always included.
   */
  public async generate(stacks: string[]): Promise<string> {
    const essentialBlock = `# Essential (OS, IDEs, env, logs)\n${this.getEssentialTemplate()}`;

    if (stacks.length === 0) {
      return this.mergeTemplates([essentialBlock, this.getFallbackTemplate('default')]);
    }

    try {
      return await this.fetchFromGitHub(stacks, essentialBlock);
    } catch (error) {
      console.warn(`⚠️  Error fetching from GitHub: ${error}`);

      try {
        const validStacks = this.filterValidStacks(stacks);
        if (validStacks.length > 0) {
          const apiContent = await this.fetchFromAPI(validStacks);
          // Append local templates for stacks not covered by gitignore.io
          // (e.g. AI tooling that doesn't exist on gitignore.io).
          const remaining = stacks
            .map(s => s.toLowerCase().trim())
            .filter(s => !validStacks.includes(s));
          const localBlocks: string[] = [];
          for (const stack of remaining) {
            const localTemplate = this.getLocalTemplate(stack);
            if (localTemplate) {
              localBlocks.push(`# ${stack} (local)\n${localTemplate}`);
            }
          }
          return this.mergeTemplates([apiContent, essentialBlock, ...localBlocks]);
        }
      } catch (apiError) {
        console.warn(`⚠️  Error fetching from gitignore.io API: ${apiError}`);
      }

      console.warn('📦 Using local template as fallback...');
      const fallbackContent = this.getFallbackTemplate(stacks);
      return this.mergeTemplates([essentialBlock, fallbackContent]);
    }
  }

  /**
   * Filters only stacks that gitignore.io accepts (and dedupes).
   */
  public filterValidStacks(stacks: string[]): string[] {
    const validApi = getValidApiStacks();
    const valid = new Set<string>();
    for (const stack of stacks) {
      const normalized = stack.toLowerCase().trim();
      if (normalized && validApi.has(normalized)) valid.add(normalized);
    }
    return Array.from(valid).sort();
  }

  /**
   * Exposed for the Merger so both pieces share the exact same merge policy.
   */
  public mergeTemplates(templates: string[]): string {
    return mergeBlocks(templates);
  }

  // --------------------------------------------------------------------
  // Internals
  // --------------------------------------------------------------------

  private getEssentialTemplate(): string {
    const essentialPath = path.join(this.templatesDir, 'essential.gitignore');
    if (fs.existsSync(essentialPath)) {
      return fs.readFileSync(essentialPath, 'utf-8').trim();
    }
    return [
      '# OS', '.DS_Store', 'Thumbs.db',
      '', '# IDEs', '.idea/', '.vscode/',
      '', '# Environment', '.env', '.env.local', '.env.*.local',
      '', '# Logs', '*.log',
      '', '# Temporary', '*.tmp', '.cache/',
    ].join('\n');
  }

  private async fetchFromGitHub(stacks: string[], essentialBlock: string): Promise<string> {
    const templates: string[] = [essentialBlock];
    const fetchedStacks: string[] = [];
    const notFoundStacks: string[] = [];

    for (const stack of stacks) {
      const normalized = stack.toLowerCase().trim();
      const meta = getStack(normalized);
      const templateName = meta?.githubTemplate;

      if (templateName) {
        try {
          const content = await this.fetchGitHubTemplate(templateName);
          if (content) {
            templates.push(`# ${templateName}\n${content}`);
            fetchedStacks.push(normalized);
          }
        } catch {
          notFoundStacks.push(normalized);
        }
      } else {
        notFoundStacks.push(normalized);
      }
    }

    if (templates.length === 1) {
      // Only essential block: nothing fetched. Try local templates before bailing.
      const anyLocal = notFoundStacks
        .map(s => this.getLocalTemplate(s))
        .some(t => !!t);
      if (!anyLocal) {
        throw new Error('No templates found on GitHub');
      }
    }

    for (const stack of notFoundStacks) {
      const localTemplate = this.getLocalTemplate(stack);
      if (localTemplate) templates.push(`# ${stack} (local)\n${localTemplate}`);
    }

    return this.mergeTemplates(templates);
  }

  private getLocalTemplate(stack: string): string | null {
    const templatePath = path.join(this.templatesDir, `${stack}.gitignore`);
    if (fs.existsSync(templatePath)) {
      return fs.readFileSync(templatePath, 'utf-8');
    }
    return null;
  }

  private async fetchGitHubTemplate(templateName: string): Promise<string> {
    return this.fetchUrlWithRetry(`${this.githubUrl}/${templateName}.gitignore`);
  }

  private async fetchFromAPI(stacks: string[]): Promise<string> {
    const url = `${this.apiUrl}/${stacks.join(',')}`;
    const data = await this.fetchUrlWithRetry(url);
    if (data.includes('ERROR:') || data.includes('is undefined')) {
      throw new Error('API returned error: one or more stacks are invalid');
    }
    return data;
  }

  private async fetchUrlWithRetry(url: string): Promise<string> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        return await this.fetchUrl(url);
      } catch (err) {
        lastError = err;
        if (attempt < this.retries) {
          // Exponential backoff: 200ms, 400ms, 800ms...
          await new Promise(r => setTimeout(r, 200 * Math.pow(2, attempt)));
        }
      }
    }
    throw lastError;
  }

  private fetchUrl(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const req = https.get(url, { headers: { 'User-Agent': USER_AGENT } }, (res) => {
        const status = res.statusCode ?? 0;
        if (status === 404) {
          res.resume();
          reject(new Error(`Not found: ${url}`));
          return;
        }
        if (status < 200 || status >= 300) {
          res.resume();
          reject(new Error(`HTTP ${status} for ${url}`));
          return;
        }
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          if (data.trim().length === 0) {
            reject(new Error(`Empty response from ${url}`));
            return;
          }
          resolve(data.trim());
        });
      });

      req.setTimeout(this.requestTimeoutMs, () => {
        req.destroy(new Error(`Request timed out after ${this.requestTimeoutMs}ms: ${url}`));
      });

      req.on('error', reject);
    });
  }

  private getFallbackTemplate(stacks: string | string[]): string {
    const stackList = Array.isArray(stacks) ? stacks : [stacks];

    for (const stack of stackList) {
      const templatePath = path.join(this.templatesDir, `${stack}.gitignore`);
      if (fs.existsSync(templatePath)) {
        return fs.readFileSync(templatePath, 'utf-8');
      }
    }

    const defaultPath = path.join(this.templatesDir, 'default.gitignore');
    if (fs.existsSync(defaultPath)) {
      return fs.readFileSync(defaultPath, 'utf-8');
    }

    return this.getBasicTemplate();
  }

  private getBasicTemplate(): string {
    return [
      '# OS', '.DS_Store', 'Thumbs.db',
      '',
      '# IDEs', '.idea/', '.vscode/', '*.swp', '*.swo', '*~',
      '',
      '# Logs', '*.log', 'npm-debug.log*', 'yarn-debug.log*', 'yarn-error.log*',
      '',
      '# Dependencies', 'node_modules/', 'vendor/',
      '',
      '# Environment', '.env', '.env.local', '.env.*.local',
      '',
      '# Build', 'dist/', 'build/', '*.class', '*.jar', '*.war',
      '',
    ].join('\n');
  }
}

// ----------------------------------------------------------------------------
// Shared merge policy (used by Generator AND Merger).
// ----------------------------------------------------------------------------

/**
 * Merges a list of .gitignore blocks into a single document.
 *
 * Dedup policy:
 *  - Patterns are normalized via normalizePattern (handles trailing-slash,
 *    leading-slash and **\u002f variants).
 *  - Comments are normalized too: identical headings collapse to one occurrence.
 *  - Negations (!foo) are kept distinct from their positive counterpart.
 *  - At most one consecutive blank line is preserved.
 */
export function mergeBlocks(templates: string[]): string {
  const seenLines = new Set<string>();
  const seenComments = new Set<string>();
  const sections: string[] = [];

  for (const template of templates) {
    const lines = template.split('\n');
    const sectionLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed === '') {
        // Avoid multiple consecutive blank lines.
        if (sectionLines.length > 0 && sectionLines[sectionLines.length - 1] !== '') {
          sectionLines.push('');
        }
        continue;
      }

      if (trimmed.startsWith('#')) {
        const key = normalizePattern(trimmed);
        if (key && !seenComments.has(key)) {
          seenComments.add(key);
          sectionLines.push(line);
        }
        continue;
      }

      const key = normalizePattern(trimmed);
      if (key && !seenLines.has(key)) {
        seenLines.add(key);
        sectionLines.push(line);
      }
    }

    if (sectionLines.length > 0) {
      // Drop trailing blank inside the block; sections are joined with '\n\n'
      while (sectionLines.length && sectionLines[sectionLines.length - 1] === '') {
        sectionLines.pop();
      }
      sections.push(sectionLines.join('\n'));
    }
  }

  return sections.join('\n\n');
}
