#!/usr/bin/env node

import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { Scanner } from './scanner';
import { Detector } from './detector';
import { Generator } from './generator';
import { Merger } from './merger';

const program = new Command();

program
  .name('smart-gitignore')
  .description('Gerador inteligente de arquivos .gitignore baseado na detecção automática da stack')
  .version('1.0.0')
  .option('-d, --dir <path>', 'Diretório para escanear (padrão: diretório atual)', process.cwd())
  .option('-f, --force', 'Sobrescrever .gitignore existente sem fazer merge', false)
  .option('-v, --verbose', 'Modo verboso', false)
  .action(async (options) => {
    try {
      await run(options);
    } catch (error) {
      console.error('❌ Erro:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

async function run(options: { dir: string; force: boolean; verbose: boolean }) {
  const { dir, force, verbose } = options;
  const gitignorePath = path.join(dir, '.gitignore');

  if (verbose) {
    console.log(`📂 Escaneando diretório: ${dir}`);
  }

  // 1. Escanear diretório
  const scanner = new Scanner(dir);
  const detector = new Detector(scanner);

  if (verbose) {
    console.log('🔍 Detectando stacks...');
  }

  // 2. Detectar stacks
  const detectedStacks = detector.detectStacks();

  if (detectedStacks.length === 0) {
    console.log('⚠️  Nenhuma stack detectada. Gerando .gitignore padrão...');
  } else {
    console.log(`✅ Stacks detectadas: ${detectedStacks.join(', ')}`);
  }

  // 3. Gerar conteúdo
  if (verbose) {
    console.log('🌐 Buscando template do gitignore.io...');
  }

  const generator = new Generator();
  
  // Filtra stacks válidas antes de gerar (para mostrar apenas as que serão usadas)
  const validStacks = generator.filterValidStacks(detectedStacks);
  if (validStacks.length < detectedStacks.length && verbose) {
    const invalidStacks = detectedStacks.filter(s => !validStacks.includes(s));
    console.log(`ℹ️  Stacks filtradas (não válidas na API): ${invalidStacks.join(', ')}`);
    console.log(`📋 Usando stacks válidas: ${validStacks.join(', ')}`);
  }
  
  const newContent = await generator.generate(detectedStacks);

  // 4. Fazer merge se necessário
  const merger = new Merger();
  let finalContent: string;

  if (fs.existsSync(gitignorePath) && !force) {
    if (verbose) {
      console.log('🔄 Fazendo merge com .gitignore existente...');
    }
    const existingContent = merger.readExisting(gitignorePath);
    finalContent = merger.merge(existingContent, newContent, detectedStacks);
    console.log('✅ .gitignore atualizado com sucesso!');
  } else {
    if (verbose && force) {
      console.log('⚠️  Modo force ativado, sobrescrevendo .gitignore...');
    }
    const header = merger.generateHeader(detectedStacks);
    finalContent = header + newContent;
    console.log('✅ .gitignore criado com sucesso!');
  }

  // 5. Escrever arquivo
  merger.write(gitignorePath, finalContent);

  if (verbose) {
    console.log(`📝 Arquivo salvo em: ${gitignorePath}`);
  }
}

program.parse();

