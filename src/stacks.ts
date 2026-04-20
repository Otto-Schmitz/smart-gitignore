/**
 * Single source of truth for stack metadata.
 *
 * Each entry describes how to detect a stack and where to fetch its
 * .gitignore template (GitHub, gitignore.io, local fallback).
 *
 * Detection rules per stack:
 *   - files:        exact filenames found at scan root
 *   - extensions:   file extensions (with leading dot)
 *   - nestedPaths:  paths probed via Scanner.exists (relative to root)
 *
 * A single file may light up multiple stacks (e.g. `pom.xml` -> java + maven).
 * That is expressed by listing `pom.xml` in BOTH stacks' detection rules.
 */

export interface StackDetection {
  files?: string[];
  extensions?: string[];
  nestedPaths?: string[];
  /** Optional regex applied to each scanned name (e.g. /^\.aider/) */
  filePattern?: RegExp;
}

export interface StackMeta {
  /** Canonical stack id (lowercase) */
  name: string;
  /** Human-readable category (used only for docs/grouping) */
  category?: string;
  detection?: StackDetection;
  /** GitHub/gitignore template path (without .gitignore suffix) */
  githubTemplate?: string;
  /** Whether the stack id is accepted by gitignore.io API */
  validInApi?: boolean;
  /** Whether a templates/<name>.gitignore file exists locally */
  hasLocal?: boolean;
}

