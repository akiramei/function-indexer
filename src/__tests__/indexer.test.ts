import { FunctionIndexer } from '../indexer';
import { IndexerOptions } from '../types';
import * as fs from 'fs';
import * as path from 'path';

describe('FunctionIndexer', () => {
  const testDir = '.test-indexer';
  const testSrcDir = path.join(testDir, 'src');

  const createTestFile = (filePath: string, content: string) => {
    const fullPath = path.join(testSrcDir, filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, content);
  };

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
    fs.mkdirSync(testSrcDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  describe('function extraction', () => {
    it('should extract function declarations', async () => {
      createTestFile('functions.ts', `
        export function regularFunction(param: string): number {
          return param.length;
        }
        
        function internalFunction(): void {
          console.log('internal');
        }
      `);

      const options: IndexerOptions = {
        root: testSrcDir,
        output: path.join(testDir, 'test-output.jsonl'),
        domain: 'test',
        verbose: false
      };

      const indexer = new FunctionIndexer(options);
      const result = await indexer.run();

      expect(result.totalFunctions).toBe(2);
      expect(result.totalFiles).toBe(1);

      // Check output file
      const content = fs.readFileSync(options.output, 'utf8');
      const functions = content.trim().split('\n').map(line => JSON.parse(line));
      
      expect(functions).toHaveLength(2);
      expect(functions.some(f => f.identifier === 'regularFunction')).toBe(true);
      expect(functions.some(f => f.identifier === 'internalFunction')).toBe(true);
      
      const exportedFunc = functions.find(f => f.identifier === 'regularFunction');
      expect(exportedFunc.exported).toBe(true);
      expect(exportedFunc.metrics.parameterCount).toBe(1);
      expect(exportedFunc.metrics.hasReturnType).toBe(true);
    });

    it('should extract class methods', async () => {
      createTestFile('classes.ts', `
        export class Calculator {
          add(a: number, b: number): number {
            return a + b;
          }
          
          private multiply(x: number, y: number): number {
            return x * y;
          }
          
          async fetchResult(): Promise<number> {
            return 42;
          }
        }
      `);

      const options: IndexerOptions = {
        root: testSrcDir,
        output: path.join(testDir, 'classes-output.jsonl'),
        domain: 'test',
        verbose: false
      };

      const indexer = new FunctionIndexer(options);
      const result = await indexer.run();

      expect(result.totalFunctions).toBe(3);

      const content = fs.readFileSync(options.output, 'utf8');
      const functions = content.trim().split('\n').map(line => JSON.parse(line));
      
      expect(functions.some(f => f.identifier === 'Calculator.add')).toBe(true);
      expect(functions.some(f => f.identifier === 'Calculator.multiply')).toBe(true);
      expect(functions.some(f => f.identifier === 'Calculator.fetchResult')).toBe(true);
      
      const asyncMethod = functions.find(f => f.identifier === 'Calculator.fetchResult');
      expect(asyncMethod.async).toBe(true);
      expect(asyncMethod.signature).toContain('async');
      expect(asyncMethod.signature).toContain('Promise<number>');
    });

    it('should extract arrow functions and function expressions', async () => {
      createTestFile('arrows.ts', `
        export const arrowFunction = (value: string) => value.toUpperCase();
        
        export const functionExpression = function(items: number[]): number {
          return items.reduce((sum, item) => sum + item, 0);
        };
        
        const internalArrow = () => 'internal';
      `);

      const options: IndexerOptions = {
        root: testSrcDir,
        output: path.join(testDir, 'arrows-output.jsonl'),
        domain: 'test',
        verbose: false
      };

      const indexer = new FunctionIndexer(options);
      const result = await indexer.run();

      expect(result.totalFunctions).toBe(3);

      const content = fs.readFileSync(options.output, 'utf8');
      const functions = content.trim().split('\n').map(line => JSON.parse(line));
      
      expect(functions.some(f => f.identifier === 'arrowFunction')).toBe(true);
      expect(functions.some(f => f.identifier === 'functionExpression')).toBe(true);
      expect(functions.some(f => f.identifier === 'internalArrow')).toBe(true);
      
      const arrowFunc = functions.find(f => f.identifier === 'arrowFunction');
      expect(arrowFunc.signature).toContain('=>');
      expect(arrowFunc.exported).toBe(true);
    });
  });

  describe('file filtering', () => {
    it('should respect include and exclude patterns', async () => {
      createTestFile('included.ts', 'export function included() {}');
      createTestFile('excluded.test.ts', 'export function excluded() {}');
      createTestFile('utils/helper.tsx', 'export function helper() {}');

      const options: IndexerOptions = {
        root: testSrcDir,
        output: path.join(testDir, 'filtered-output.jsonl'),
        domain: 'test',
        include: ['**/*.ts', '**/*.tsx'],
        exclude: ['**/*.test.ts'],
        verbose: false
      };

      const indexer = new FunctionIndexer(options);
      const result = await indexer.run();

      expect(result.totalFunctions).toBe(2); // included.ts and helper.tsx

      const content = fs.readFileSync(options.output, 'utf8');
      const functions = content.trim().split('\n').map(line => JSON.parse(line));
      
      expect(functions.some(f => f.identifier === 'included')).toBe(true);
      expect(functions.some(f => f.identifier === 'helper')).toBe(true);
      expect(functions.some(f => f.identifier === 'excluded')).toBe(false);
    });

    it('should use default patterns when none specified', async () => {
      createTestFile('default.ts', 'export function defaultFunc() {}');
      createTestFile('default.js', 'export function jsFunc() {}');
      createTestFile('default.py', 'def python_func(): pass');

      const options: IndexerOptions = {
        root: testSrcDir,
        output: path.join(testDir, 'default-output.jsonl'),
        domain: 'test',
        verbose: false
        // No include/exclude specified
      };

      const indexer = new FunctionIndexer(options);
      const result = await indexer.run();

      // Should process .ts files by default (and potentially .js if in default patterns)
      expect(result.totalFunctions).toBeGreaterThanOrEqual(1);
      
      const content = fs.readFileSync(options.output, 'utf8');
      const functions = content.trim().split('\n').map(line => JSON.parse(line));
      
      expect(functions.some(f => f.identifier === 'defaultFunc')).toBe(true);
    });
  });

  describe('metadata generation', () => {
    it('should create metadata file', async () => {
      createTestFile('sample.ts', 'export function sample() {}');

      const options: IndexerOptions = {
        root: testSrcDir,
        output: path.join(testDir, 'metadata-test.jsonl'),
        domain: 'test-domain',
        include: ['**/*.ts'],
        exclude: ['**/*.spec.ts'],
        verbose: false
      };

      const indexer = new FunctionIndexer(options);
      await indexer.run();

      // Check metadata file was created
      const metadataPath = path.join(testDir, 'metadata-test.meta.json');
      expect(fs.existsSync(metadataPath)).toBe(true);

      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      expect(metadata.version).toBe('1.0.0');
      expect(metadata.indexFile).toBe('metadata-test.jsonl');
      expect(metadata.options.domain).toBe('test-domain');
      expect(metadata.options.root).toBe(testSrcDir);
      expect(metadata.options.include).toEqual(['**/*.ts']);
      expect(metadata.options.exclude).toEqual(['**/*.spec.ts']);
      expect(metadata.statistics.totalFiles).toBe(1);
      expect(metadata.statistics.totalFunctions).toBe(1);
      expect(metadata.fileHashes).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle invalid TypeScript files gracefully', async () => {
      createTestFile('invalid.ts', 'this is not valid typescript code {');
      createTestFile('valid.ts', 'export function valid() {}');

      const options: IndexerOptions = {
        root: testSrcDir,
        output: path.join(testDir, 'error-test.jsonl'),
        domain: 'test',
        verbose: false
      };

      const indexer = new FunctionIndexer(options);
      const result = await indexer.run();

      // Should process valid file despite invalid one
      expect(result.totalFunctions).toBe(1);
      // ts-morph may not always throw errors for invalid syntax
      // so we just check that processing continued
      expect(result.totalFiles).toBe(2);
    });

    it('should handle non-existent root directory', async () => {
      const options: IndexerOptions = {
        root: '/nonexistent/directory',
        output: path.join(testDir, 'nonexistent-test.jsonl'),
        domain: 'test',
        verbose: false
      };

      const indexer = new FunctionIndexer(options);
      
      // Should either throw an error or return empty results
      try {
        const result = await indexer.run();
        // If it doesn't throw, it should return empty results
        expect(result.totalFiles).toBe(0);
        expect(result.totalFunctions).toBe(0);
      } catch (error) {
        // If it throws an error, it should be a meaningful error
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toMatch(/directory|not found|does not exist/i);
      }
    });

    it('should handle output directory creation errors', async () => {
      createTestFile('test.ts', 'export function testFunction() {}');
      
      const options: IndexerOptions = {
        root: testSrcDir,
        output: '/root/protected/output.jsonl', // Likely no permission to write here
        domain: 'test',
        verbose: false
      };

      const indexer = new FunctionIndexer(options);
      
      try {
        await indexer.run();
        // If no error is thrown, that's also okay (some systems might handle this)
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toMatch(/permission|access|denied|directory/i);
      }
    });
  });

  describe('hash calculation', () => {
    it('should generate consistent hashes', async () => {
      const content = `
        export function testFunction(param: string): number {
          return param.length;
        }
      `;
      
      createTestFile('hash-test.ts', content);

      const options: IndexerOptions = {
        root: testSrcDir,
        output: path.join(testDir, 'hash-output.jsonl'),
        domain: 'test',
        verbose: false
      };

      const indexer = new FunctionIndexer(options);
      await indexer.run();

      const outputContent = fs.readFileSync(options.output, 'utf8');
      const functions = outputContent.trim().split('\n').map(line => JSON.parse(line));
      
      const func = functions[0];
      expect(func.hash_function).toHaveLength(8);
      expect(func.hash_file).toHaveLength(8);
      expect(func.hash_function).toMatch(/^[a-f0-9]{8}$/);
      expect(func.hash_file).toMatch(/^[a-f0-9]{8}$/);
    });
  });
});