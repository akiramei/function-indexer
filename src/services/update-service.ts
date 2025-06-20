import * as path from 'path';
import * as crypto from 'crypto';
import { FunctionInfo, IndexerOptions } from '../types';
import { IndexStorage, IndexMetadata } from '../storage/index-storage.interface';
import { FunctionIndexer } from '../indexer';
import { glob } from 'glob';

export interface UpdateResult {
  success: boolean;
  added: number;
  updated: number;
  deleted: number;
  errors: string[];
  executionTime: number;
}

export interface UpdateOptions {
  autoBackup?: boolean;
  autoRestore?: boolean;
  verbose?: boolean;
}

export class UpdateService {
  constructor(
    private storage: IndexStorage,
    private verbose: boolean = false
  ) {}

  async updateIndex(identifier: string, options: UpdateOptions = {}): Promise<UpdateResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      // 1. Load metadata
      const metadata = await this.storage.loadMetadata(identifier);
      if (!metadata) {
        throw new Error(`No metadata found for index: ${identifier}. Please recreate the index.`);
      }

      // 2. Validate index
      const validation = await this.storage.validateIndex(identifier);
      if (!validation.valid) {
        throw new Error(`Index validation failed: ${validation.error}`);
      }

      // 3. Create backup if enabled
      if (options.autoBackup) {
        await this.storage.createBackup(identifier);
        if (this.verbose) {
          console.log('Backup created successfully');
        }
      }

      // 4. Load existing index
      const existingFunctions = await this.storage.loadIndex(identifier);
      const existingMap = this.createFunctionMap(existingFunctions);

      // 5. Calculate file-level changes
      const fileChanges = await this.calculateFileChanges(metadata, existingFunctions);
      
      if (this.verbose) {
        console.log(`Files to add: ${fileChanges.added.length}`);
        console.log(`Files to update: ${fileChanges.modified.length}`);
        console.log(`Files to remove: ${fileChanges.deleted.length}`);
      }

      // 6. Process changes
      const updatedFunctions: FunctionInfo[] = [];
      const functionChanges = {
        added: 0,
        updated: 0,
        deleted: 0
      };

      // Process deleted files
      for (const file of fileChanges.deleted) {
        const functionsInFile = existingFunctions.filter(f => f.file === file);
        functionChanges.deleted += functionsInFile.length;
      }

      // Keep functions from unchanged files
      for (const func of existingFunctions) {
        if (!fileChanges.deleted.includes(func.file) && !fileChanges.modified.includes(func.file)) {
          updatedFunctions.push(func);
        }
      }

      // Process new and modified files
      const indexerOptions: IndexerOptions = {
        root: metadata.options.root,
        output: identifier,
        domain: metadata.options.domain,
        include: metadata.options.include,
        exclude: metadata.options.exclude,
        verbose: options.verbose
      };

      const indexer = new FunctionIndexer(indexerOptions);
      
