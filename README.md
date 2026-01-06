# smart-gitignore

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

Gerador inteligente de arquivos `.gitignore` baseado na detecção automática da stack tecnológica do projeto.

## 🎯 Propósito

O `smart-gitignore` analisa automaticamente o diretório do seu projeto, detecta as tecnologias utilizadas (Java, Node.js, Docker, Ruby, IDEs, etc.) e gera ou atualiza um arquivo `.gitignore` apropriado usando os templates do [GitHub/gitignore](https://github.com/github/gitignore) (fonte principal), com fallback para [gitignore.io](https://www.toptal.com/developers/gitignore) e templates locais.

### Por que usar?

- ✅ **Detecção automática**: Não precisa saber quais stacks adicionar manualmente
- ✅ **Merge inteligente**: Preserva comentários e regras existentes
- ✅ **Sem duplicatas**: Remove automaticamente entradas duplicadas
- ✅ **Fallback robusto**: GitHub → gitignore.io → templates locais
- ✅ **Templates atualizados**: Usa os templates oficiais do GitHub/gitignore
- ✅ **Extensível**: Fácil de adicionar novas detecções

## 🚀 Como Usar

### Instalação Global (Opcional)

```bash
npm install -g smart-gitignore
```

### Uso via npx (Recomendado)

```bash
npx smart-gitignore
```

### Opções

```bash
npx smart-gitignore [opções]

Opções:
  -d, --dir <path>    Diretório para escanear (padrão: diretório atual)
  -f, --force         Sobrescrever .gitignore existente sem fazer merge
  -v, --verbose       Modo verboso
  -h, --help          Exibir ajuda
  -V, --version       Exibir versão
```

### Exemplos

```bash
# Gerar .gitignore no diretório atual
npx smart-gitignore

# Escanear diretório específico
npx smart-gitignore --dir /caminho/do/projeto

# Sobrescrever .gitignore existente
npx smart-gitignore --force

# Modo verboso para debug
npx smart-gitignore --verbose
```

## 🔍 Detecção de Stacks

O `smart-gitignore` detecta automaticamente as seguintes tecnologias:

### Linguagens & Frameworks
- **Java**: `pom.xml`, `build.gradle`, arquivos `.java`
- **Node.js**: `package.json`, `yarn.lock`, `pnpm-lock.yaml`, `package-lock.json`
- **Ruby**: `Gemfile`, `Rakefile`, `.ruby-version`
- **Python**: `requirements.txt`, `Pipfile`, `pyproject.toml`, `manage.py`
- **Go**: `go.mod`, `go.sum`
- **Rust**: `Cargo.toml`, `Cargo.lock`
- **PHP**: `composer.json`, `composer.lock`
- **.NET**: `.csproj`, `.sln`, `project.json`

### Ferramentas & Ambientes
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

### Outros
- **dotenv**: `.env`, `.env.local`, `.env.development`, `.env.production`

## 📁 Estrutura do Projeto

```
smart-gitignore/
├── src/
│   ├── scanner.ts        # Detecção de arquivos no diretório
│   ├── detector.ts       # Mapeamento arquivo → stack
│   ├── generator.ts      # Chamada à API + fallback
│   ├── merger.ts         # Merge seguro do .gitignore
│   └── index.ts          # Entrypoint CLI
├── templates/            # Templates fallback locais
│   ├── default.gitignore
│   ├── node.gitignore
│   └── java.gitignore
├── dist/                 # Código compilado (gerado)
├── package.json
├── tsconfig.json
├── README.md
└── LICENSE
```

## 🔧 Desenvolvimento

### Pré-requisitos

- Node.js >= 18.0.0
- npm ou yarn

### Setup

```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/smart-gitignore.git
cd smart-gitignore

# Instalar dependências
npm install

# Compilar TypeScript
npm run build

# Executar localmente
npm run dev
```

### Scripts Disponíveis

```bash
npm run build      # Compila TypeScript para JavaScript
npm run start      # Executa a versão compilada
npm run dev        # Executa com ts-node (desenvolvimento)
```

## 🗺️ Roadmap

### Versão 1.0 (MVP) ✅
- [x] Detecção automática de stacks
- [x] Integração com API gitignore.io
- [x] Fallback para templates locais
- [x] Merge inteligente de .gitignore existente
- [x] Remoção de duplicatas
- [x] Preservação de comentários do usuário

### Versão 1.1 (Planejado)
- [ ] Suporte para mais linguagens (Kotlin, Swift, Dart, etc.)
- [ ] Cache de templates da API
- [ ] Modo interativo para seleção de stacks
- [ ] Validação de .gitignore existente

### Versão 2.0 (Futuro)
- [ ] Extensão para VS Code
- [ ] Plugin para IntelliJ IDEA
- [ ] Integração com Git hooks
- [ ] API REST para uso em CI/CD
- [ ] Suporte para múltiplos .gitignore (subdiretórios)

## 🤝 Como Contribuir

Contribuições são bem-vindas! Sinta-se à vontade para:

1. **Reportar bugs**: Abra uma [issue](https://github.com/seu-usuario/smart-gitignore/issues) descrevendo o problema
2. **Sugerir features**: Compartilhe suas ideias em uma issue
3. **Enviar PRs**: 
   - Fork o projeto
   - Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
   - Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
   - Push para a branch (`git push origin feature/nova-feature`)
   - Abra um Pull Request

### Adicionando Novas Detecções

Para adicionar uma nova detecção de stack, edite `src/detector.ts`:

```typescript
private readonly detectionMap: Map<string, string[]> = new Map([
  // ... detecções existentes
  ['seu-arquivo.ext', ['sua-stack']],
]);
```

### Adicionando Templates Locais

Adicione arquivos `.gitignore` na pasta `templates/` com o nome da stack:

```
templates/
  └── sua-stack.gitignore
```

## 📝 Licença

Este projeto está licenciado sob a [MIT License](LICENSE).

## 🙏 Agradecimentos

- [gitignore.io](https://www.toptal.com/developers/gitignore) pela API e templates
- Comunidade open-source por inspiração e feedback

## 📧 Contato

Para dúvidas, sugestões ou problemas, abra uma [issue](https://github.com/seu-usuario/smart-gitignore/issues) no GitHub.

---

Feito com ❤️ pela comunidade open-source