export const STACKS: StackMeta[] = [
  // -------------------- JVM --------------------
  {
    name: 'java',
    category: 'language',
    detection: { files: ['pom.xml'], extensions: ['.java'] },
    githubTemplate: 'Java',
    validInApi: true,
    hasLocal: true,
  },
  {
    name: 'maven',
    category: 'build',
    detection: { files: ['pom.xml'] },
    githubTemplate: 'Maven',
    validInApi: true,
  },
  {
    name: 'gradle',
    category: 'build',
    detection: {
      files: [
        'build.gradle',
        'build.gradle.kts',
        'settings.gradle',
        'settings.gradle.kts',
        'gradlew',
        'gradlew.bat',
      ],
    },
    githubTemplate: 'Gradle',
    validInApi: true,
    hasLocal: true,
  },
  {
    name: 'kotlin',
    category: 'language',
    detection: { extensions: ['.kt', '.kts'] },
    githubTemplate: 'Kotlin',
    validInApi: true,
  },
  {
    name: 'scala',
    category: 'language',
    detection: { extensions: ['.scala', '.sbt'], files: ['build.sbt'] },
    githubTemplate: 'Scala',
    validInApi: true,
  },

  // -------------------- Node ecosystem --------------------
  {
    name: 'node',
    category: 'language',
    detection: {
      files: [
        'package.json',
        'yarn.lock',
        'pnpm-lock.yaml',
        'package-lock.json',
        'node_modules',
        'tsconfig.json',
      ],
      extensions: ['.ts', '.tsx', '.mjs', '.cjs'],
    },
    githubTemplate: 'Node',
    validInApi: true,
    hasLocal: true,
  },
  {
    name: 'yarn',
    category: 'tool',
    detection: { files: ['yarn.lock', '.yarnrc', '.yarnrc.yml'] },
    githubTemplate: 'Yarn',
    validInApi: true,
  },
  {
    name: 'typescript',
    category: 'language',
    detection: { files: ['tsconfig.json'], extensions: ['.ts', '.tsx'] },
    githubTemplate: 'TypeScript',
    validInApi: true,
    hasLocal: true,
  },
  {
    name: 'react',
    category: 'framework',
    detection: { nestedPaths: ['src/App.tsx', 'src/App.jsx'] },
    githubTemplate: 'React',
    validInApi: true,
    hasLocal: true,
  },
  {
    name: 'vue',
    category: 'framework',
    detection: { extensions: ['.vue'] },
    githubTemplate: 'Vue',
    validInApi: true,
    hasLocal: true,
  },
  {
    name: 'nextjs',
    category: 'framework',
    detection: { files: ['next.config.js', 'next.config.mjs', 'next.config.ts'] },
    githubTemplate: 'Nextjs',
    validInApi: true,
  },
  {
    name: 'nuxt',
    category: 'framework',
    detection: { files: ['nuxt.config.js', 'nuxt.config.ts'] },
    githubTemplate: 'Nuxt',
    validInApi: true,
  },
  {
    name: 'svelte',
    category: 'framework',
    detection: { files: ['svelte.config.js', 'svelte.config.ts'], extensions: ['.svelte'] },
    githubTemplate: 'Svelte',
    validInApi: true,
  },
  {
    name: 'astro',
    category: 'framework',
    detection: { files: ['astro.config.mjs', 'astro.config.ts'] },
  },
  {
    name: 'vite',
    category: 'tool',
    detection: { files: ['vite.config.js', 'vite.config.ts', 'vite.config.mjs'] },
  },
  {
    name: 'turbo',
    category: 'tool',
    detection: { files: ['turbo.json'] },
  },
  {
    name: 'nx',
    category: 'tool',
    detection: { files: ['nx.json'] },
  },
  {
    name: 'bun',
    category: 'language',
    detection: { files: ['bun.lockb', 'bun.lock', 'bunfig.toml'] },
  },
  {
    name: 'deno',
    category: 'language',
    detection: { files: ['deno.json', 'deno.jsonc', 'deno.lock'] },
  },

  // -------------------- Docker / IaC --------------------
  {
    name: 'docker',
    category: 'tool',
    detection: {
      files: ['Dockerfile', 'docker-compose.yml', 'docker-compose.yaml', '.dockerignore'],
    },
    hasLocal: true,
  },
  {
    name: 'terraform',
    category: 'iac',
    detection: { extensions: ['.tf'], files: ['.terraform.lock.hcl'] },
    githubTemplate: 'Terraform',
    validInApi: true,
  },
  {
    name: 'helm',
    category: 'iac',
    detection: { files: ['Chart.yaml', '.helmignore'] },
    githubTemplate: 'Helm',
    validInApi: true,
  },

  // -------------------- Ruby --------------------
  {
    name: 'ruby',
    category: 'language',
    detection: {
      files: ['Gemfile', 'Gemfile.lock', '.ruby-version', 'Rakefile'],
      extensions: ['.rb'],
    },
    githubTemplate: 'Ruby',
    validInApi: true,
    hasLocal: true,
  },

  // -------------------- Python --------------------
  {
    name: 'python',
    category: 'language',
    detection: {
      files: [
        'requirements.txt',
        'Pipfile',
        'Pipfile.lock',
        'pyproject.toml',
        'setup.py',
        'manage.py',
        'poetry.lock',
        'uv.lock',
        'pdm.lock',
        'environment.yml',
      ],
      extensions: ['.py'],
    },
    githubTemplate: 'Python',
    validInApi: true,
    hasLocal: true,
  },
  {
    name: 'django',
    category: 'framework',
    detection: { files: ['manage.py'] },
    githubTemplate: 'Django',
    validInApi: true,
  },

  // -------------------- IDEs --------------------
  {
    name: 'intellij',
    category: 'ide',
    detection: { files: ['.idea'] },
    githubTemplate: 'Global/JetBrains',
    validInApi: true,
  },
  {
    name: 'vscode',
    category: 'ide',
    detection: { files: ['.vscode'] },
    githubTemplate: 'Global/VisualStudioCode',
    validInApi: true,
  },
  {
    name: 'eclipse',
    category: 'ide',
    detection: { files: ['.eclipse', '.settings', '.project', '.classpath'] },
    githubTemplate: 'Global/Eclipse',
    validInApi: true,
  },

  // -------------------- Misc / env --------------------
  {
    name: 'dotenv',
    category: 'tool',
    detection: {
      files: ['.env', '.env.local', '.env.development', '.env.production'],
    },
    githubTemplate: 'Global/Env',
    validInApi: true,
  },

  // -------------------- Go --------------------
  {
    name: 'go',
    category: 'language',
    detection: { files: ['go.mod', 'go.sum'], extensions: ['.go'] },
    githubTemplate: 'Go',
    validInApi: true,
    hasLocal: true,
  },

  // -------------------- Rust --------------------
  {
    name: 'rust',
    category: 'language',
    detection: { files: ['Cargo.toml', 'Cargo.lock'], extensions: ['.rs'] },
    githubTemplate: 'Rust',
    validInApi: true,
    hasLocal: true,
  },

  // -------------------- PHP --------------------
  {
    name: 'php',
    category: 'language',
    detection: { files: ['composer.json', 'composer.lock'], extensions: ['.php'] },
    githubTemplate: 'PHP',
    validInApi: true,
    hasLocal: true,
  },
  {
    name: 'composer',
    category: 'tool',
    detection: { files: ['composer.json', 'composer.lock'] },
    githubTemplate: 'Composer',
    validInApi: true,
  },

  // -------------------- .NET / C# / C / C++ --------------------
  {
    name: 'visualstudio',
    category: 'ide',
    detection: {
      files: ['project.json'],
      extensions: ['.csproj', '.sln', '.fsproj', '.vbproj'],
    },
    githubTemplate: 'VisualStudio',
    validInApi: true,
  },
  {
    name: 'csharp',
    category: 'language',
    detection: { extensions: ['.cs', '.csproj'] },
    githubTemplate: 'VisualStudio',
    validInApi: true,
    hasLocal: true,
  },
  {
    name: 'c',
    category: 'language',
    detection: { extensions: ['.c', '.h'] },
    githubTemplate: 'C',
    validInApi: true,
  },
  {
    name: 'cpp',
    category: 'language',
    detection: { extensions: ['.cpp', '.cxx', '.cc', '.hpp'] },
    githubTemplate: 'C++',
    validInApi: true,
    hasLocal: true,
  },

  // -------------------- AI assistants & tooling --------------------
  {
    name: 'ai',
    category: 'ai',
    detection: {
      files: [
        '.cursor', '.cursorrules', '.cursorignore', '.cursorindexingignore',
        '.claude', 'CLAUDE.md',
        '.codex', 'AGENTS.md',
        '.continue', '.continuerules',
        '.windsurf', '.windsurfrules',
        '.copilot', '.codeium', '.cody', '.tabnine', '.ai',
      ],
      filePattern: /^\.aider/,
      nestedPaths: [
        'docs/ai',
        'ai-docs',
        '.github/copilot-instructions.md',
        '.github/chatmodes',
        '.github/prompts',
        '.cursor/rules',
        '.cursor/mcp.json',
        '.claude/settings.json',
        '.claude/agents',
        '.claude/commands',
      ],
    },
    hasLocal: true,
  },
  {
    name: 'cursor',
    category: 'ai',
    detection: {
      files: ['.cursor', '.cursorrules', '.cursorignore', '.cursorindexingignore'],
      nestedPaths: ['.cursor/rules', '.cursor/mcp.json'],
    },
    hasLocal: true,
  },
  {
    name: 'claude',
    category: 'ai',
    detection: {
      files: ['.claude', 'CLAUDE.md'],
      nestedPaths: ['.claude/settings.json', '.claude/agents', '.claude/commands'],
    },
    hasLocal: true,
  },
  {
    name: 'aider',
    category: 'ai',
    detection: { filePattern: /^\.aider/ },
    hasLocal: true,
  },
  {
    name: 'codex',
    category: 'ai',
    detection: { files: ['.codex', 'AGENTS.md'] },
    hasLocal: true,
  },
  {
    name: 'continue',
    category: 'ai',
    detection: { files: ['.continue', '.continuerules'] },
    hasLocal: true,
  },
  {
    name: 'windsurf',
    category: 'ai',
    detection: { files: ['.windsurf', '.windsurfrules'] },
    hasLocal: true,
  },
  {
    name: 'copilot',
    category: 'ai',
    detection: {
      files: ['.copilot'],
      nestedPaths: [
        '.github/copilot-instructions.md',
        '.github/chatmodes',
        '.github/prompts',
      ],
    },
    hasLocal: true,
  },
];

