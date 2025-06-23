export interface FunctionInfo {
  file: string;
  identifier: string;
  signature: string;
  startLine: number;
  endLine: number;
  hash_function: string;
  hash_file: string;
  exported: boolean;
  async: boolean;
  metrics: FunctionMetrics;
  domain: string;
}

export interface FunctionMetrics {
  linesOfCode?: number;
  cyclomaticComplexity?: number;
  cognitiveComplexity?: number;
  nestingDepth?: number;
  parameterCount?: number;
  hasReturnType?: boolean;
}

export interface IndexerOptions {
  root: string;
  output: string;
  domain: string;
  include?: string[];
  exclude?: string[];
  verbose?: boolean;
}

export interface IndexerResult {
  totalFiles: number;
  totalFunctions: number;
  processedFiles: string[];
  errors: IndexerError[];
  executionTime: number;
}

export interface IndexerError {
  file: string;
  message: string;
  line?: number;
  severity: 'warning' | 'error';
}

export interface SearchHistory {
  id: string;
  timestamp: string;
  query: string;
  context: string;
  resolvedFunctions: string[];
  searchCriteria: {
    keywords: string[];
    returnType?: string;
    async?: boolean;
    domain?: string;
  };
  confidence: number;
  usage: 'successful' | 'rejected' | 'modified';
}

export interface EnhancedFunctionInfo extends FunctionInfo {
  description: string;
  tags: string[];
  purpose: string;
  dependencies: string[];
}

export interface SearchOptions {
  query: string;
  context?: string;
  saveHistory?: boolean;
  limit?: number;
}

export interface FunctionMetricsHistory {
  // 識別情報
  commitHash: string;
  functionId: string;  // ファイルパス + 関数名
  
  // コンテキスト
  parentCommit: string;
  prNumber?: number;
  branchName: string;
  changeType: 'created' | 'modified' | 'refactored';
  timestamp: string;
  
  // メトリクス値
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  linesOfCode: number;
  nestingDepth: number;
  parameterCount: number;
}

export interface MetricsCollectionOptions {
  prNumber?: number;
  commitHash?: string;
  branchName?: string;
  verbose?: boolean;
  outputFile?: string;
}

export interface MetricsThresholds {
  cyclomaticComplexity: number;  // Default: 10
  cognitiveComplexity: number;   // Default: 15
  linesOfCode: number;          // Default: 40
  nestingDepth: number;         // Default: 3
  parameterCount: number;       // Default: 4
}

export interface MetricsAnalysisResult {
  functionId: string;
  currentMetrics: FunctionMetricsHistory;
  violations: MetricsViolation[];
  trend: 'improving' | 'degrading' | 'stable' | 'new';
  riskLevel: 'low' | 'medium' | 'high';
}

export interface MetricsViolation {
  metric: keyof Omit<FunctionMetricsHistory, 'commitHash' | 'functionId' | 'parentCommit' | 'prNumber' | 'branchName' | 'changeType' | 'timestamp'>;
  value: number;
  threshold: number;
  severity: 'warning' | 'error';
}// Test change for diff testing
