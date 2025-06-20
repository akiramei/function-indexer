import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const copyFile = promisify(fs.copyFile);
const exists = promisify(fs.exists);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);

export interface HistoryConfig {
  maxVersions: number;
  compressionEnabled: boolean;
  retentionDays: number;
}

export interface VersionInfo {
  version: number;
  path: string;
  timestamp: string;
  size: number;
}

export class HistoryManager {
  private config: HistoryConfig;
  
  constructor(config?: Partial<HistoryConfig>) {
    this.config = {
      maxVersions: 5,
      compressionEnabled: false,
      retentionDays: 30,
      ...config
    };
  }

  private getHistoryDir(indexPath: string): string {
    const dir = path.dirname(indexPath);
    return path.join(dir, '.history');
  }

  private getHistoryPath(indexPath: string, version: number): string {
    const basename = path.basename(indexPath);
    const historyDir = this.getHistoryDir(indexPath);
    return path.join(historyDir, `${basename}.v${version}`);
  }

  private getVersionsMetaPath(indexPath: string): string {
    const historyDir = this.getHistoryDir(indexPath);
    return path.join(historyDir, 'versions.json');
  }

  async saveVersion(indexPath: string): Promise<number> {
    if (!await exists(indexPath)) {
      throw new Error(`Index file not found: ${indexPath}`);
    }

    const historyDir = this.getHistoryDir(indexPath);
    if (!fs.existsSync(historyDir)) {
      fs.mkdirSync(historyDir, { recursive: true });
    }

    const versions = await this.getVersions(indexPath);
    const nextVersion = versions.length > 0 
      ? Math.max(...versions.map(v => v.version)) + 1 
      : 1;

    const historyPath = this.getHistoryPath(indexPath, nextVersion);
    await copyFile(indexPath, historyPath);

    // Update versions metadata
    const versionInfo: VersionInfo = {
      version: nextVersion,
      path: historyPath,
      timestamp: new Date().toISOString(),
      size: (await stat(historyPath)).size
    };

    await this.updateVersionsMetadata(indexPath, [...versions, versionInfo]);
    
    // Cleanup old versions
    await this.cleanupOldVersions(indexPath);

    return nextVersion;
  }

  async getVersions(indexPath: string): Promise<VersionInfo[]> {
    const metaPath = this.getVersionsMetaPath(indexPath);
    
    if (!await exists(metaPath)) {
      return [];
    }

    const content = await readFile(metaPath, 'utf8');
    return JSON.parse(content) as VersionInfo[];
  }

  async getLatestVersion(indexPath: string): Promise<string | null> {
    const versions = await this.getVersions(indexPath);
    
    if (versions.length === 0) {
      return null;
    }

    const latest = versions.sort((a, b) => b.version - a.version)[0];
    return latest.path;
  }

  async restoreVersion(indexPath: string, version: number): Promise<void> {
    const historyPath = this.getHistoryPath(indexPath, version);
    
    if (!await exists(historyPath)) {
      throw new Error(`Version ${version} not found for ${indexPath}`);
    }

    // Save current as new version before restoring
    await this.saveVersion(indexPath);
    
    // Restore the specified version
    await copyFile(historyPath, indexPath);
  }

  private async updateVersionsMetadata(indexPath: string, versions: VersionInfo[]): Promise<void> {
    const metaPath = this.getVersionsMetaPath(indexPath);
    await writeFile(metaPath, JSON.stringify(versions, null, 2), 'utf8');
  }

  private async cleanupOldVersions(indexPath: string): Promise<void> {
    const versions = await this.getVersions(indexPath);
    const sortedVersions = versions.sort((a, b) => b.version - a.version);

    // Remove by max count
    const toRemoveByCount = sortedVersions.slice(this.config.maxVersions);

    // Remove by age
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);
    
    const toRemove = sortedVersions.filter(v => {
      const versionDate = new Date(v.timestamp);
      return toRemoveByCount.includes(v) || versionDate < cutoffDate;
    });

    for (const version of toRemove) {
      if (await exists(version.path)) {
        await unlink(version.path);
      }
    }

    // Update metadata
    const remaining = versions.filter(v => !toRemove.includes(v));
    await this.updateVersionsMetadata(indexPath, remaining);
  }

  async compareVersions(indexPath: string, version1: number, version2: number): Promise<string[]> {
    const path1 = this.getHistoryPath(indexPath, version1);
    const path2 = this.getHistoryPath(indexPath, version2);

    if (!await exists(path1) || !await exists(path2)) {
      throw new Error('One or both versions not found');
    }

    const content1 = await readFile(path1, 'utf8');
    const content2 = await readFile(path2, 'utf8');

    const lines1 = content1.trim().split('\n');
    const lines2 = content2.trim().split('\n');

    const differences: string[] = [];
    
    // Simple line-based diff (could be enhanced with proper diff algorithm)
    const maxLines = Math.max(lines1.length, lines2.length);
    for (let i = 0; i < maxLines; i++) {
      if (lines1[i] !== lines2[i]) {
        differences.push(`Line ${i + 1}: differs`);
      }
    }

    return differences;
  }
}