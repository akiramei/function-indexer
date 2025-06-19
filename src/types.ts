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