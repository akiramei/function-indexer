import { execSync } from 'child_process';
import { FunctionIndexer } from '../indexer';
import { MetricsStorage } from '../storage/metrics-storage';
import { FunctionMetricsHistory, MetricsCollectionOptions, MetricsThresholds, MetricsAnalysisResult, IndexerOptions } from '../types';

export class MetricsService {
  private storage: MetricsStorage;
  private defaultThresholds: MetricsThresholds = {
    cyclomaticComplexity: 10,
    cognitiveComplexity: 15,
    linesOfCode: 40,
    nestingDepth: 3,
    parameterCount: 4
  };

  constructor(storageDir?: string) {
    this.storage = new MetricsStorage(storageDir);
  }

  /**
   * メトリクスを収集してデータベースに保存
   */
  async collectMetrics(rootPath: string, options: MetricsCollectionOptions): Promise<void> {
    const commitHash = options.commitHash || this.getCurrentCommitHash();
    const parentCommit = this.getParentCommitHash(commitHash);
    const branchName = options.branchName || this.getCurrentBranch();
    const timestamp = new Date().toISOString();

    // 関数インデックスを生成
    const indexer = new FunctionIndexer({
      root: rootPath,
      output: '/tmp/metrics-temp.jsonl',
      domain: 'metrics',
      verbose: options.verbose
    });

    const result = await indexer.run();
    
    if (options.verbose) {
      console.log(`Processed ${result.totalFunctions} functions from ${result.totalFiles} files`);
    }

    // 生成されたJSONLファイルを読み込み
    const functions = await indexer.getStoredFunctions();
    
    // 各関数について変更タイプを判定
    const metricsHistory: FunctionMetricsHistory[] = [];
    
    for (const func of functions) {
      const functionId = `${func.file}:${func.identifier}`;
      const changeType = await this.determineChangeType(functionId, commitHash, parentCommit);
      
      if (func.metrics.cyclomaticComplexity !== undefined && 
          func.metrics.cognitiveComplexity !== undefined &&
          func.metrics.nestingDepth !== undefined) {
        
        metricsHistory.push({
          commitHash,
          functionId,
          parentCommit,
          prNumber: options.prNumber,
          branchName,
          changeType,
          timestamp,
          cyclomaticComplexity: func.metrics.cyclomaticComplexity,
          cognitiveComplexity: func.metrics.cognitiveComplexity,
          linesOfCode: func.metrics.linesOfCode || 0,
          nestingDepth: func.metrics.nestingDepth,
          parameterCount: func.metrics.parameterCount || 0
        });
      }
    }

    // データベースに保存
    this.storage.saveMetrics(metricsHistory);
    
    if (options.verbose) {
      console.log(`Saved metrics for ${metricsHistory.length} functions`);
    }
  }

  /**
   * 特定の関数のメトリクス履歴を表示
   */
  showFunctionMetrics(functionId: string, limit?: number): FunctionMetricsHistory[] {
    return this.storage.getMetricsHistory(functionId, limit);
  }

  /**
   * トレンド分析を実行
   */
  analyzeTrends(commitRange?: string): MetricsAnalysisResult[] {
    return this.storage.analyzeViolations(this.defaultThresholds);
  }

  /**
   * PRのメトリクスを取得
   */
  getPRMetrics(prNumber: number): FunctionMetricsHistory[] {
    return this.storage.getMetricsByPR(prNumber);
  }

  /**
   * メトリクス違反をチェック
   */
  checkViolations(customThresholds?: Partial<MetricsThresholds>): MetricsAnalysisResult[] {
    const thresholds = { ...this.defaultThresholds, ...customThresholds };
    return this.storage.analyzeViolations(thresholds);
  }

  /**
   * 現在のコミットハッシュを取得
   */
  private getCurrentCommitHash(): string {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      throw new Error('Failed to get current commit hash. Are you in a git repository?');
    }
  }

  /**
   * 親コミットハッシュを取得
   */
  private getParentCommitHash(commitHash: string): string {
    try {
      return execSync(`git rev-parse ${commitHash}^`, { encoding: 'utf8' }).trim();
    } catch (error) {
      // 初回コミットの場合、親コミットが存在しない
      return '';
    }
  }

  /**
   * 現在のブランチ名を取得
   */
  private getCurrentBranch(): string {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * 関数の変更タイプを判定
   */
  private async determineChangeType(functionId: string, commitHash: string, parentCommit: string): Promise<'created' | 'modified' | 'refactored'> {
    // 既存の履歴から判定
    const history = this.storage.getMetricsHistory(functionId, 2);
    
    if (history.length === 0) {
      return 'created';
    }

    const previous = history[0];
    
    // 大幅な変更があった場合はリファクタリングとみなす
    const significantChange = 
      Math.abs(previous.cyclomaticComplexity - (previous.cyclomaticComplexity || 0)) > 3 ||
      Math.abs(previous.linesOfCode - (previous.linesOfCode || 0)) > 10 ||
      Math.abs(previous.nestingDepth - (previous.nestingDepth || 0)) > 1;
    
    return significantChange ? 'refactored' : 'modified';
  }

  /**
   * リソースをクリーンアップ
   */
  close(): void {
    this.storage.close();
  }
}