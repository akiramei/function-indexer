import { SearchService } from '../search';
import { FunctionInfo } from '../types';
import * as fs from 'fs';
import * as path from 'path';

describe('SearchService', () => {
  let searchService: SearchService;
  const testDbPath = '.test-db/search-history.db';

  beforeEach(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    searchService = new SearchService(testDbPath);
  });

  afterEach(() => {
    searchService.close();
    if (fs.existsSync(path.dirname(testDbPath))) {
      fs.rmSync(path.dirname(testDbPath), { recursive: true });
    }
  });

  describe('search functionality', () => {
    const mockFunctions: FunctionInfo[] = [
      {
        file: 'src/utils/image.ts',
        identifier: 'resizeImage',
        signature: 'async function resizeImage(input: Buffer, width: number): Promise<Buffer>',
        startLine: 10,
        endLine: 20,
        hash_function: 'abc123',
        hash_file: 'def456',
        exported: true,
        async: true,
        metrics: {
          linesOfCode: 10,
          parameterCount: 2,
          hasReturnType: true
        },
        domain: 'image-processing'
      },
      {
        file: 'src/utils/file.ts',
        identifier: 'readFile',
        signature: 'function readFile(path: string): string',
        startLine: 5,
        endLine: 15,
        hash_function: 'ghi789',
        hash_file: 'jkl012',
        exported: true,
        async: false,
        metrics: {
          linesOfCode: 10,
          parameterCount: 1,
          hasReturnType: true
        },
        domain: 'file-system'
      }
    ];

    beforeEach(() => {
      const tempIndexPath = '.test-index.jsonl';
      fs.writeFileSync(
        tempIndexPath, 
        mockFunctions.map(f => JSON.stringify(f)).join('\n')
      );
      searchService.loadFunctionIndex(tempIndexPath);
      fs.unlinkSync(tempIndexPath);
    });

    test('should find functions by keyword', () => {
      const results = searchService.search({ 
        query: 'image',
        saveHistory: false 
      });
      
      expect(results).toHaveLength(1);
      expect(results[0].identifier).toBe('resizeImage');
    });

    test('should find async functions', () => {
      const results = searchService.search({ 
        query: 'async function',
        saveHistory: false 
      });
      
      expect(results).toHaveLength(1);
      expect(results[0].identifier).toBe('resizeImage');
    });

    test('should handle no results', () => {
      const results = searchService.search({ 
        query: 'nonexistent',
        saveHistory: false 
      });
      
      expect(results).toHaveLength(0);
    });

    test('should respect result limit', () => {
      const results = searchService.search({ 
        query: 'function',
        saveHistory: false,
        limit: 1
      });
      
      expect(results).toHaveLength(1);
    });
  });

  describe('search history', () => {
    test('should save search history when enabled', () => {
      const mockFunctions: FunctionInfo[] = [{
        file: 'test.ts',
        identifier: 'testFunc',
        signature: 'function testFunc(): void',
        startLine: 1,
        endLine: 3,
        hash_function: 'test123',
        hash_file: 'test456',
        exported: true,
        async: false,
        metrics: { linesOfCode: 3, parameterCount: 0, hasReturnType: false },
        domain: 'test'
      }];

      const tempIndexPath = '.test-index.jsonl';
      fs.writeFileSync(tempIndexPath, JSON.stringify(mockFunctions[0]));
      searchService.loadFunctionIndex(tempIndexPath);
      fs.unlinkSync(tempIndexPath);

      searchService.search({ 
        query: 'test',
        context: 'unit testing',
        saveHistory: true 
      });

      const history = searchService.getSearchHistory();
      expect(history).toHaveLength(1);
      expect(history[0].query).toBe('test');
      expect(history[0].context).toBe('unit testing');
    });

    test('should filter search history by query', () => {
      const history = searchService.getSearchHistory('test');
      expect(history).toBeDefined();
    });
  });
});