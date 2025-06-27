import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { FunctionInfo } from '../types';
import { 
  IndexStorage, 
  IndexMetadata, 
  BackupInfo, 
  ValidationResult, 
  RepairResult,
  ExportFormat 
} from './index-storage.interface';
import { SafeFileWriter } from '../utils/safe-file-writer';
import { HistoryManager } from '../utils/history-manager';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const exists = promisify(fs.exists);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const copyFile = promisify(fs.copyFile);
const mkdir = promisify(fs.mkdir);

export class FileSystemStorage implements IndexStorage {
  private safeWriter: SafeFileWriter;
  private historyManager: HistoryManager;
  private baseDir: string;

  constructor(baseDir: string = '.') {
    this.baseDir = baseDir;
    this.safeWriter = new SafeFileWriter();
    this.historyManager = new HistoryManager();
  }

  private getIndexPath(identifier: string): string {
    return path.join(this.baseDir, identifier);
  }

  private getMetadataPath(identifier: string): string {
    const indexPath = this.getIndexPath(identifier);
    const dir = path.dirname(indexPath);
    const basename = path.basename(indexPath, path.extname(indexPath));
    return path.join(dir, `${basename}.meta.json`);
  }

  async loadIndex(identifier: string): Promise<FunctionInfo[]> {
    const indexPath = this.getIndexPath(identifier);
    
    if (!await exists(indexPath)) {
      throw new Error(`Index file not found: ${identifier}`);
    }

    const content = await readFile(indexPath, 'utf8');
    const lines = content.trim().split('\n').filter(line => line);
    const functions: FunctionInfo[] = [];

    for (let i = 0; i < lines.length; i++) {
      try {
        const func = JSON.parse(lines[i]);
        functions.push(func);
      } catch (error) {
        console.warn(`Warning: Invalid JSON at line ${i + 1} in ${identifier}`);
      }
    }

    return functions;
  }

  async saveIndex(identifier: string, functions: FunctionInfo[]): Promise<void> {
    const indexPath = this.getIndexPath(identifier);
    const content = functions.map(f => JSON.stringify(f)).join('\n');
    
    await this.safeWriter.writeAtomic(indexPath, content);
  }

  async loadMetadata(identifier: string): Promise<IndexMetadata | null> {
    const metadataPath = this.getMetadataPath(identifier);
    
    if (!await exists(metadataPath)) {
      return null;
    }

    const content = await readFile(metadataPath, 'utf8');
    return JSON.parse(content) as IndexMetadata;
  }

  async saveMetadata(identifier: string, metadata: IndexMetadata): Promise<void> {
    const metadataPath = this.getMetadataPath(identifier);
    const content = JSON.stringify(metadata, null, 2);
    
    await this.safeWriter.writeAtomic(metadataPath, content);
  }

  async getIndexList(): Promise<string[]> {
    const files = await readdir(this.baseDir);
    return files.filter(f => f.endsWith('.jsonl'));
  }

  async indexExists(identifier: string): Promise<boolean> {
    const indexPath = this.getIndexPath(identifier);
    return await exists(indexPath);
  }

  async exportToFile(identifier: string, format: ExportFormat): Promise<string> {
    const functions = await this.loadIndex(identifier);
    const metadata = await this.loadMetadata(identifier);
    
    let content: string;
    let extension: string;

    switch (format) {
      case ExportFormat.JSONL:
        content = functions.map(f => JSON.stringify(f)).join('\n');
        extension = '.jsonl';
        break;
      
      case ExportFormat.JSON:
        content = JSON.stringify({ metadata, functions }, null, 2);
        extension = '.json';
        break;
      
      case ExportFormat.CSV:
        content = this.convertToCSV(functions);
        extension = '.csv';
        break;
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    const exportPath = `${identifier}.export${extension}`;
    await writeFile(exportPath, content, 'utf8');
    
    return exportPath;
  }

  async importFromFile(filePath: string, identifier: string): Promise<void> {
    if (!await exists(filePath)) {
      throw new Error(`Import file not found: ${filePath}`);
    }

    const content = await readFile(filePath, 'utf8');
    const extension = path.extname(filePath);

    let functions: FunctionInfo[];

    switch (extension) {
      case '.jsonl':
        functions = content.trim().split('\n')
          .filter(line => line)
          .map(line => JSON.parse(line));
        break;
      
      case '.json': {
        const data = JSON.parse(content);
        functions = data.functions || data;
        break;
      }
      
      default:
        throw new Error(`Unsupported import format: ${extension}`);
    }

    await this.saveIndex(identifier, functions);
  }

  async createBackup(identifier?: string): Promise<BackupInfo> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(this.baseDir, '.backups', timestamp);
    
    if (!fs.existsSync(backupDir)) {
      await mkdir(backupDir, { recursive: true });
    }

    const indexes: string[] = [];
    let totalSize = 0;

    if (identifier) {
      // Backup specific index
      await this.backupIndex(identifier, backupDir);
      indexes.push(identifier);
      totalSize += await this.getFileSize(this.getIndexPath(identifier));
    } else {
      // Backup all indexes
      const allIndexes = await this.getIndexList();
      for (const index of allIndexes) {
        await this.backupIndex(index, backupDir);
        indexes.push(index);
        totalSize += await this.getFileSize(this.getIndexPath(index));
      }
    }

    // Save backup manifest
    const manifest = {
      id: timestamp,
      timestamp: new Date().toISOString(),
      indexes,
      size: totalSize
    };

    await writeFile(
      path.join(backupDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2),
      'utf8'
    );

    return {
      id: timestamp,
      timestamp: manifest.timestamp,
      size: totalSize,
      indexes
    };
  }

