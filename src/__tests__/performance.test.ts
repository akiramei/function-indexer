import { FunctionIndexer } from '../indexer';
import { join } from 'path';
import * as fs from 'fs';
import * as os from 'os';

describe('Performance Benchmarks', () => {
  const TEST_ROOT = join(__dirname, '../../test-src');
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(join(os.tmpdir(), 'function-indexer-perf-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should process 3 test files efficiently', async () => {
    const outputPath = join(tempDir, 'index.jsonl');
    const indexer = new FunctionIndexer({
      root: TEST_ROOT,
      output: outputPath,
      domain: 'test'
    });

    const startTime = Date.now();
    const result = await indexer.run();
    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(result.totalFiles).toBe(3);
    expect(result.totalFunctions).toBeGreaterThanOrEqual(10);
    expect(duration).toBeLessThan(3000); // Should complete in under 3 seconds (allowing for CI environment overhead)
  });

  it('should achieve performance targets for different scales', async () => {
    const outputPath = join(tempDir, 'index.jsonl');
    const indexer = new FunctionIndexer({
      root: TEST_ROOT,
      output: outputPath,
      domain: 'test'
    });

    const startTime = Date.now();
    const result = await indexer.run();
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Performance targets based on issue requirements
    const filesPerSecond = result.totalFiles / (duration / 1000);
    const functionsPerSecond = result.totalFunctions / (duration / 1000);

    console.log(`Performance metrics:
      - Files processed: ${result.totalFiles}
      - Functions indexed: ${result.totalFunctions}
      - Duration: ${duration}ms
      - Files/second: ${filesPerSecond.toFixed(2)}
      - Functions/second: ${functionsPerSecond.toFixed(2)}
    `);

    // For 3 test files, we expect reasonable performance in CI environment
    // Should process at least 1 file per second (allowing for CI overhead)
    expect(filesPerSecond).toBeGreaterThan(1);
    // Should process at least 5 functions per second (allowing for CI overhead)
    expect(functionsPerSecond).toBeGreaterThan(5);
  });

  it('should handle single pass metrics calculation efficiently', async () => {
    const outputPath = join(tempDir, 'index.jsonl');
    const indexer = new FunctionIndexer({
      root: TEST_ROOT,
      output: outputPath,
      domain: 'test'
    });

    const result = await indexer.run();
    
    // Read the output to verify metrics were calculated
    const content = fs.readFileSync(outputPath, 'utf8');
    const functions = content.trim().split('\n').map(line => JSON.parse(line));
    
    // Verify all functions have metrics
    functions.forEach(func => {
      expect(func.metrics).toBeDefined();
      expect(func.metrics.cyclomaticComplexity).toBeGreaterThanOrEqual(1);
      expect(func.metrics.cognitiveComplexity).toBeGreaterThanOrEqual(0);
      expect(func.metrics.nestingDepth).toBeGreaterThanOrEqual(0);
    });
  });
});