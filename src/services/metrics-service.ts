import { execSync } from 'child_process';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { FunctionIndexer } from '../indexer';
import { MetricsStorage } from '../storage/metrics-storage';
import { FunctionMetricsHistory, MetricsCollectionOptions, MetricsThresholds, MetricsAnalysisResult, IndexerOptions } from '../types';
import { MetricsConfigService } from './metrics-config-service';

export class MetricsService {
  private storage: MetricsStorage;
  private projectRoot: string;

  constructor(storageDir?: string, projectRoot?: string) {
    this.storage = new MetricsStorage(storageDir);
    this.projectRoot = projectRoot || process.cwd();
  }

  /**
   * Get thresholds from metrics configuration file
   */
  private getThresholds(): MetricsThresholds {
    const config = MetricsConfigService.loadConfig(this.projectRoot);
    return config.thresholds;
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
      output: path.join(os.tmpdir(), 'metrics-temp.jsonl'),
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
      
      if (func.metrics.cyclomaticComplexity !== undefined && 
          func.metrics.cognitiveComplexity !== undefined &&
          func.metrics.nestingDepth !== undefined) {
        
        const changeType = await this.determineChangeType(functionId, {
          cyclomaticComplexity: func.metrics.cyclomaticComplexity,
          linesOfCode: func.metrics.linesOfCode || 0,
          nestingDepth: func.metrics.nestingDepth
        });
        
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
    
    // JSONLファイルの出力（オプション）
    if (options.outputFile) {
      if (options.verbose) {
        console.log(`Saving metrics to JSONL file: ${options.outputFile}`);
      }
      await this.saveMetricsToJsonl(metricsHistory, options.outputFile);
    }
    
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
   * 利用可能な関数の一覧を取得
   */
  listAvailableFunctions(): Array<{
    functionId: string;
    recordCount: number;
    lastTimestamp: string;
    latestComplexity: number;
  }> {
    return this.storage.getAvailableFunctions();
  }

  /**
   * トレンド分析を実行
   */
  analyzeTrends(): MetricsAnalysisResult[] {
    return this.storage.analyzeViolations(this.getThresholds());
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
    const thresholds = { ...this.getThresholds(), ...customThresholds };
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
  private async determineChangeType(
    functionId: string,
    currentMetrics: {
      cyclomaticComplexity: number;
      linesOfCode: number;
      nestingDepth: number;
    }
  ): Promise<'created' | 'modified' | 'refactored'> {
    // 既存の履歴から判定
    const history = this.storage.getMetricsHistory(functionId, 2);
    
    if (history.length === 0) {
      return 'created';
    }

    const previous = history[0];
    
    // 大幅な変更があった場合はリファクタリングとみなす
    const significantChange = 
      Math.abs(currentMetrics.cyclomaticComplexity - previous.cyclomaticComplexity) > 3 ||
      Math.abs(currentMetrics.linesOfCode - previous.linesOfCode) > 10 ||
      Math.abs(currentMetrics.nestingDepth - previous.nestingDepth) > 1;
    
    return significantChange ? 'refactored' : 'modified';
  }

  /**
   * メトリクス履歴をJSONLファイルに保存
   */
  private async saveMetricsToJsonl(metricsHistory: FunctionMetricsHistory[], outputFile: string): Promise<void> {
    try {
      // ディレクトリが存在しない場合は作成
      const outputDir = path.dirname(outputFile);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // 既存のファイルがあれば読み込み
      let existingMetrics: FunctionMetricsHistory[] = [];
      if (fs.existsSync(outputFile)) {
        const content = fs.readFileSync(outputFile, 'utf-8');
        existingMetrics = content
          .trim()
          .split('\n')
          .filter(line => line)
          .map(line => JSON.parse(line));
      }

      // 新しいメトリクスを追加
      const allMetrics = [...existingMetrics, ...metricsHistory];
      
      // commitHashでソート（最新が最後になるように）
      allMetrics.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      // JSONLファイルに書き出し
      const jsonlContent = allMetrics
        .map(metric => JSON.stringify(metric))
        .join('\n');
      
      fs.writeFileSync(outputFile, jsonlContent);
    } catch (error) {
      throw new Error(`Failed to save metrics to JSONL file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * リソースをクリーンアップ
   */
  close(): void {
    this.storage.close();
  }
}