  async restoreFromBackup(backupId: string): Promise<void> {
    const backupDir = path.join(this.baseDir, '.backups', backupId);
    
    if (!await exists(backupDir)) {
      throw new Error(`Backup not found: ${backupId}`);
    }

    const manifestPath = path.join(backupDir, 'manifest.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

    for (const index of manifest.indexes) {
      const backupIndexPath = path.join(backupDir, index);
      const targetIndexPath = this.getIndexPath(index);
      
      if (await exists(backupIndexPath)) {
        await copyFile(backupIndexPath, targetIndexPath);
      }

      // Restore metadata if exists
      const backupMetaPath = path.join(backupDir, `${path.basename(index, '.jsonl')}.meta.json`);
      if (await exists(backupMetaPath)) {
        const targetMetaPath = this.getMetadataPath(index);
        await copyFile(backupMetaPath, targetMetaPath);
      }
    }
  }

  async listBackups(): Promise<BackupInfo[]> {
    const backupsDir = path.join(this.baseDir, '.backups');
    
    if (!await exists(backupsDir)) {
      return [];
    }

    const dirs = await readdir(backupsDir);
    const backups: BackupInfo[] = [];

    for (const dir of dirs) {
      const manifestPath = path.join(backupsDir, dir, 'manifest.json');
      if (await exists(manifestPath)) {
        const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
        backups.push({
          id: manifest.id,
          timestamp: manifest.timestamp,
          size: manifest.size,
          indexes: manifest.indexes
        });
      }
    }

    return backups.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  async validateIndex(identifier: string): Promise<ValidationResult> {
    const indexPath = this.getIndexPath(identifier);
    
    if (!await exists(indexPath)) {
      return {
        valid: false,
        error: 'Index file not found',
        recoverable: false
      };
    }

    try {
      const content = await readFile(indexPath, 'utf8');
      const lines = content.trim().split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        if (!lines[i]) continue;
        
        try {
          const func = JSON.parse(lines[i]);
          if (!this.isValidFunction(func)) {
            return {
              valid: false,
              error: `Invalid function structure at line ${i + 1}`,
              recoverable: true
            };
          }
        } catch (e) {
          return {
            valid: false,
            error: `Invalid JSON at line ${i + 1}: ${e instanceof Error ? e.message : String(e)}`,
            recoverable: true
          };
        }
      }
      
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : String(error),
        recoverable: false
      };
    }
  }

  async repairIndex(identifier: string): Promise<RepairResult> {
    const indexPath = this.getIndexPath(identifier);
    const validFunctions: FunctionInfo[] = [];
    let lostCount = 0;

    try {
      const content = await readFile(indexPath, 'utf8');
      const lines = content.trim().split('\n');
      
      for (const line of lines) {
        if (!line) continue;
        
        try {
          const func = JSON.parse(line);
          if (this.isValidFunction(func)) {
            validFunctions.push(func);
          } else {
            lostCount++;
          }
        } catch (e) {
          lostCount++;
        }
      }

      if (validFunctions.length > 0) {
        const repairedPath = `${identifier}.repaired`;
        await this.saveIndex(repairedPath, validFunctions);
        
        return {
          recovered: validFunctions.length,
          lost: lostCount,
          repairedFile: repairedPath
        };
      }

      return {
        recovered: 0,
        lost: lostCount
      };
    } catch (error) {
      throw new Error(`Failed to repair index: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async backupIndex(identifier: string, backupDir: string): Promise<void> {
    const indexPath = this.getIndexPath(identifier);
    const metadataPath = this.getMetadataPath(identifier);
    
    if (await exists(indexPath)) {
      await copyFile(indexPath, path.join(backupDir, identifier));
    }
    
    if (await exists(metadataPath)) {
      const metaName = path.basename(metadataPath);
      await copyFile(metadataPath, path.join(backupDir, metaName));
    }
  }

  private async getFileSize(filePath: string): Promise<number> {
    try {
      const stats = await stat(filePath);
      return stats.size;
    } catch {
      return 0;
    }
  }

  private isValidFunction(obj: unknown): obj is FunctionInfo {
    if (!obj || typeof obj !== 'object') return false;
    
    const record = obj as Record<string, unknown>;
    return typeof record.file === 'string' &&
      typeof record.identifier === 'string' &&
      typeof record.signature === 'string' &&
      typeof record.startLine === 'number' &&
      typeof record.endLine === 'number' &&
      typeof record.hash_function === 'string' &&
      typeof record.hash_file === 'string' &&
      typeof record.exported === 'boolean' &&
      typeof record.async === 'boolean' &&
      record.metrics !== null &&
      typeof record.metrics === 'object' &&
      typeof record.domain === 'string';
  }

  private convertToCSV(functions: FunctionInfo[]): string {
    const headers = [
      'file',
      'identifier',
      'signature',
      'startLine',
      'endLine',
      'hash_function',
      'hash_file',
      'exported',
      'async',
      'linesOfCode',
      'parameterCount',
      'hasReturnType',
      'domain'
    ];

    const rows = functions.map(f => [
      f.file,
      f.identifier,
      `"${f.signature.replace(/"/g, '""')}"`,
      f.startLine,
      f.endLine,
      f.hash_function,
      f.hash_file,
      f.exported,
      f.async,
      f.metrics.linesOfCode || '',
      f.metrics.parameterCount || '',
      f.metrics.hasReturnType || '',
      f.domain
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
}