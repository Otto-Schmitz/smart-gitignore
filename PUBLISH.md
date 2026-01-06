# Guia de Publicação no NPM

## 📋 Checklist Pré-Publicação

### 1. ✅ Configurações Básicas
- [x] `package.json` configurado
- [x] `LICENSE` (MIT) presente
- [x] `README.md` completo
- [x] `.npmignore` configurado
- [ ] **Autor preenchido** no `package.json`
- [ ] **Repository URL** configurado (opcional mas recomendado)

### 2. ✅ Código
- [x] Código compilado (`npm run build`)
- [x] Sem erros de lint
- [x] Binário com permissão de execução
- [x] Templates locais incluídos

### 3. ⚠️ Antes de Publicar

#### 3.1. Atualizar Informações no `package.json`
Edite o `package.json` e preencha:
- `author`: Seu nome e email
- `repository.url`: URL do seu repositório Git (se tiver)
- `bugs.url`: URL para reportar bugs
- `homepage`: URL da página do projeto

#### 3.2. Verificar Nome do Pacote
O nome `smart-gitignore` pode já estar em uso. Verifique:
```bash
npm search smart-gitignore
```

Se estiver ocupado, você pode:
- Usar um nome com escopo: `@seu-usuario/smart-gitignore`
- Ou escolher outro nome: `smart-gitignore-cli`, `auto-gitignore`, etc.

#### 3.3. Testar o Pacote Localmente
```bash
# Testar o que será publicado
npm pack --dry-run

# Criar um pacote local para testar
npm pack
tar -xzf smart-gitignore-1.0.0.tgz
cd package
npm install
node dist/index.js --help
```

## 🚀 Passos para Publicar

### Passo 1: Criar Conta no NPM (se não tiver)
1. Acesse: https://www.npmjs.com/signup
2. Crie uma conta gratuita

### Passo 2: Fazer Login no NPM
```bash
npm login
```
Você será solicitado a inserir:
- Username
- Password
- Email
- OTP (se tiver 2FA habilitado)

### Passo 3: Verificar Informações
```bash
# Ver quem está logado
npm whoami

# Ver informações do pacote
npm view smart-gitignore
```

### Passo 4: Verificar se o Nome Está Disponível
```bash
npm search smart-gitignore
# ou
npm view smart-gitignore
```

Se retornar 404, o nome está disponível! ✅

### Passo 5: Compilar o Projeto
```bash
npm run build
```

### Passo 6: Testar o Pacote (Dry Run)
```bash
# Ver o que será publicado
npm pack --dry-run

# Testar instalação local
npm pack
npm install -g ./smart-gitignore-1.0.0.tgz
smart-gitignore --help
npm uninstall -g smart-gitignore
```

### Passo 7: Publicar
```bash
# Publicar na primeira vez
npm publish

# Para publicar com escopo (se usar @seu-usuario/smart-gitignore)
npm publish --access public
```

### Passo 8: Verificar Publicação
```bash
# Ver seu pacote publicado
npm view smart-gitignore

# Testar instalação
npx smart-gitignore --help
```

## 📝 Atualizações Futuras

Para publicar uma nova versão:

1. **Atualizar versão** no `package.json`:
   ```bash
   npm version patch  # 1.0.0 -> 1.0.1
   npm version minor  # 1.0.0 -> 1.1.0
   npm version major  # 1.0.0 -> 2.0.0
   ```

2. **Ou editar manualmente** o `package.json`:
   ```json
   "version": "1.0.1"
   ```

3. **Compilar e publicar**:
   ```bash
   npm run build
   npm publish
   ```

## 🔒 Publicação com Escopo (Recomendado)

Se quiser usar um nome com escopo (mais seguro):

1. **Atualizar `package.json`**:
   ```json
   "name": "@seu-usuario/smart-gitignore"
   ```

2. **Publicar com acesso público**:
   ```bash
   npm publish --access public
   ```

3. **Usuários instalam com**:
   ```bash
   npx @seu-usuario/smart-gitignore
   ```

## ⚠️ Problemas Comuns

### Nome já está em uso
- Use um nome com escopo: `@seu-usuario/smart-gitignore`
- Ou escolha outro nome

### Erro de autenticação
```bash
npm login
npm whoami  # Verificar se está logado
```

### Erro de permissão
- Verifique se você é o dono do pacote
- Ou use um nome com escopo

### Pacote muito grande
- Verifique o `.npmignore`
- Remova arquivos desnecessários do `files` no `package.json`

## 📚 Recursos Úteis

- [Documentação NPM](https://docs.npmjs.com/)
- [Guia de Publicação NPM](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)

## ✅ Comandos Rápidos

```bash
# Login
npm login

# Verificar login
npm whoami

# Compilar
npm run build

# Testar publicação (dry run)
npm pack --dry-run

# Publicar
npm publish

# Publicar com escopo
npm publish --access public

# Atualizar versão e publicar
npm version patch && npm publish
```

---

**Boa sorte com a publicação! 🚀**

