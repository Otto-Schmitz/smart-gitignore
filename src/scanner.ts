import * as fs from 'fs';
import * as path from 'path';

/**
 * Escaneia o diretório atual procurando por arquivos e diretórios
 * que indicam a stack tecnológica do projeto
 */
export class Scanner {
  private readonly rootDir: string;

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
  }

  /**
   * Escaneia o diretório e retorna lista de arquivos encontrados
   */
  public scan(): string[] {
    const foundFiles: string[] = [];
    
    try {
      const entries = fs.readdirSync(this.rootDir, { withFileTypes: true });
      
      // Lista de arquivos/diretórios ocultos que devem ser incluídos para detecção
      const allowedHiddenFiles = [
        '.env', '.env.local', '.env.development', '.env.production',
        '.idea', '.vscode', '.dockerignore', '.ruby-version',
        '.eclipse', '.settings', '.project', '.classpath'
      ];
      
      for (const entry of entries) {
        const fullPath = path.join(this.rootDir, entry.name);
        
        // Ignora arquivos ocultos (exceto os importantes para detecção)
        if (entry.name.startsWith('.') && 
            !allowedHiddenFiles.includes(entry.name)) {
          continue;
        }
        
        if (entry.isDirectory()) {
          foundFiles.push(entry.name);
        } else if (entry.isFile()) {
          foundFiles.push(entry.name);
        }
      }
    } catch (error) {
      throw new Error(`Erro ao escanear diretório: ${error}`);
    }
    
    return foundFiles;
  }

  /**
   * Verifica se um arquivo ou diretório existe
   */
  public exists(fileOrDir: string): boolean {
    const fullPath = path.join(this.rootDir, fileOrDir);
    return fs.existsSync(fullPath);
  }

  /**
   * Retorna o caminho completo de um arquivo ou diretório
   */
  public getFullPath(fileOrDir: string): string {
    return path.join(this.rootDir, fileOrDir);
  }
}

