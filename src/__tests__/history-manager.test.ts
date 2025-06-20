import { HistoryManager } from '../utils/history-manager';
import * as fs from 'fs';
import * as path from 'path';

describe('HistoryManager', () => {
  const testDir = '.test-history';
  const testFile = path.join(testDir, 'test-index.jsonl');
  let historyManager: HistoryManager;

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
    historyManager = new HistoryManager({ maxVersions: 3, retentionDays: 1 });
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  describe('saveVersion', () => {
    it('should save a version of the index file', async () => {
      const content = '{"test": "data"}';
      fs.writeFileSync(testFile, content);
      
      const version = await historyManager.saveVersion(testFile);
      
      expect(version).toBe(1);
      
      const versions = await historyManager.getVersions(testFile);
      expect(versions.length).toBe(1);
      expect(versions[0].version).toBe(1);
      expect(fs.existsSync(versions[0].path)).toBe(true);
    });

    it('should create incremental version numbers', async () => {
      const content1 = '{"version": 1}';
      const content2 = '{"version": 2}';
      
      fs.writeFileSync(testFile, content1);
      const version1 = await historyManager.saveVersion(testFile);
      
      fs.writeFileSync(testFile, content2);
      const version2 = await historyManager.saveVersion(testFile);
      
      expect(version1).toBe(1);
      expect(version2).toBe(2);
      
      const versions = await historyManager.getVersions(testFile);
      expect(versions.length).toBe(2);
    });

    it('should throw error if file does not exist', async () => {
      const nonExistentFile = path.join(testDir, 'nonexistent.jsonl');
      
      await expect(historyManager.saveVersion(nonExistentFile)).rejects.toThrow('Index file not found');
    });
  });

  describe('getLatestVersion', () => {
    it('should return the path of the latest version', async () => {
      const content = '{"test": "data"}';
      fs.writeFileSync(testFile, content);
      
      await historyManager.saveVersion(testFile);
      await historyManager.saveVersion(testFile);
      
      const latestPath = await historyManager.getLatestVersion(testFile);
      expect(latestPath).toBeTruthy();
      expect(latestPath).toContain('.v2');
    });

    it('should return null if no versions exist', async () => {
      const latestPath = await historyManager.getLatestVersion(testFile);
      expect(latestPath).toBeNull();
    });
  });

  describe('restoreVersion', () => {
    it('should restore a specific version', async () => {
      const originalContent = '{"original": true}';
      const modifiedContent = '{"modified": true}';
      
      fs.writeFileSync(testFile, originalContent);
      await historyManager.saveVersion(testFile);
      
      fs.writeFileSync(testFile, modifiedContent);
      await historyManager.saveVersion(testFile);
      
      // Restore to version 1
      await historyManager.restoreVersion(testFile, 1);
      
      const restoredContent = fs.readFileSync(testFile, 'utf8');
      expect(restoredContent).toBe(originalContent);
    });

    it('should throw error for non-existent version', async () => {
      fs.writeFileSync(testFile, '{"test": true}');
      
      await expect(historyManager.restoreVersion(testFile, 999)).rejects.toThrow('Version 999 not found');
    });
  });

  describe('cleanup', () => {
    it('should remove old versions when maxVersions is exceeded', async () => {
      const content = '{"test": "data"}';
      fs.writeFileSync(testFile, content);
      
      // Create more versions than the limit (3)
      for (let i = 0; i < 5; i++) {
        await historyManager.saveVersion(testFile);
        await new Promise(resolve => setTimeout(resolve, 10)); // Ensure different timestamps
      }
      
      const versions = await historyManager.getVersions(testFile);
      expect(versions.length).toBeLessThanOrEqual(3);
      
      // Should keep the most recent versions
      const versionNumbers = versions.map(v => v.version).sort((a, b) => b - a);
      expect(versionNumbers[0]).toBe(5); // Most recent
    });
  });

  describe('compareVersions', () => {
    it('should detect differences between versions', async () => {
      const content1 = 'line 1\nline 2\nline 3';
      const content2 = 'line 1\nmodified line 2\nline 3';
      
      fs.writeFileSync(testFile, content1);
      await historyManager.saveVersion(testFile);
      
      fs.writeFileSync(testFile, content2);
      await historyManager.saveVersion(testFile);
      
      const differences = await historyManager.compareVersions(testFile, 1, 2);
      expect(differences.length).toBeGreaterThan(0);
      expect(differences.some(diff => diff.includes('Line 2'))).toBe(true);
    });

    it('should return empty array for identical versions', async () => {
      const content = 'identical content';
      fs.writeFileSync(testFile, content);
      
      await historyManager.saveVersion(testFile);
      await historyManager.saveVersion(testFile);
      
      const differences = await historyManager.compareVersions(testFile, 1, 2);
      expect(differences.length).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty files in comparison', async () => {
      fs.writeFileSync(testFile, '');
      await historyManager.saveVersion(testFile);
      
      fs.writeFileSync(testFile, 'some content');
      await historyManager.saveVersion(testFile);
      
      const differences = await historyManager.compareVersions(testFile, 1, 2);
      expect(differences.length).toBeGreaterThan(0);
    });

    it('should throw error when comparing non-existent versions', async () => {
      fs.writeFileSync(testFile, 'content');
      await historyManager.saveVersion(testFile);
      
      await expect(historyManager.compareVersions(testFile, 1, 999))
        .rejects.toThrow('One or both versions not found');
    });

    it('should handle comparison of identical content', async () => {
      const content = 'identical content';
      fs.writeFileSync(testFile, content);
      await historyManager.saveVersion(testFile);
      
      fs.writeFileSync(testFile, content);
      await historyManager.saveVersion(testFile);
      
      const differences = await historyManager.compareVersions(testFile, 1, 2);
      expect(differences).toHaveLength(0);
    });

    it('should handle missing version files gracefully', async () => {
      fs.writeFileSync(testFile, 'content');
      await historyManager.saveVersion(testFile);
      
      // Manually delete a version file
      const versionFile = testFile + '.v1';
      if (fs.existsSync(versionFile)) {
        fs.unlinkSync(versionFile);
      }
      
      await expect(historyManager.compareVersions(testFile, 1, 2))
        .rejects.toThrow();
    });
  });
});