import { SafeFileWriter } from '../utils/safe-file-writer';
import * as fs from 'fs';
import * as path from 'path';

describe('SafeFileWriter', () => {
  const testDir = '.test-safe-writer';
  const testFile = path.join(testDir, 'test.txt');
  let writer: SafeFileWriter;

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
    writer = new SafeFileWriter();
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  describe('writeAtomic', () => {
    it('should write content to a new file', async () => {
      const content = 'Hello, World!';
      
      await writer.writeAtomic(testFile, content);
      
      expect(fs.existsSync(testFile)).toBe(true);
      expect(fs.readFileSync(testFile, 'utf8')).toBe(content);
    });

    it('should backup existing file before overwriting', async () => {
      const originalContent = 'Original content';
      const newContent = 'New content';
      
      // Create original file
      fs.writeFileSync(testFile, originalContent);
      
      // Write new content
      await writer.writeAtomic(testFile, newContent);
      
      expect(fs.readFileSync(testFile, 'utf8')).toBe(newContent);
      
      // Check that backup was created in history
      const historyDir = path.join(testDir, '.history');
      expect(fs.existsSync(historyDir)).toBe(true);
      
      const historyFiles = fs.readdirSync(historyDir);
      expect(historyFiles.length).toBeGreaterThan(0);
      expect(historyFiles.some(f => f.startsWith('test.txt.'))).toBe(true);
    });

    it('should rollback on write failure', async () => {
      const originalContent = 'Original content';
      fs.writeFileSync(testFile, originalContent);
      
      // Mock a write failure by creating an invalid path
      const invalidFile = path.join(testDir, 'invalid', 'deeply', 'nested', 'file.txt');
      
      await expect(writer.writeAtomic(invalidFile, 'new content')).rejects.toThrow();
      
      // Original file should still exist and be unchanged
      expect(fs.existsSync(testFile)).toBe(true);
      expect(fs.readFileSync(testFile, 'utf8')).toBe(originalContent);
    });

    it('should cleanup old backups when limit is exceeded', async () => {
      const content = 'Content ';
      
      // Create multiple versions to trigger cleanup
      for (let i = 0; i < 8; i++) {
        await writer.writeAtomic(testFile, content + i);
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      const historyDir = path.join(testDir, '.history');
      const historyFiles = fs.readdirSync(historyDir);
      
      // Should keep only the most recent 5 backups
      expect(historyFiles.length).toBeLessThanOrEqual(5);
    });
  });
});