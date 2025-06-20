import { UpdateService } from '../services/update-service';
import { FileSystemStorage } from '../storage/filesystem-storage';
import { FunctionInfo } from '../types';
import { IndexMetadata } from '../storage/index-storage.interface';
import * as fs from 'fs';
import * as path from 'path';

describe('UpdateService', () => {
  const testDir = '.test-update-service';
  const testSrcDir = path.join(testDir, 'src');
  let storage: FileSystemStorage;
  let updateService: UpdateService;

  const createTestFile = (filePath: string, content: string) => {
    const fullPath = path.join(testSrcDir, filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, content);
  };

  const mockMetadata: IndexMetadata = {
    version: '1.0.0',
    createdAt: '2025-01-20T10:00:00Z',
    lastUpdated: '2025-01-20T10:00:00Z',
    indexFile: 'test-index.jsonl',
    options: {
      root: testSrcDir,
      domain: 'test',
      include: ['**/*.ts'],
      exclude: ['**/*.test.ts']
    },
    statistics: {
      totalFiles: 1,
      totalFunctions: 1
    },
    fileHashes: {}
  };

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
    fs.mkdirSync(testSrcDir, { recursive: true });
    
    storage = new FileSystemStorage(testDir);
    updateService = new UpdateService(storage, false); // Non-verbose for tests
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  describe('updateIndex', () => {
    it('should detect and add new functions', async () => {
      // Create initial state with no functions
      const initialFunctions: FunctionInfo[] = [];
      await storage.saveIndex('test-index.jsonl', initialFunctions);
      await storage.saveMetadata('test-index.jsonl', {
        ...mockMetadata,
        fileHashes: {}
      });

      // Create a new file with functions
      createTestFile('newFile.ts', `
        export function newFunction(): void {
          console.log('new');
        }
      `);

      const result = await updateService.updateIndex('test-index.jsonl', { autoBackup: false });

      expect(result.success).toBe(true);
      expect(result.added).toBe(1);
      expect(result.updated).toBe(0);
      expect(result.deleted).toBe(0);
    });

    it('should detect and update modified functions', async () => {
      // Create initial file and index it
      createTestFile('existing.ts', `
        export function existingFunction(): void {
          console.log('original');
        }
      `);

      const mockFunction: FunctionInfo = {
        file: 'existing.ts',
        identifier: 'existingFunction',
        signature: 'existingFunction(): void',
        startLine: 2,
        endLine: 4,
        hash_function: 'original_hash',
        hash_file: 'file_hash',
        exported: true,
        async: false,
        metrics: { linesOfCode: 3, parameterCount: 0, hasReturnType: false },
        domain: 'test'
      };

      await storage.saveIndex('test-index.jsonl', [mockFunction]);
      
      // Calculate real file hash for the original content
      const originalContent = fs.readFileSync(path.join(testSrcDir, 'existing.ts'), 'utf8');
      const crypto = await import('crypto');
      const originalFileHash = crypto.createHash('sha256').update(originalContent).digest('hex').substring(0, 8);
      
      await storage.saveMetadata('test-index.jsonl', {
        ...mockMetadata,
        fileHashes: { 'existing.ts': originalFileHash }
      });

      // Modify the file
      createTestFile('existing.ts', `
        export function existingFunction(): void {
          console.log('modified');
          console.log('added line');
        }
      `);

      const result = await updateService.updateIndex('test-index.jsonl', { autoBackup: false });

      expect(result.success).toBe(true);
      expect(result.added).toBe(0);
      expect(result.updated).toBe(1);
      expect(result.deleted).toBe(0);
    });

    it('should detect and remove deleted functions', async () => {
      // Start with a function in the index
      const mockFunction: FunctionInfo = {
        file: 'toDelete.ts',
        identifier: 'deletedFunction',
        signature: 'deletedFunction(): void',
        startLine: 1,
        endLine: 3,
        hash_function: 'hash123',
        hash_file: 'filehash',
        exported: true,
        async: false,
        metrics: { linesOfCode: 3, parameterCount: 0, hasReturnType: false },
        domain: 'test'
      };

      await storage.saveIndex('test-index.jsonl', [mockFunction]);
      await storage.saveMetadata('test-index.jsonl', {
        ...mockMetadata,
        fileHashes: { 'toDelete.ts': 'filehash' }
      });

      // Don't create the file (simulating deletion)
      // The updateService should detect the file is missing

      const result = await updateService.updateIndex('test-index.jsonl', { autoBackup: false });

      expect(result.success).toBe(true);
      expect(result.added).toBe(0);
      expect(result.updated).toBe(0);
      expect(result.deleted).toBe(1);
    });

    it('should handle mixed changes (add, update, delete)', async () => {
      // Create initial state
      createTestFile('existing.ts', `
        export function existingFunction(): void {
          console.log('original');
        }
      `);

      const existingFunction: FunctionInfo = {
        file: 'existing.ts',
        identifier: 'existingFunction',
        signature: 'existingFunction(): void',
        startLine: 2,
        endLine: 4,
        hash_function: 'original_hash',
        hash_file: 'file_hash',
        exported: true,
        async: false,
        metrics: { linesOfCode: 3, parameterCount: 0, hasReturnType: false },
        domain: 'test'
      };

      const toDeleteFunction: FunctionInfo = {
        file: 'deleted.ts',
        identifier: 'deletedFunction',
        signature: 'deletedFunction(): void',
        startLine: 1,
        endLine: 3,
        hash_function: 'delete_hash',
        hash_file: 'delete_file_hash',
        exported: true,
        async: false,
        metrics: { linesOfCode: 3, parameterCount: 0, hasReturnType: false },
        domain: 'test'
      };

      await storage.saveIndex('test-index.jsonl', [existingFunction, toDeleteFunction]);
      
      // Calculate real file hash
      const originalContent = fs.readFileSync(path.join(testSrcDir, 'existing.ts'), 'utf8');
      const crypto = await import('crypto');
      const originalFileHash = crypto.createHash('sha256').update(originalContent).digest('hex').substring(0, 8);
      
      await storage.saveMetadata('test-index.jsonl', {
        ...mockMetadata,
        fileHashes: { 
          'existing.ts': originalFileHash,
          'deleted.ts': 'delete_file_hash'
        }
      });

      // Modify existing file
      createTestFile('existing.ts', `
        export function existingFunction(): void {
          console.log('modified');
        }
      `);

      // Add new file
      createTestFile('new.ts', `
        export function newFunction(): void {
          console.log('new');
        }
      `);

      // Don't create deleted.ts (it will be considered deleted)

      const result = await updateService.updateIndex('test-index.jsonl', { autoBackup: false });

      expect(result.success).toBe(true);
      expect(result.added).toBe(1); // newFunction
      expect(result.updated).toBe(1); // existingFunction
      expect(result.deleted).toBe(1); // deletedFunction
    });

    it('should handle errors gracefully', async () => {
      // Create metadata pointing to non-existent index
      await storage.saveMetadata('nonexistent.jsonl', mockMetadata);

      await expect(updateService.updateIndex('nonexistent.jsonl', { autoBackup: false }))
        .rejects.toThrow('Index file not found');
    });

    it('should create backup when autoBackup is enabled', async () => {
      const initialFunctions: FunctionInfo[] = [];
      await storage.saveIndex('test-index.jsonl', initialFunctions);
      await storage.saveMetadata('test-index.jsonl', mockMetadata);

      await updateService.updateIndex('test-index.jsonl', { autoBackup: true });

      const backups = await storage.listBackups();
      expect(backups.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should fail if no metadata exists', async () => {
      await storage.saveIndex('no-metadata.jsonl', []);

      await expect(updateService.updateIndex('no-metadata.jsonl'))
        .rejects.toThrow('No metadata found');
    });

    it('should fail if index validation fails', async () => {
      // Create invalid index
      fs.writeFileSync(path.join(testDir, 'invalid.jsonl'), 'invalid json content');
      await storage.saveMetadata('invalid.jsonl', mockMetadata);

      await expect(updateService.updateIndex('invalid.jsonl'))
        .rejects.toThrow('Index validation failed');
    });
  });
});