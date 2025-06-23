import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { FunctionMetricsHistory, MetricsAnalysisResult, MetricsViolation, MetricsThresholds } from '../types';

export class MetricsStorage {
  private db: Database.Database;
  private readonly dbPath: string;

  constructor(storageDir: string = '.function-metrics') {
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    
    this.dbPath = path.join(storageDir, 'metrics.db');
    this.db = new Database(this.dbPath);
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    // メトリクス履歴テーブル
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS function_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        commit_hash TEXT NOT NULL,
        function_id TEXT NOT NULL,
        parent_commit TEXT NOT NULL,
        pr_number INTEGER,
        branch_name TEXT NOT NULL,
        change_type TEXT NOT NULL CHECK (change_type IN ('created', 'modified', 'refactored')),
        timestamp TEXT NOT NULL,
        cyclomatic_complexity INTEGER NOT NULL,
        cognitive_complexity INTEGER NOT NULL,
        lines_of_code INTEGER NOT NULL,
        nesting_depth INTEGER NOT NULL,
        parameter_count INTEGER NOT NULL,
        UNIQUE(commit_hash, function_id)
      )
    `);

    // インデックス作成
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_function_metrics_function_id ON function_metrics(function_id);
      CREATE INDEX IF NOT EXISTS idx_function_metrics_commit_hash ON function_metrics(commit_hash);
      CREATE INDEX IF NOT EXISTS idx_function_metrics_pr_number ON function_metrics(pr_number);
      CREATE INDEX IF NOT EXISTS idx_function_metrics_timestamp ON function_metrics(timestamp);
    `);
  }

  /**
   * メトリクスを保存
   */
  saveMetrics(metrics: FunctionMetricsHistory[]): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO function_metrics (
        commit_hash, function_id, parent_commit, pr_number, branch_name, 
        change_type, timestamp, cyclomatic_complexity, cognitive_complexity,
        lines_of_code, nesting_depth, parameter_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = this.db.transaction((metricsList: FunctionMetricsHistory[]) => {
      for (const metric of metricsList) {
        stmt.run(
          metric.commitHash,
          metric.functionId,
          metric.parentCommit,
          metric.prNumber || null,
          metric.branchName,
          metric.changeType,
          metric.timestamp,
          metric.cyclomaticComplexity,
          metric.cognitiveComplexity,
          metric.linesOfCode,
          metric.nestingDepth,
          metric.parameterCount
        );
      }
    });

    transaction(metrics);
  }

  /**
   * 特定の関数のメトリクス履歴を取得
   */
  getMetricsHistory(functionId: string, limit?: number): FunctionMetricsHistory[] {
    const sql = `
      SELECT * FROM function_metrics 
      WHERE function_id = ? 
      ORDER BY timestamp DESC
      ${limit ? `LIMIT ${limit}` : ''}
    `;
    
    const rows = this.db.prepare(sql).all(functionId);
    return rows.map(this.mapRowToMetrics);
  }

  /**
   * 特定のコミットのメトリクスを取得
   */
  getMetricsByCommit(commitHash: string): FunctionMetricsHistory[] {
    const rows = this.db.prepare(`
      SELECT * FROM function_metrics 
      WHERE commit_hash = ?
      ORDER BY function_id
    `).all(commitHash);
    
    return rows.map(this.mapRowToMetrics);
  }

  /**
   * PRのメトリクスを取得
   */
  getMetricsByPR(prNumber: number): FunctionMetricsHistory[] {
    const rows = this.db.prepare(`
      SELECT * FROM function_metrics 
      WHERE pr_number = ?
      ORDER BY function_id
    `).all(prNumber);
    
    return rows.map(this.mapRowToMetrics);
  }

  /**
   * 期間を指定してメトリクスを取得
   */
  getMetricsByDateRange(startDate: string, endDate: string): FunctionMetricsHistory[] {
    const rows = this.db.prepare(`
      SELECT * FROM function_metrics 
      WHERE timestamp BETWEEN ? AND ?
      ORDER BY timestamp DESC
    `).all(startDate, endDate);
    
    return rows.map(this.mapRowToMetrics);
  }

  /**
   * 最新のメトリクスを取得
   */
  getLatestMetrics(): FunctionMetricsHistory[] {
    const rows = this.db.prepare(`
      SELECT fm1.* FROM function_metrics fm1
      INNER JOIN (
        SELECT function_id, MAX(timestamp) as max_timestamp
        FROM function_metrics
        GROUP BY function_id
      ) fm2 ON fm1.function_id = fm2.function_id AND fm1.timestamp = fm2.max_timestamp
      ORDER BY fm1.function_id
    `).all();
    
    return rows.map(this.mapRowToMetrics);
  }

  /**
   * メトリクス違反を分析
   */
  analyzeViolations(thresholds: MetricsThresholds): MetricsAnalysisResult[] {
    const latestMetrics = this.getLatestMetrics();
    return latestMetrics.map(metrics => this.analyzeMetricsViolations(metrics, thresholds));
  }

  private analyzeMetricsViolations(metrics: FunctionMetricsHistory, thresholds: MetricsThresholds): MetricsAnalysisResult {
    const violations = this.checkAllViolations(metrics, thresholds);
    const trend = this.calculateTrend(metrics.functionId);
    const riskLevel = this.calculateRiskLevel(violations);

    return {
      functionId: metrics.functionId,
      currentMetrics: metrics,
      violations,
      trend,
      riskLevel
    };
  }

  private checkAllViolations(metrics: FunctionMetricsHistory, thresholds: MetricsThresholds): MetricsViolation[] {
    const violations: MetricsViolation[] = [];

    const checks: Array<{
      metric: keyof MetricsThresholds;
      value: number;
      threshold: number;
    }> = [
      { metric: 'cyclomaticComplexity', value: metrics.cyclomaticComplexity, threshold: thresholds.cyclomaticComplexity },
      { metric: 'cognitiveComplexity', value: metrics.cognitiveComplexity, threshold: thresholds.cognitiveComplexity },
      { metric: 'linesOfCode', value: metrics.linesOfCode, threshold: thresholds.linesOfCode },
      { metric: 'nestingDepth', value: metrics.nestingDepth, threshold: thresholds.nestingDepth },
      { metric: 'parameterCount', value: metrics.parameterCount, threshold: thresholds.parameterCount }
    ];

    for (const check of checks) {
      if (check.value > check.threshold) {
        violations.push({
          metric: check.metric,
          value: check.value,
          threshold: check.threshold,
          severity: check.value > check.threshold * 1.5 ? 'error' : 'warning'
        });
      }
    }

    return violations;
  }

  /**
   * トレンド分析
   */
  private calculateTrend(functionId: string): 'improving' | 'degrading' | 'stable' | 'new' {
    const history = this.getMetricsHistory(functionId, 3);
    
    if (history.length === 1) {
      return 'new';
    }
    
    if (history.length < 2) {
      return 'stable';
    }

    const current = history[0];
    const previous = history[1];
    
    // 複数のメトリクスの総合的な変化を計算
    const currentScore = current.cyclomaticComplexity + current.cognitiveComplexity + 
                        Math.floor(current.linesOfCode / 10) + current.nestingDepth + current.parameterCount;
    const previousScore = previous.cyclomaticComplexity + previous.cognitiveComplexity + 
                         Math.floor(previous.linesOfCode / 10) + previous.nestingDepth + previous.parameterCount;
    
    if (currentScore < previousScore * 0.9) {
      return 'improving';
    } else if (currentScore > previousScore * 1.1) {
      return 'degrading';
    } else {
      return 'stable';
    }
  }

  /**
   * リスクレベル計算
   */
  private calculateRiskLevel(violations: MetricsViolation[]): 'low' | 'medium' | 'high' {
    const errorCount = violations.filter(v => v.severity === 'error').length;
    const warningCount = violations.filter(v => v.severity === 'warning').length;
    
    if (errorCount > 0) {
      return 'high';
    } else if (warningCount > 2) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * データベース行をメトリクスオブジェクトにマップ
   */
  private mapRowToMetrics(row: any): FunctionMetricsHistory {
    return {
      commitHash: row.commit_hash,
      functionId: row.function_id,
      parentCommit: row.parent_commit,
      prNumber: row.pr_number,
      branchName: row.branch_name,
      changeType: row.change_type,
      timestamp: row.timestamp,
      cyclomaticComplexity: row.cyclomatic_complexity,
      cognitiveComplexity: row.cognitive_complexity,
      linesOfCode: row.lines_of_code,
      nestingDepth: row.nesting_depth,
      parameterCount: row.parameter_count
    };
  }

  /**
   * 利用可能な関数の一覧を取得
   */
  getAvailableFunctions(): Array<{
    functionId: string;
    recordCount: number;
    lastTimestamp: string;
    latestComplexity: number;
  }> {
    const rows = this.db.prepare(`
      SELECT 
        function_id,
        COUNT(*) as record_count,
        MAX(timestamp) as last_timestamp,
        (SELECT cyclomatic_complexity FROM function_metrics 
         WHERE function_id = fm.function_id 
         ORDER BY timestamp DESC LIMIT 1) as latest_complexity
      FROM function_metrics fm
      GROUP BY function_id
      ORDER BY last_timestamp DESC
    `).all();
    
    return rows.map((row: any) => ({
      functionId: row.function_id,
      recordCount: row.record_count,
      lastTimestamp: row.last_timestamp,
      latestComplexity: row.latest_complexity
    }));
  }

  /**
   * データベースを閉じる
   */
  close(): void {
    this.db.close();
  }
}