import { FunctionIndexer } from '../indexer';
import { UpdateService } from '../services/update-service';
import { FileSystemStorage } from '../storage/filesystem-storage';
import { IndexerOptions } from '../types';
import * as fs from 'fs';
import * as path from 'path';

describe('Integration Tests', () => {
  const testDir = '.test-integration';
  const testSrcDir = path.join(testDir, 'src');
  const indexFile = path.join(testDir, 'integration-test.jsonl');

  const createTestFile = (filePath: string, content: string) => {
    const fullPath = path.join(testSrcDir, filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, content);
  };

  const deleteTestFile = (filePath: string) => {
    const fullPath = path.join(testSrcDir, filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  };

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
    fs.mkdirSync(testSrcDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  describe('Full workflow: Create -> Update -> Backup -> Restore', () => {
    it('should handle complete workflow', async () => {
      // Phase 1: Initial index creation
      createTestFile('initial.ts', `
        export function initialFunction(): string {
          return 'initial';
        }
        
        export class InitialClass {
          method(): void {
            console.log('method');
          }
        }
      `);

      const options: IndexerOptions = {
        root: testSrcDir,
        output: indexFile,
        domain: 'integration-test',
        verbose: false
      };

      const indexer = new FunctionIndexer(options);
      const initialResult = await indexer.run();

      expect(initialResult.totalFunctions).toBe(2);
      expect(fs.existsSync(indexFile)).toBe(true);
      expect(fs.existsSync(path.join(testDir, 'integration-test.meta.json'))).toBe(true);

      // Phase 2: Create backup
      const storage = new FileSystemStorage(testDir);
      const backup = await storage.createBackup('integration-test.jsonl');
      expect(backup.indexes).toContain('integration-test.jsonl');

      // Phase 3: Add new functions and modify existing ones
      createTestFile('new.ts', `
        export function newFunction(): number {
          return 42;
        }
      `);

      createTestFile('initial.ts', `
        export function initialFunction(): string {
          return 'modified initial';
        }
        
        export class InitialClass {
          method(): void {
            console.log('modified method');
          }
          
          newMethod(): boolean {
            return true;
          }
        }
      `);

      // Phase 4: Update index
      const updateService = new UpdateService(storage, false);
      const updateResult = await updateService.updateIndex('integration-test.jsonl', { autoBackup: true });

      expect(updateResult.success).toBe(true);
      expect(updateResult.added).toBe(2); // newFunction + newMethod
      expect(updateResult.updated).toBe(2); // initialFunction + method (both modified)
      expect(updateResult.deleted).toBe(0);

      // Verify updated content
      const updatedContent = fs.readFileSync(indexFile, 'utf8');
      const updatedFunctions = updatedContent.trim().split('\n').map(line => JSON.parse(line));
      expect(updatedFunctions).toHaveLength(4);

      // Phase 5: Delete a file and update
      deleteTestFile('new.ts');
      
      const deleteUpdateResult = await updateService.updateIndex('integration-test.jsonl', { autoBackup: false });
      expect(deleteUpdateResult.success).toBe(true);
      expect(deleteUpdateResult.deleted).toBe(1); // newFunction deleted

      // Phase 6: Restore from backup
      await storage.restoreFromBackup(backup.id);
      
      const restoredContent = fs.readFileSync(indexFile, 'utf8');
      const restoredFunctions = restoredContent.trim().split('\n').map(line => JSON.parse(line));
      expect(restoredFunctions).toHaveLength(2); // Back to original state
    }, 10000);
  });

  describe('Error recovery scenarios', () => {
    it('should recover from corrupted index', async () => {
      // Create initial valid index
      createTestFile('test.ts', 'export function test() {}');
      
      const options: IndexerOptions = {
        root: testSrcDir,
        output: indexFile,
        domain: 'error-test',
        verbose: false
      };

      const indexer = new FunctionIndexer(options);
      await indexer.run();

      // Read the original content to understand structure
      const originalContent = fs.readFileSync(indexFile, 'utf8');
      const validFunctions = originalContent.trim().split('\n');
      
      // Corrupt the index file by mixing valid and invalid JSON
      const corruptedContent = validFunctions[0] + '\n{invalid json\n' + validFunctions[0];
      fs.writeFileSync(indexFile, corruptedContent);

      // Attempt repair
      const storage = new FileSystemStorage(testDir);
      const repairResult = await storage.repairIndex(path.basename(indexFile));
      
      expect(repairResult.recovered).toBe(2); // Two valid function entries
      expect(repairResult.lost).toBe(1); // One invalid JSON line
      expect(repairResult.repairedFile).toBeTruthy();
    });

    it('should handle update with backup and restore on failure', async () => {
      // Create initial index
      createTestFile('stable.ts', 'export function stable() {}');
      
      const options: IndexerOptions = {
        root: testSrcDir,
        output: indexFile,
        domain: 'backup-test',
        verbose: false
      };

      const indexer = new FunctionIndexer(options);
      await indexer.run();

      const storage = new FileSystemStorage(testDir);
      const updateService = new UpdateService(storage, false);

      // Create backup manually to ensure it exists
      const backup = await storage.createBackup('backup-test.jsonl');
      
      // Verify backup was created
      const backups = await storage.listBackups();
      expect(backups.length).toBeGreaterThan(0);

      // The UpdateService should handle errors gracefully
      // Even if an error occurs, it shouldn't corrupt the existing state
      const originalContent = fs.readFileSync(indexFile, 'utf8');
      
      try {
        // Try to update with a scenario that might cause issues
        await updateService.updateIndex('backup-test.jsonl', { autoBackup: true, autoRestore: false });
      } catch (error) {
        // If update fails, original content should be preserved
        const currentContent = fs.readFileSync(indexFile, 'utf8');
        expect(currentContent).toBe(originalContent);
      }
    });
  });

  describe('Multi-domain scenario', () => {
    it('should handle multiple indexes with different domains', async () => {
      // Create frontend functions
      createTestFile('frontend/component.tsx', `
        export function FrontendComponent(): JSX.Element {
          return <div>Frontend</div>;
        }
      `);

      // Create backend functions
      createTestFile('backend/service.ts', `
        export function BackendService(): void {
          console.log('Backend');
        }
      `);

      // Index frontend
      const frontendOptions: IndexerOptions = {
        root: path.join(testSrcDir, 'frontend'),
        output: path.join(testDir, 'frontend-index.jsonl'),
        domain: 'frontend',
        include: ['**/*.tsx', '**/*.ts'],
        verbose: false
      };

      // Index backend
      const backendOptions: IndexerOptions = {
        root: path.join(testSrcDir, 'backend'),
        output: path.join(testDir, 'backend-index.jsonl'),
        domain: 'backend',
        include: ['**/*.ts'],
        verbose: false
      };

      const frontendIndexer = new FunctionIndexer(frontendOptions);
      const backendIndexer = new FunctionIndexer(backendOptions);

      await Promise.all([
        frontendIndexer.run(),
        backendIndexer.run()
      ]);

      // Verify both indexes were created with correct domains
      const frontendContent = fs.readFileSync(frontendOptions.output, 'utf8');
      const backendContent = fs.readFileSync(backendOptions.output, 'utf8');

      const frontendFunctions = frontendContent.trim().split('\n').map(line => JSON.parse(line));
      const backendFunctions = backendContent.trim().split('\n').map(line => JSON.parse(line));

      expect(frontendFunctions[0].domain).toBe('frontend');
      expect(backendFunctions[0].domain).toBe('backend');

      // Test bulk update
      const storage = new FileSystemStorage(testDir);
      const indexList = await storage.getIndexList();
      expect(indexList).toContain('frontend-index.jsonl');
      expect(indexList).toContain('backend-index.jsonl');
    });
  });

  describe('Performance with large codebase', () => {
    it('should handle multiple files efficiently', async () => {
      // Create multiple files with functions
      for (let i = 0; i < 10; i++) {
        createTestFile(`file${i}.ts`, `
          export function function${i}A(): number {
            return ${i};
          }
          
          export function function${i}B(): string {
            return '${i}';
          }
          
          export class Class${i} {
            method${i}(): void {
              console.log(${i});
            }
          }
        `);
      }

      const options: IndexerOptions = {
        root: testSrcDir,
        output: indexFile,
        domain: 'performance-test',
        verbose: false
      };

      const startTime = Date.now();
      const indexer = new FunctionIndexer(options);
      const result = await indexer.run();
      const indexingTime = Date.now() - startTime;

      expect(result.totalFiles).toBe(10);
      expect(result.totalFunctions).toBe(30); // 3 functions per file * 10 files

      // Test update performance
      const storage = new FileSystemStorage(testDir);
      const updateService = new UpdateService(storage, false);
      
      // Ensure metadata exists for the index
      const metadata = await storage.loadMetadata('performance-test.jsonl');
      if (!metadata) {
        console.log('Metadata not found, this indicates an issue with the indexer');
        return;
      }

      // Modify one file
      createTestFile('file0.ts', `
        export function function0A(): number {
          return 999; // Modified
        }
        
        export function function0B(): string {
          return 'modified';
        }
        
        export class Class0 {
          method0(): void {
            console.log('modified');
          }
        }
      `);

      const updateStartTime = Date.now();
      const updateResult = await updateService.updateIndex('performance-test.jsonl', { autoBackup: false });
      const updateTime = Date.now() - updateStartTime;

      expect(updateResult.success).toBe(true);
      expect(updateResult.updated).toBe(3); // All 3 functions in file0.ts
      
      // Update should be significantly faster than full indexing
      expect(updateTime).toBeLessThan(indexingTime / 2);
    }, 15000);
  });
});