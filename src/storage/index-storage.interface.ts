import { FunctionInfo } from '../types';

export interface IndexMetadata {
  version: string;
  createdAt: string;
  lastUpdated: string;
  indexFile: string;
  options: {
    root: string;
    domain: string;
    include: string[];
    exclude: string[];
  };
  statistics: {
    totalFiles: number;
    totalFunctions: number;
  };
  fileHashes?: Record<string, string>;
}

export interface BackupInfo {
  id: string;
  timestamp: string;
  size: number;
  indexes: string[];
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  recoverable?: boolean;
}

export interface RepairResult {
  recovered: number;
  lost: number;
  repairedFile?: string;
}

export enum ExportFormat {
  JSONL = 'jsonl',
  JSON = 'json',
  CSV = 'csv'
}

export interface IndexStorage {
  // Basic operations
  loadIndex(identifier: string): Promise<FunctionInfo[]>;
  saveIndex(identifier: string, functions: FunctionInfo[]): Promise<void>;
  loadMetadata(identifier: string): Promise<IndexMetadata | null>;
  saveMetadata(identifier: string, metadata: IndexMetadata): Promise<void>;
  
  // List operations
  getIndexList(): Promise<string[]>;
  indexExists(identifier: string): Promise<boolean>;
  
  // Export/Import
  exportToFile(identifier: string, format: ExportFormat): Promise<string>;
  importFromFile(filePath: string, identifier: string): Promise<void>;
  
  // Backup/Restore
  createBackup(identifier?: string): Promise<BackupInfo>;
  restoreFromBackup(backupId: string): Promise<void>;
  listBackups(): Promise<BackupInfo[]>;
  
  // Validation
  validateIndex(identifier: string): Promise<ValidationResult>;
  repairIndex(identifier: string): Promise<RepairResult>;
}