import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const rename = promisify(fs.rename);
const exists = promisify(fs.exists);
const copyFile = promisify(fs.copyFile);
const unlink = promisify(fs.unlink);

export class SafeFileWriter {
  constructor(private historyDir: string = '.history') {}

  async writeAtomic(filePath: string, content: string): Promise<void> {
    const tempPath = `${filePath}.tmp`;
    const backupPath = `${filePath}.bak`;
    
    try {
      // 1. Write to temporary file
      await writeFile(tempPath, content, 'utf8');
      
      // 2. Backup existing file if it exists
      if (await exists(filePath)) {
        await copyFile(filePath, backupPath);
      }
      
      // 3. Atomic rename temp to target
      await rename(tempPath, filePath);
      
      // 4. Archive backup if successful
      if (await exists(backupPath)) {
        await this.archiveBackup(filePath, backupPath);
      }
      
    } catch (error) {
      // Rollback on error
      try {
        if (await exists(tempPath)) {
          await unlink(tempPath);
        }
        if (await exists(backupPath)) {
          await rename(backupPath, filePath);
        }
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
      throw error;
    }
  }

  private async archiveBackup(originalPath: string, backupPath: string): Promise<void> {
    const dir = path.dirname(originalPath);
    const basename = path.basename(originalPath);
    const historyPath = path.join(dir, this.historyDir);
    
    // Ensure history directory exists
    if (!fs.existsSync(historyPath)) {
      fs.mkdirSync(historyPath, { recursive: true });
    }
    
    // Move backup to history with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archivePath = path.join(historyPath, `${basename}.${timestamp}`);
    
    await rename(backupPath, archivePath);
    
    // Cleanup old backups
    await this.cleanupOldBackups(historyPath, basename);
  }

  private async cleanupOldBackups(historyPath: string, basename: string, maxBackups: number = 5): Promise<void> {
    const files = fs.readdirSync(historyPath)
      .filter(f => f.startsWith(basename))
      .map(f => ({
        name: f,
        path: path.join(historyPath, f),
        mtime: fs.statSync(path.join(historyPath, f)).mtime
      }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
    
    // Remove old backups beyond max limit
    for (let i = maxBackups; i < files.length; i++) {
      await unlink(files[i].path);
    }
  }
}