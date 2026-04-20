# smart-gitignore

[![npm](https://img.shields.io/npm/v/smart-gitignore.svg)](https://www.npmjs.com/package/smart-gitignore?activeTab=readme)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

Smart `.gitignore` generator based on automatic detection of your project's technology stack.

## 🎯 Purpose

`smart-gitignore` automatically analyzes your project directory, detects the technologies used (Java, Node.js, Docker, Ruby, IDEs, etc.) and generates or updates an appropriate `.gitignore` file using templates from [GitHub/gitignore](https://github.com/github/gitignore) (primary source), with fallback to [gitignore.io](https://www.toptal.com/developers/gitignore) and local templates.

### Why use it?

- ✅ **Automatic detection**: No need to know which stacks to add manually
- ✅ **Smart merge**: Preserves existing comments and rules
- ✅ **No duplicates**: Automatically removes duplicate entries
- ✅ **Robust fallback**: GitHub → gitignore.io → local templates
- ✅ **Updated templates**: Uses official GitHub/gitignore templates
- ✅ **Extensible**: Easy to add new detections

## 🚀 How to Use

### Global Installation (Optional)

```bash
npm install -g smart-gitignore
```

### Usage via npx (Recommended)

```bash
npx smart-gitignore
```

### Options

```bash
npx smart-gitignore [options]

Options:
  -d, --dir <path>    Directory to scan (default: current directory)
  -f, --force         Overwrite existing .gitignore without merging
  -v, --verbose       Verbose mode
  -h, --help          Display help
  -V, --version       Display version
```

### Examples

```bash
# Generate .gitignore in current directory
npx smart-gitignore

# Scan specific directory
npx smart-gitignore --dir /path/to/project

# Overwrite existing .gitignore
npx smart-gitignore --force

# Verbose mode for debugging
npx smart-gitignore --verbose
```

## 🔍 Stack Detection

`smart-gitignore` automatically detects the following technologies:

### Languages & Frameworks
- **Java**: `pom.xml`, `build.gradle`, `.java` files
- **Node.js**: `package.json`, `yarn.lock`, `pnpm-lock.yaml`, `package-lock.json`
- **Ruby**: `Gemfile`, `Rakefile`, `.ruby-version`
- **Python**: `requirements.txt`, `Pipfile`, `pyproject.toml`, `manage.py`
- **Go**: `go.mod`, `go.sum`
- **Rust**: `Cargo.toml`, `Cargo.lock`
- **PHP**: `composer.json`, `composer.lock`
- **.NET**: `.csproj`, `.sln`, `project.json`

### Tools & Environments
- **Maven**: `pom.xml`
- **Gradle**: `build.gradle`, `settings.gradle`
- **Docker**: `Dockerfile`, `docker-compose.yml`
- **Yarn**: `yarn.lock`
- **pnpm**: `pnpm-lock.yaml`
- **npm**: `package-lock.json`

### IDEs
- **IntelliJ IDEA**: `.idea/`
- **VS Code**: `.vscode/`
- **Eclipse**: `.eclipse/`, `.settings/`, `.project`, `.classpath`

### AI Assistants & Tooling
- **Cursor**: `.cursor/`, `.cursorrules`, `.cursorignore`, `.cursorindexingignore`
- **Claude Code**: `.claude/`, `CLAUDE.md`
- **Aider**: `.aider*` (`.aider.conf.yml`, `.aider.chat.history.md`, ...)
- **OpenAI Codex**: `.codex/`, `AGENTS.md`
- **Continue.dev**: `.continue/`, `.continuerules`
- **Windsurf**: `.windsurf/`, `.windsurfrules`
- **GitHub Copilot**: `.copilot/`, `.github/copilot-instructions.md`
- **Outros**: `.codeium/`, `.cody/`, `.tabnine/`, `.ai/`, `docs/ai/`, `ai-docs/`

> Os templates mantêm intencionalmente os artefatos compartilháveis
> (regras, prompts, hooks, `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`,
> `.cursor/mcp.json`, `.aider.conf.yml`, `config.yaml` do Continue, etc.)
> e ignoram apenas dados locais: históricos de chat, sessões, caches,
> logs, vetores/embeddings e configurações pessoais (`*.local.*`).

### Others
- **dotenv**: `.env`, `.env.local`, `.env.development`, `.env.production`

## 📁 Project Structure

```
smart-gitignore/
├── src/
│   ├── scanner.ts        # File detection in directory
│   ├── detector.ts       # File → stack mapping
│   ├── generator.ts      # API call + fallback
│   ├── merger.ts         # Safe .gitignore merge
│   └── index.ts          # CLI entrypoint
├── templates/            # Local fallback templates
│   ├── default.gitignore
│   ├── node.gitignore
│   └── java.gitignore
├── dist/                 # Compiled code (generated)
├── package.json
├── tsconfig.json
├── README.md
└── LICENSE
```

## 🔧 Development

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/Otto-Schmitz/smart-gitignore.git
cd smart-gitignore

# Install dependencies
npm install

# Compile TypeScript
npm run build

# Run locally
npm run dev
```

### Available Scripts

```bash
npm run build      # Compile TypeScript to JavaScript
npm run start      # Run compiled version
npm run dev        # Run with ts-node (development)
```
## 🤝 Contributing

Contributions are welcome! Feel free to:

1. **Report bugs**: Open an [issue](https://github.com/Otto-Schmitz/smart-gitignore/issues) describing the problem
2. **Suggest features**: Share your ideas in an issue
3. **Submit PRs**: 
   - Fork the project
   - Create a branch for your feature (`git checkout -b feature/new-feature`)
   - Commit your changes (`git commit -m 'Add new feature'`)
   - Push to the branch (`git push origin feature/new-feature`)
   - Open a Pull Request

### Adding New Detections

To add a new stack detection, edit `src/detector.ts`:

```typescript
private readonly detectionMap: Map<string, string[]> = new Map([
  // ... existing detections
  ['your-file.ext', ['your-stack']],
]);
```

### Adding Local Templates

Add `.gitignore` files in the `templates/` folder with the stack name:

```
templates/
  └── your-stack.gitignore
```

## 📝 License

This project is licensed under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [GitHub/gitignore](https://github.com/github/gitignore) for the official templates
- [gitignore.io](https://www.toptal.com/developers/gitignore) for the API and templates
- Open-source community for inspiration and feedback

## 🌐 GitHub Pages

The repo includes a dedicated page in `docs/` for [GitHub Pages](https://pages.github.com/):

1. In the repository, go to **Settings** → **Pages**.
2. Under **Source**, choose **Deploy from a branch**.
3. Under **Branch**, select `main` and the **/docs** folder.
4. Save. The page will be available at `https://<your-username>.github.io/smart-gitignore/`.

The page includes a project overview, how to use, and a **commit history** in real time (via GitHub API).

## 📧 Contact

For questions, suggestions, or issues, open an [issue](https://github.com/Otto-Schmitz/smart-gitignore/issues) on GitHub.

---

Made with ❤️ by the open-source community