      for (const file of [...fileChanges.added, ...fileChanges.modified]) {
        try {
          const newFunctions = await this.processFile(indexer, file, metadata.options.domain);
          
          if (fileChanges.modified.includes(file)) {
            // Compare functions for modified files
            const oldFunctions = existingFunctions.filter(f => f.file === file);
            const changes = this.compareFunctions(oldFunctions, newFunctions);
            
            functionChanges.added += changes.added.length;
            functionChanges.updated += changes.updated.length;
            functionChanges.deleted += changes.deleted.length;
            
            updatedFunctions.push(...newFunctions);
          } else {
            // All functions from new files are additions
            functionChanges.added += newFunctions.length;
            updatedFunctions.push(...newFunctions);
          }
          
        } catch (error) {
          errors.push(`Failed to process ${file}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      // 7. Save updated index
      await this.storage.saveIndex(identifier, updatedFunctions);

      // 8. Update metadata
      const updatedMetadata: IndexMetadata = {
        ...metadata,
        lastUpdated: new Date().toISOString(),
        statistics: {
          totalFiles: fileChanges.current.length,
          totalFunctions: updatedFunctions.length
        },
        fileHashes: await this.calculateFileHashes(fileChanges.current)
      };

      await this.storage.saveMetadata(identifier, updatedMetadata);

      return {
        success: true,
        added: functionChanges.added,
        updated: functionChanges.updated,
        deleted: functionChanges.deleted,
        errors,
        executionTime: Date.now() - startTime
      };

    } catch (error) {
      // Restore from backup if enabled
      if (options.autoRestore) {
        try {
          const backups = await this.storage.listBackups();
          if (backups.length > 0) {
            await this.storage.restoreFromBackup(backups[0].id);
            if (this.verbose) {
              console.log('Restored from backup due to error');
            }
          }
        } catch (restoreError) {
          errors.push(`Restore failed: ${restoreError instanceof Error ? restoreError.message : String(restoreError)}`);
        }
      }

      throw error;
    }
  }

  private async calculateFileChanges(
    metadata: IndexMetadata,
    existingFunctions: FunctionInfo[]
  ): Promise<{
    added: string[];
    modified: string[];
    deleted: string[];
    current: string[];
  }> {
    // Get current files matching the patterns
    const currentFiles = await this.findFiles(
      metadata.options.root,
      metadata.options.include,
      metadata.options.exclude
    );

    // Get files from existing index
    const existingFiles = new Set(existingFunctions.map(f => f.file));

    // Calculate changes
    const added: string[] = [];
    const modified: string[] = [];
    const deleted: string[] = [];

    // Find added and modified files
    for (const file of currentFiles) {
      const relativePath = path.relative(process.cwd(), file);
      
      if (!existingFiles.has(relativePath)) {
        added.push(relativePath);
      } else if (metadata.fileHashes) {
        // Check if file has been modified
        const currentHash = await this.calculateFileHash(file);
        const storedHash = metadata.fileHashes[relativePath];
        
        if (currentHash !== storedHash) {
          modified.push(relativePath);
        }
      }
    }

    // Find deleted files
    const currentRelativePaths = new Set(
      currentFiles.map(f => path.relative(process.cwd(), f))
    );
    
    for (const existingFile of existingFiles) {
      if (!currentRelativePaths.has(existingFile)) {
        deleted.push(existingFile);
      }
    }

    return {
      added,
      modified,
      deleted,
      current: currentFiles
    };
  }

  private async findFiles(
    root: string,
    include: string[],
    exclude: string[]
  ): Promise<string[]> {
    const allFiles: Set<string> = new Set();

    for (const pattern of include) {
      const files = await glob(pattern, {
        cwd: root,
        absolute: true,
        ignore: exclude
      });
      files.forEach(file => allFiles.add(file));
    }

    return Array.from(allFiles);
  }

  private async calculateFileHash(filePath: string): Promise<string> {
    const fs = await import('fs');
    const content = await fs.promises.readFile(filePath, 'utf8');
    
    return crypto
      .createHash('sha256')
      .update(content)
      .digest('hex')
      .substring(0, 16);
  }

  private async calculateFileHashes(files: string[]): Promise<Record<string, string>> {
    const hashes: Record<string, string> = {};
    
    for (const file of files) {
      const relativePath = path.relative(process.cwd(), file);
      hashes[relativePath] = await this.calculateFileHash(file);
    }
    
    return hashes;
  }

  private createFunctionMap(functions: FunctionInfo[]): Map<string, FunctionInfo> {
    const map = new Map<string, FunctionInfo>();
    
    for (const func of functions) {
      const key = `${func.file}:${func.identifier}`;
      map.set(key, func);
    }
    
    return map;
  }

  private compareFunctions(
    oldFunctions: FunctionInfo[],
    newFunctions: FunctionInfo[]
  ): {
    added: FunctionInfo[];
    updated: FunctionInfo[];
    deleted: FunctionInfo[];
  } {
    const oldMap = new Map<string, FunctionInfo>();
    const newMap = new Map<string, FunctionInfo>();

    oldFunctions.forEach(f => oldMap.set(f.identifier, f));
    newFunctions.forEach(f => newMap.set(f.identifier, f));

    const added: FunctionInfo[] = [];
    const updated: FunctionInfo[] = [];
    const deleted: FunctionInfo[] = [];

    // Find added and updated functions
    for (const [identifier, newFunc] of newMap) {
      const oldFunc = oldMap.get(identifier);
      
      if (!oldFunc) {
        added.push(newFunc);
      } else if (oldFunc.hash_function !== newFunc.hash_function) {
        updated.push(newFunc);
      }
    }

    // Find deleted functions
    for (const [identifier, oldFunc] of oldMap) {
      if (!newMap.has(identifier)) {
        deleted.push(oldFunc);
      }
    }

    return { added, updated, deleted };
  }

  private async processFile(
    indexer: any,
    filePath: string,
    domain: string
  ): Promise<FunctionInfo[]> {
    // Use the indexer's processFile method via reflection
    const absolutePath = path.isAbsolute(filePath) 
      ? filePath 
      : path.join(process.cwd(), filePath);
    
    const result = await indexer.processFile(absolutePath);
    return result.functions || result; // Handle both old and new return formats
  }
}