// ----------------------------------------------------------------------------
// Derived lookups (built once at import time)
// ----------------------------------------------------------------------------

const byName: Map<string, StackMeta> = new Map(
  STACKS.map(s => [s.name, s])
);

export function getStack(name: string): StackMeta | undefined {
  return byName.get(name.toLowerCase().trim());
}

export function listStackNames(): string[] {
  return STACKS.map(s => s.name);
}

/** Returns the set of stack ids that gitignore.io accepts. */
export function getValidApiStacks(): Set<string> {
  return new Set(STACKS.filter(s => s.validInApi).map(s => s.name));
}

/** Returns the file/dir name -> stacks map. */
export function buildFileDetectionMap(): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const stack of STACKS) {
    for (const file of stack.detection?.files ?? []) {
      const list = map.get(file) ?? [];
      if (!list.includes(stack.name)) list.push(stack.name);
      map.set(file, list);
    }
  }
  return map;
}

/** Returns extension (e.g. ".ts") -> stacks map. */
export function buildExtensionDetectionMap(): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const stack of STACKS) {
    for (const ext of stack.detection?.extensions ?? []) {
      const key = ext.toLowerCase();
      const list = map.get(key) ?? [];
      if (!list.includes(stack.name)) list.push(stack.name);
      map.set(key, list);
    }
  }
  return map;
}

/** Returns the nested path -> stacks map. */
export function buildNestedPathDetectionMap(): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const stack of STACKS) {
    for (const p of stack.detection?.nestedPaths ?? []) {
      const list = map.get(p) ?? [];
      if (!list.includes(stack.name)) list.push(stack.name);
      map.set(p, list);
    }
  }
  return map;
}

/** Returns regex patterns paired with the stacks they trigger. */
export function getRegexDetections(): Array<{ pattern: RegExp; stacks: string[] }> {
  const out: Array<{ pattern: RegExp; stacks: string[] }> = [];
  for (const stack of STACKS) {
    if (stack.detection?.filePattern) {
      out.push({ pattern: stack.detection.filePattern, stacks: [stack.name] });
    }
  }
  return out;
}

/**
 * All hidden filenames (starting with ".") that detection cares about.
 * Scanner uses this to decide whether to surface hidden entries.
 */
export function getAllowedHiddenNames(): Set<string> {
  const out = new Set<string>();
  for (const stack of STACKS) {
    for (const f of stack.detection?.files ?? []) {
      if (f.startsWith('.')) out.add(f);
    }
    for (const p of stack.detection?.nestedPaths ?? []) {
      // Surface the top-level segment if it is a hidden dir
      const top = p.split('/')[0];
      if (top.startsWith('.')) out.add(top);
    }
  }
  return out;
}

/** Hidden filename prefixes always allowed (e.g. ".aider*"). */
export function getAllowedHiddenPrefixes(): string[] {
  // Today only AI tooling needs this. Kept dynamic for future extensions.
  return ['.aider'];
}
