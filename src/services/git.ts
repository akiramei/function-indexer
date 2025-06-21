import simpleGit, { SimpleGit } from 'simple-git';
import { FunctionInfo } from '../types';
import { promises as fs } from 'fs';
import path from 'path';

export interface DiffResult {
  added: FunctionInfo[];
  modified: {
    before: FunctionInfo;
    after: FunctionInfo;
    metricsChanges: {
      [key: string]: {
        before: number | boolean;
        after: number | boolean;
        change: number | string;
      };
    };
  }[];
  removed: FunctionInfo[];
}

export class GitService {
  private git: SimpleGit;

  constructor(private root: string) {
    this.git = simpleGit(root);
  }

  async getCurrentBranch(): Promise<string> {
    const branch = await this.git.revparse(['--abbrev-ref', 'HEAD']);
    return branch.trim();
  }

  async getCommitHash(): Promise<string> {
    const hash = await this.git.revparse(['HEAD']);
    return hash.trim().substring(0, 8);
  }

  async getBranchDiff(base: string, target: string = 'HEAD'): Promise<string[]> {
    const diff = await this.git.diff([
      '--name-only',
      `${base}...${target}`,
      '--',
      '*.ts',
      '*.tsx'
    ]);
    return diff.split('\n').filter(file => file.length > 0);
  }

  async getFileAtRevision(filePath: string, revision: string): Promise<string | null> {
    try {
      const content = await this.git.show([`${revision}:${filePath}`]);
      return content;
    } catch (error) {
      // File doesn't exist at this revision
      return null;
    }
  }

  async compareIndexes(
    baseIndexPath: string,
    targetIndexPath: string
  ): Promise<DiffResult> {
    // Read and parse JSONL files
    const baseIndex = await this.readIndexFile(baseIndexPath);
    const targetIndex = await this.readIndexFile(targetIndexPath);

    // Create maps for efficient lookup
    const baseMap = new Map<string, FunctionInfo>();
    const targetMap = new Map<string, FunctionInfo>();

    baseIndex.forEach(record => {
      const key = `${record.file}:${record.identifier}:${record.startLine}`;
      baseMap.set(key, record);
    });

    targetIndex.forEach(record => {
      const key = `${record.file}:${record.identifier}:${record.startLine}`;
      targetMap.set(key, record);
    });

    const result: DiffResult = {
      added: [],
      modified: [],
      removed: []
    };

    // Find added and modified functions
    targetMap.forEach((targetRecord, key) => {
      const baseRecord = baseMap.get(key);
      if (!baseRecord) {
        result.added.push(targetRecord);
      } else if (baseRecord.hash_function !== targetRecord.hash_function) {
        const metricsChanges = this.compareMetrics(baseRecord, targetRecord);
        result.modified.push({
          before: baseRecord,
          after: targetRecord,
          metricsChanges
        });
      }
    });

    // Find removed functions
    baseMap.forEach((baseRecord, key) => {
      if (!targetMap.has(key)) {
        result.removed.push(baseRecord);
      }
    });

    return result;
  }

  private compareMetrics(
    before: FunctionInfo,
    after: FunctionInfo
  ): DiffResult['modified'][0]['metricsChanges'] {
    const changes: DiffResult['modified'][0]['metricsChanges'] = {};
    const metrics = before.metrics;
    const afterMetrics = after.metrics;

    // Compare numeric metrics
    const numericMetrics: (keyof typeof metrics)[] = [
      'linesOfCode',
      'cyclomaticComplexity',
      'cognitiveComplexity',
      'nestingDepth',
      'parameterCount'
    ];

    numericMetrics.forEach(metric => {
      const beforeValue = metrics[metric] as number;
      const afterValue = afterMetrics[metric] as number;
      if (beforeValue !== afterValue) {
        changes[metric as string] = {
          before: beforeValue,
          after: afterValue,
          change: afterValue - beforeValue
        };
      }
    });

    // Compare boolean metrics
    if (metrics.hasReturnType !== afterMetrics.hasReturnType && 
        metrics.hasReturnType !== undefined && 
        afterMetrics.hasReturnType !== undefined) {
      changes.hasReturnType = {
        before: metrics.hasReturnType,
        after: afterMetrics.hasReturnType,
        change: afterMetrics.hasReturnType ? 'added' : 'removed'
      };
    }

    return changes;
  }

  private async readIndexFile(indexPath: string): Promise<FunctionInfo[]> {
    const content = await fs.readFile(indexPath, 'utf-8');
    return content
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));
  }

  async isGitRepository(): Promise<boolean> {
    try {
      await this.git.revparse(['--git-dir']);
      return true;
    } catch {
      return false;
    }
  }

  async getChangedFiles(base?: string): Promise<string[]> {
    if (base) {
      return this.getBranchDiff(base);
    }
    
    // Get unstaged and staged changes
    const status = await this.git.status();
    return [
      ...status.modified,
      ...status.created,
      ...status.renamed.map(r => r.to)
    ].filter(file => file.endsWith('.ts') || file.endsWith('.tsx'));
  }
}