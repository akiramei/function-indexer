import { Project, SourceFile, FunctionDeclaration, MethodDeclaration, ArrowFunction, FunctionExpression, VariableStatement, SyntaxKind, ClassDeclaration } from 'ts-morph';
import { glob } from 'glob';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { FunctionInfo, IndexerOptions, IndexerResult, IndexerError, FunctionMetrics } from './types';
import { FileSystemStorage } from './storage/filesystem-storage';
import { IndexMetadata } from './storage/index-storage.interface';
import { MetricsCalculator } from './utils/metrics-calculator';

export class FunctionIndexer {
  private project: Project;
  private options: IndexerOptions;
  private errors: IndexerError[] = [];
  private storage: FileSystemStorage;
  private fileHashes: Record<string, string> = {};

  constructor(options: IndexerOptions) {
    this.options = options;
    this.project = new Project({
      tsConfigFilePath: this.findTsConfig(),
      skipAddingFilesFromTsConfig: true,
      skipFileDependencyResolution: true,
      skipLoadingLibFiles: true
    });
    this.storage = new FileSystemStorage(path.dirname(options.output));
  }

  private findTsConfig(): string | undefined {
    const candidates = [
      path.join(this.options.root, 'tsconfig.json'),
      path.join(process.cwd(), 'tsconfig.json')
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
    return undefined;
  }

  async run(): Promise<IndexerResult> {
    const startTime = Date.now();
    const functions: FunctionInfo[] = [];

    try {
      // ファイル一覧を取得
      const files = await this.findTypeScriptFiles();
      
      if (this.options.verbose) {
        console.log(`Found ${files.length} TypeScript files`);
      }

      // 各ファイルを処理
      for (const filePath of files) {
        try {
          const fileFunctions = await this.processFile(filePath);
          functions.push(...fileFunctions);
          
          // Store file hash for metadata
          const fileContent = await fs.promises.readFile(filePath, 'utf8');
          this.fileHashes[path.relative(process.cwd(), filePath)] = this.calculateHash(fileContent);
          
          if (this.options.verbose && fileFunctions.length > 0) {
            console.log(`  ${filePath}: ${fileFunctions.length} functions`);
          }
        } catch (error) {
          this.errors.push({
            file: filePath,
            message: error instanceof Error ? error.message : String(error),
            severity: 'error'
          });
        }
      }

      // JSONL形式で出力
      await this.writeOutput(functions);
      
      // Save metadata
      await this.saveMetadata(files.length, functions.length);

      return {
        totalFiles: files.length,
        totalFunctions: functions.length,
        processedFiles: files,
        errors: this.errors,
        executionTime: Date.now() - startTime
      };

    } catch (error) {
      throw new Error(`Indexing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async findTypeScriptFiles(): Promise<string[]> {
    const includePatterns = this.options.include || ['**/*.ts', '**/*.tsx'];
    const excludePatterns = this.options.exclude || ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**'];

    const allFiles: Set<string> = new Set();

    // Include patterns
    for (const pattern of includePatterns) {
      const files = await glob(pattern, {
        cwd: this.options.root,
        absolute: true,
        ignore: excludePatterns
      });
      files.forEach(file => allFiles.add(file));
    }

    return Array.from(allFiles).filter(file => {
      // 追加の検証
      const relativePath = path.relative(this.options.root, file);
      return !relativePath.startsWith('..') && fs.existsSync(file);
    });
  }

  async processFile(filePath: string): Promise<FunctionInfo[]> {
    const sourceFile = this.project.addSourceFileAtPath(filePath);
    const fileContent = sourceFile.getFullText();
    const fileHash = this.calculateHash(fileContent);
    const relativePath = path.relative(process.cwd(), filePath);

    const functions: FunctionInfo[] = [];

    try {
      // Function declarations
      sourceFile.getFunctions().forEach(func => {
        const info = this.extractFunctionInfo(func, relativePath, fileHash, sourceFile);
        if (info) functions.push(info);
      });

      // Method declarations (class methods)
      sourceFile.getClasses().forEach(cls => {
        cls.getMethods().forEach(method => {
          const info = this.extractMethodInfo(method, relativePath, fileHash, sourceFile);
          if (info) functions.push(info);
        });
      });

      // Arrow functions and function expressions assigned to variables
      this.extractVariableFunctions(sourceFile, relativePath, fileHash).forEach(info => {
        functions.push(info);
      });

    } finally {
      // メモリリークを防ぐためファイルを削除
      this.project.removeSourceFile(sourceFile);
    }

    return functions;
  }

  private extractFunctionInfo(
    func: FunctionDeclaration,
    relativePath: string,
    fileHash: string,
    sourceFile: SourceFile
  ): FunctionInfo | null {
    const name = func.getName();
    if (!name) return null;

    const signature = this.getFunctionSignature(func);
    const functionBody = func.getBody()?.getFullText() || '';
    const functionHash = this.calculateHash(functionBody);

    return {
      file: relativePath,
      identifier: name,
      signature,
      startLine: func.getStartLineNumber(),
      endLine: func.getEndLineNumber(),
      hash_function: functionHash,
      hash_file: fileHash,
      exported: func.isExported(),
      async: func.isAsync(),
      metrics: this.calculateMetrics(func, functionBody),
      domain: this.options.domain
    };
  }

  private extractMethodInfo(
    method: MethodDeclaration,
    relativePath: string,
    fileHash: string,
    sourceFile: SourceFile
  ): FunctionInfo | null {
    const name = method.getName();
    if (!name) return null;

    const className = method.getParent()?.getSymbol()?.getName() || 'Unknown';
    const fullName = `${className}.${name}`;
    const signature = this.getMethodSignature(method, className);
    const methodBody = method.getBody()?.getFullText() || '';
    const functionHash = this.calculateHash(methodBody);

    // クラスのエクスポート状態を安全に取得
    const parent = method.getParent();
    let isClassExported = false;
    if (parent && parent.getKind() === SyntaxKind.ClassDeclaration) {
      isClassExported = (parent as ClassDeclaration).isExported();
    }

    return {
      file: relativePath,
      identifier: fullName,
      signature,
      startLine: method.getStartLineNumber(),
      endLine: method.getEndLineNumber(),
      hash_function: functionHash,
      hash_file: fileHash,
      exported: isClassExported,
      async: method.isAsync(),
      metrics: this.calculateMetrics(method, methodBody),
      domain: this.options.domain
    };
  }

  private extractVariableFunctions(
    sourceFile: SourceFile,
    relativePath: string,
    fileHash: string
  ): FunctionInfo[] {
    const functions: FunctionInfo[] = [];

    sourceFile.getVariableStatements().forEach(stmt => {
      stmt.getDeclarations().forEach(decl => {
        const initializer = decl.getInitializer();
        if (!initializer) return;

        const name = decl.getName();
        let functionNode: ArrowFunction | FunctionExpression | null = null;

        if (initializer.getKind() === SyntaxKind.ArrowFunction) {
          functionNode = initializer as ArrowFunction;
        } else if (initializer.getKind() === SyntaxKind.FunctionExpression) {
          functionNode = initializer as FunctionExpression;
        }

        if (functionNode) {
          const signature = this.getArrowFunctionSignature(name, functionNode);
          const functionBody = functionNode.getBody()?.getFullText() || '';
          const functionHash = this.calculateHash(functionBody);

          functions.push({
            file: relativePath,
            identifier: name,
            signature,
            startLine: functionNode.getStartLineNumber(),
            endLine: functionNode.getEndLineNumber(),
            hash_function: functionHash,
            hash_file: fileHash,
            exported: stmt.isExported(),
            async: functionNode.isAsync(),
            metrics: this.calculateMetrics(functionNode, functionBody),
            domain: this.options.domain
          });
        }
      });
    });

    return functions;
  }

  private getFunctionSignature(func: FunctionDeclaration): string {
    const name = func.getName() || 'anonymous';
    const params = func.getParameters().map(p => p.getText()).join(', ');
    const returnType = func.getReturnTypeNode()?.getText() || 'void';
    const asyncModifier = func.isAsync() ? 'async ' : '';
    
    return `${asyncModifier}${name}(${params}): ${returnType}`;
  }

  private getMethodSignature(method: MethodDeclaration, className: string): string {
    const name = method.getName();
    const params = method.getParameters().map(p => p.getText()).join(', ');
    const returnType = method.getReturnTypeNode()?.getText() || 'void';
    const asyncModifier = method.isAsync() ? 'async ' : '';
    const accessibility = method.getScope() || 'public';
    
    return `${accessibility} ${asyncModifier}${className}.${name}(${params}): ${returnType}`;
  }

  private getArrowFunctionSignature(name: string, func: ArrowFunction | FunctionExpression): string {
    const params = func.getParameters().map(p => p.getText()).join(', ');
    const returnType = func.getReturnTypeNode()?.getText() || 'any';
    const asyncModifier = func.isAsync() ? 'async ' : '';
    
    return `${asyncModifier}${name} = (${params}): ${returnType} => {...}`;
  }

  private calculateMetrics(node: any, functionBody: string): FunctionMetrics {
    return MetricsCalculator.calculateMetrics(node, functionBody);
  }

  private calculateHash(content: string): string {
    const normalized = content
      .replace(/\s+/g, ' ')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
      .trim();
    
    return crypto
      .createHash('sha256')
      .update(normalized)
      .digest('hex')
      .substring(0, 8);
  }

  private async writeOutput(functions: FunctionInfo[]): Promise<void> {
    const lines = functions.map(func => JSON.stringify(func));
    const content = lines.join('\n');
    
    await fs.promises.writeFile(this.options.output, content, 'utf8');
  }
  
  private async saveMetadata(totalFiles: number, totalFunctions: number): Promise<void> {
    const metadata: IndexMetadata = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      indexFile: path.basename(this.options.output),
      options: {
        root: this.options.root,
        domain: this.options.domain,
        include: this.options.include || ['**/*.ts', '**/*.tsx'],
        exclude: this.options.exclude || ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**']
      },
      statistics: {
        totalFiles,
        totalFunctions
      },
      fileHashes: this.fileHashes
    };
    
    await this.storage.saveMetadata(path.basename(this.options.output), metadata);
  }

  /**
   * 生成されたJSONLファイルから関数情報を読み込み
   */
  async getStoredFunctions(): Promise<FunctionInfo[]> {
    if (!fs.existsSync(this.options.output)) {
      return [];
    }

    const content = await fs.promises.readFile(this.options.output, 'utf8');
    const lines = content.trim().split('\n').filter(line => line.trim().length > 0);
    
    return lines.map((line, index) => {
      try {
        return JSON.parse(line) as FunctionInfo;
      } catch (error) {
        throw new Error(`Invalid JSON on line ${index + 1}: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
}