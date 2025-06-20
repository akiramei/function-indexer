import { FileSystemStorage } from '../storage/filesystem-storage';
import { IndexMetadata, ExportFormat } from '../storage/index-storage.interface';
import { FunctionInfo } from '../types';
import * as fs from 'fs';
import * as path from 'path';

describe('FileSystemStorage', () => {
  const testDir = '.test-storage';
  let storage: FileSystemStorage;

  const mockFunction: FunctionInfo = {
    file: 'test.ts',
    identifier: 'testFunction',
    signature: 'function testFunction(): void',
    startLine: 1,
    endLine: 3,
    hash_function: 'abc123',
    hash_file: 'def456',
    exported: true,
    async: false,
    metrics: {
      linesOfCode: 3,
      parameterCount: 0,
      hasReturnType: false
    },
    domain: 'test'
  };

  const mockMetadata: IndexMetadata = {
    version: '1.0.0',
    createdAt: '2025-01-20T10:00:00Z',
    lastUpdated: '2025-01-20T10:00:00Z',
    indexFile: 'test-index.jsonl',
    options: {
      root: './test-src',
      domain: 'test',
      include: ['**/*.ts'],
      exclude: ['**/*.test.ts']
    },
    statistics: {
      totalFiles: 1,
      totalFunctions: 1
    }
  };

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
    storage = new FileSystemStorage(testDir);
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  describe('saveIndex and loadIndex', () => {
    it('should save and load function index', async () => {
      const functions = [mockFunction];
      
      await storage.saveIndex('test-index.jsonl', functions);
      const loaded = await storage.loadIndex('test-index.jsonl');
      
      expect(loaded).toHaveLength(1);
      expect(loaded[0]).toMatchObject(mockFunction);
    });

    it('should handle empty index', async () => {
      await storage.saveIndex('empty-index.jsonl', []);
      const loaded = await storage.loadIndex('empty-index.jsonl');
      
      expect(loaded).toHaveLength(0);
    });

    it('should throw error for non-existent index', async () => {
      await expect(storage.loadIndex('nonexistent.jsonl')).rejects.toThrow('Index file not found');
    });
  });

  describe('saveMetadata and loadMetadata', () => {
    it('should save and load metadata', async () => {
      await storage.saveMetadata('test-index.jsonl', mockMetadata);
      const loaded = await storage.loadMetadata('test-index.jsonl');
      
      expect(loaded).toMatchObject(mockMetadata);
    });

    it('should return null for non-existent metadata', async () => {
      const loaded = await storage.loadMetadata('nonexistent.jsonl');
      expect(loaded).toBeNull();
    });
  });

  describe('indexExists', () => {
    it('should return true for existing index', async () => {
      await storage.saveIndex('existing.jsonl', [mockFunction]);
      const exists = await storage.indexExists('existing.jsonl');
      expect(exists).toBe(true);
    });

    it('should return false for non-existent index', async () => {
      const exists = await storage.indexExists('nonexistent.jsonl');
      expect(exists).toBe(false);
    });
  });

  describe('getIndexList', () => {
    it('should return list of index files', async () => {
      await storage.saveIndex('index1.jsonl', [mockFunction]);
      await storage.saveIndex('index2.jsonl', [mockFunction]);
      
      // Create a non-index file
      fs.writeFileSync(path.join(testDir, 'readme.txt'), 'test');
      
      const list = await storage.getIndexList();
      expect(list).toHaveLength(2);
      expect(list).toContain('index1.jsonl');
      expect(list).toContain('index2.jsonl');
      expect(list).not.toContain('readme.txt');
    });
  });

  describe('validateIndex', () => {
    it('should validate correct index', async () => {
      await storage.saveIndex('valid.jsonl', [mockFunction]);
      const result = await storage.validateIndex('valid.jsonl');
      
      expect(result.valid).toBe(true);
    });

    it('should detect invalid JSON', async () => {
      const invalidContent = '{"invalid": json}\n{"valid": "json"}';
      fs.writeFileSync(path.join(testDir, 'invalid.jsonl'), invalidContent);
      
      const result = await storage.validateIndex('invalid.jsonl');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid JSON');
      expect(result.recoverable).toBe(true);
    });

    it('should detect missing file', async () => {
      const result = await storage.validateIndex('missing.jsonl');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Index file not found');
      expect(result.recoverable).toBe(false);
    });
  });

  describe('repairIndex', () => {
    it('should repair corrupted index', async () => {
      const mixedContent = JSON.stringify(mockFunction) + '\n' +
                          '{"invalid": json}\n' +
                          JSON.stringify(mockFunction);
      
      fs.writeFileSync(path.join(testDir, 'corrupted.jsonl'), mixedContent);
      
      const result = await storage.repairIndex('corrupted.jsonl');
      expect(result.recovered).toBe(2);
      expect(result.lost).toBe(1);
      expect(result.repairedFile).toBe('corrupted.jsonl.repaired');
      
      // Check repaired file
      const repairedContent = fs.readFileSync(path.join(testDir, 'corrupted.jsonl.repaired'), 'utf8');
      const repairedLines = repairedContent.trim().split('\n');
      expect(repairedLines).toHaveLength(2);
    });
  });

  describe('exportToFile', () => {
    beforeEach(async () => {
      await storage.saveIndex('export-test.jsonl', [mockFunction]);
      await storage.saveMetadata('export-test.jsonl', mockMetadata);
    });

    it('should export to JSONL format', async () => {
      const exportPath = await storage.exportToFile('export-test.jsonl', ExportFormat.JSONL);
      
      expect(fs.existsSync(exportPath)).toBe(true);
      expect(exportPath).toContain('.export.jsonl');
      
      const content = fs.readFileSync(exportPath, 'utf8');
      expect(content).toContain(mockFunction.identifier);
    });

    it('should export to JSON format', async () => {
      const exportPath = await storage.exportToFile('export-test.jsonl', ExportFormat.JSON);
      
      expect(fs.existsSync(exportPath)).toBe(true);
      expect(exportPath).toContain('.export.json');
      
      const content = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
      expect(content.functions).toHaveLength(1);
      expect(content.metadata).toMatchObject(mockMetadata);
    });

    it('should export to CSV format', async () => {
      const exportPath = await storage.exportToFile('export-test.jsonl', ExportFormat.CSV);
      
      expect(fs.existsSync(exportPath)).toBe(true);
      expect(exportPath).toContain('.export.csv');
      
      const content = fs.readFileSync(exportPath, 'utf8');
      const lines = content.split('\n');
      expect(lines[0]).toContain('file,identifier,signature'); // Headers
      expect(lines[1]).toContain(mockFunction.identifier);
    });
  });

  describe('backup and restore', () => {
    beforeEach(async () => {
      await storage.saveIndex('backup-test.jsonl', [mockFunction]);
      await storage.saveMetadata('backup-test.jsonl', mockMetadata);
    });

    it('should create backup', async () => {
      const backup = await storage.createBackup('backup-test.jsonl');
      
      expect(backup.id).toBeTruthy();
      expect(backup.indexes).toContain('backup-test.jsonl');
      expect(backup.size).toBeGreaterThan(0);
      
      // Check backup directory exists
      const backupDir = path.join(testDir, '.backups', backup.id);
      expect(fs.existsSync(backupDir)).toBe(true);
      expect(fs.existsSync(path.join(backupDir, 'backup-test.jsonl'))).toBe(true);
      expect(fs.existsSync(path.join(backupDir, 'manifest.json'))).toBe(true);
    });

    it('should create backup of all indexes', async () => {
      await storage.saveIndex('another-index.jsonl', [mockFunction]);
      
      const backup = await storage.createBackup();
      
      expect(backup.indexes).toHaveLength(2);
      expect(backup.indexes).toContain('backup-test.jsonl');
      expect(backup.indexes).toContain('another-index.jsonl');
    });

    it('should list backups', async () => {
      await storage.createBackup('backup-test.jsonl');
      await storage.createBackup('backup-test.jsonl');
      
      const backups = await storage.listBackups();
      expect(backups).toHaveLength(2);
      expect(backups[0].timestamp).toBeDefined();
    });

    it('should restore from backup', async () => {
      const backup = await storage.createBackup('backup-test.jsonl');
      
      // Modify the original
      const modifiedFunction = { ...mockFunction, identifier: 'modifiedFunction' };
      await storage.saveIndex('backup-test.jsonl', [modifiedFunction]);
      
      // Restore from backup
      await storage.restoreFromBackup(backup.id);
      
      const restored = await storage.loadIndex('backup-test.jsonl');
      expect(restored[0].identifier).toBe(mockFunction.identifier);
    });
  });
});