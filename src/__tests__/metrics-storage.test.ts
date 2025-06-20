import { MetricsStorage } from '../storage/metrics-storage';
import { FunctionMetricsHistory } from '../types';
import * as fs from 'fs';
import * as path from 'path';

describe('MetricsStorage', () => {
  let storage: MetricsStorage;
  let testDir: string;

  beforeEach(() => {
    testDir = path.join(__dirname, 'tmp', `test-metrics-${Date.now()}`);
    storage = new MetricsStorage(testDir);
  });

  afterEach(() => {
    storage.close();
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Database Initialization', () => {
    test('should create database file and tables', () => {
      const dbPath = path.join(testDir, 'metrics.db');
      expect(fs.existsSync(dbPath)).toBe(true);
    });

    test('should create storage directory if it does not exist', () => {
      expect(fs.existsSync(testDir)).toBe(true);
    });
  });

  describe('Save and Retrieve Metrics', () => {
    const sampleMetrics: FunctionMetricsHistory[] = [
      {
        commitHash: 'abc123',
        functionId: 'src/test.ts:testFunction',
        parentCommit: 'xyz789',
        prNumber: 123,
        branchName: 'feature/test',
        changeType: 'created',
        timestamp: '2023-01-01T10:00:00Z',
        cyclomaticComplexity: 5,
        cognitiveComplexity: 8,
        linesOfCode: 20,
        nestingDepth: 2,
        parameterCount: 3
      },
      {
        commitHash: 'def456',
        functionId: 'src/test.ts:testFunction',
        parentCommit: 'abc123',
        prNumber: 124,
        branchName: 'feature/update',
        changeType: 'modified',
        timestamp: '2023-01-02T10:00:00Z',
        cyclomaticComplexity: 7,
        cognitiveComplexity: 10,
        linesOfCode: 25,
        nestingDepth: 3,
        parameterCount: 4
      }
    ];

    test('should save metrics to database', () => {
      expect(() => storage.saveMetrics(sampleMetrics)).not.toThrow();
    });

    test('should retrieve metrics history for a function', () => {
      storage.saveMetrics(sampleMetrics);
      
      const history = storage.getMetricsHistory('src/test.ts:testFunction');
      
      expect(history).toHaveLength(2);
      expect(history[0].commitHash).toBe('def456'); // Latest first
      expect(history[1].commitHash).toBe('abc123');
    });

    test('should limit metrics history results', () => {
      storage.saveMetrics(sampleMetrics);
      
      const history = storage.getMetricsHistory('src/test.ts:testFunction', 1);
      
      expect(history).toHaveLength(1);
      expect(history[0].commitHash).toBe('def456'); // Latest first
    });

    test('should retrieve metrics by commit hash', () => {
      storage.saveMetrics(sampleMetrics);
      
      const metrics = storage.getMetricsByCommit('abc123');
      
      expect(metrics).toHaveLength(1);
      expect(metrics[0].functionId).toBe('src/test.ts:testFunction');
      expect(metrics[0].cyclomaticComplexity).toBe(5);
    });

    test('should retrieve metrics by PR number', () => {
      storage.saveMetrics(sampleMetrics);
      
      const metrics = storage.getMetricsByPR(123);
      
      expect(metrics).toHaveLength(1);
      expect(metrics[0].prNumber).toBe(123);
      expect(metrics[0].changeType).toBe('created');
    });

    test('should handle empty results', () => {
      const history = storage.getMetricsHistory('nonexistent:function');
      expect(history).toHaveLength(0);
      
      const metrics = storage.getMetricsByCommit('nonexistent');
      expect(metrics).toHaveLength(0);
      
      const prMetrics = storage.getMetricsByPR(999);
      expect(prMetrics).toHaveLength(0);
    });
  });

  describe('Violation Analysis', () => {
    const complexMetrics: FunctionMetricsHistory[] = [
      {
        commitHash: 'high-complexity',
        functionId: 'src/complex.ts:complexFunction',
        parentCommit: 'parent1',
        branchName: 'main',
        changeType: 'created',
        timestamp: '2023-01-01T10:00:00Z',
        cyclomaticComplexity: 15, // Above threshold (10)
        cognitiveComplexity: 20,  // Above threshold (15)
        linesOfCode: 50,          // Above threshold (40)
        nestingDepth: 5,          // Above threshold (3)
        parameterCount: 6         // Above threshold (4)
      },
      {
        commitHash: 'low-complexity',
        functionId: 'src/simple.ts:simpleFunction',
        parentCommit: 'parent2',
        branchName: 'main',
        changeType: 'created',
        timestamp: '2023-01-01T11:00:00Z',
        cyclomaticComplexity: 2,
        cognitiveComplexity: 3,
        linesOfCode: 10,
        nestingDepth: 1,
        parameterCount: 2
      }
    ];

    test('should analyze violations with default thresholds', () => {
      storage.saveMetrics(complexMetrics);
      
      const thresholds = {
        cyclomaticComplexity: 10,
        cognitiveComplexity: 15,
        linesOfCode: 40,
        nestingDepth: 3,
        parameterCount: 4
      };

      const analysis = storage.analyzeViolations(thresholds);
      
      expect(analysis).toHaveLength(2);
      
      const complexAnalysis = analysis.find(a => a.functionId === 'src/complex.ts:complexFunction');
      const simpleAnalysis = analysis.find(a => a.functionId === 'src/simple.ts:simpleFunction');
      
      expect(complexAnalysis?.violations).toHaveLength(5); // All metrics violate thresholds
      expect(complexAnalysis?.riskLevel).toBe('high');
      
      expect(simpleAnalysis?.violations).toHaveLength(0); // No violations
      expect(simpleAnalysis?.riskLevel).toBe('low');
    });

    test('should calculate risk levels correctly', () => {
      storage.saveMetrics(complexMetrics);
      
      const thresholds = {
        cyclomaticComplexity: 10,
        cognitiveComplexity: 15,
        linesOfCode: 40,
        nestingDepth: 3,
        parameterCount: 4
      };

      const analysis = storage.analyzeViolations(thresholds);
      const complexAnalysis = analysis.find(a => a.functionId === 'src/complex.ts:complexFunction');
      
      // Should have error-level violations
      const errorViolations = complexAnalysis?.violations.filter(v => v.severity === 'error');
      expect(errorViolations?.length).toBeGreaterThan(0);
      
      // Should be high risk due to error violations
      expect(complexAnalysis?.riskLevel).toBe('high');
    });
  });

  describe('Trend Analysis', () => {
    test('should calculate trend for improving function', () => {
      const improvingMetrics: FunctionMetricsHistory[] = [
        {
          commitHash: 'old',
          functionId: 'src/improving.ts:func',
          parentCommit: 'parent1',
          branchName: 'main',
          changeType: 'created',
          timestamp: '2023-01-01T10:00:00Z',
          cyclomaticComplexity: 10,
          cognitiveComplexity: 15,
          linesOfCode: 50,
          nestingDepth: 3,
          parameterCount: 4
        },
        {
          commitHash: 'new',
          functionId: 'src/improving.ts:func',
          parentCommit: 'old',
          branchName: 'main',
          changeType: 'modified',
          timestamp: '2023-01-02T10:00:00Z',
          cyclomaticComplexity: 5,
          cognitiveComplexity: 8,
          linesOfCode: 30,
          nestingDepth: 2,
          parameterCount: 3
        }
      ];

      storage.saveMetrics(improvingMetrics);
      
      const analysis = storage.analyzeViolations({
        cyclomaticComplexity: 20,
        cognitiveComplexity: 25,
        linesOfCode: 100,
        nestingDepth: 5,
        parameterCount: 6
      });

      const functionAnalysis = analysis.find(a => a.functionId === 'src/improving.ts:func');
      expect(functionAnalysis?.trend).toBe('improving');
    });

    test('should identify new functions', () => {
      const newMetrics: FunctionMetricsHistory[] = [
        {
          commitHash: 'first',
          functionId: 'src/new.ts:newFunc',
          parentCommit: 'parent',
          branchName: 'main',
          changeType: 'created',
          timestamp: '2023-01-01T10:00:00Z',
          cyclomaticComplexity: 5,
          cognitiveComplexity: 8,
          linesOfCode: 20,
          nestingDepth: 2,
          parameterCount: 3
        }
      ];

      storage.saveMetrics(newMetrics);
      
      const analysis = storage.analyzeViolations({
        cyclomaticComplexity: 10,
        cognitiveComplexity: 15,
        linesOfCode: 40,
        nestingDepth: 3,
        parameterCount: 4
      });

      const functionAnalysis = analysis.find(a => a.functionId === 'src/new.ts:newFunc');
      expect(functionAnalysis?.trend).toBe('new');
    });
  });

  describe('Date Range Queries', () => {
    test('should retrieve metrics by date range', () => {
      const dateRangeMetrics: FunctionMetricsHistory[] = [
        {
          commitHash: 'early',
          functionId: 'src/test.ts:func1',
          parentCommit: 'parent1',
          branchName: 'main',
          changeType: 'created',
          timestamp: '2023-01-01T10:00:00Z',
          cyclomaticComplexity: 5,
          cognitiveComplexity: 8,
          linesOfCode: 20,
          nestingDepth: 2,
          parameterCount: 3
        },
        {
          commitHash: 'late',
          functionId: 'src/test.ts:func2',
          parentCommit: 'parent2',
          branchName: 'main',
          changeType: 'created',
          timestamp: '2023-01-03T10:00:00Z',
          cyclomaticComplexity: 7,
          cognitiveComplexity: 10,
          linesOfCode: 30,
          nestingDepth: 3,
          parameterCount: 4
        }
      ];

      storage.saveMetrics(dateRangeMetrics);
      
      const metrics = storage.getMetricsByDateRange('2023-01-01T00:00:00Z', '2023-01-02T00:00:00Z');
      
      expect(metrics).toHaveLength(1);
      expect(metrics[0].commitHash).toBe('early');
    });
  });
});