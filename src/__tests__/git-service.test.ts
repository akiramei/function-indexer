import { GitService, DiffResult } from '../services/git';
import { FunctionInfo } from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';
import simpleGit from 'simple-git';

jest.mock('simple-git');
jest.mock('fs/promises');

describe('GitService', () => {
  let gitService: GitService;
  let mockGit: any;

  beforeEach(() => {
    mockGit = {
      revparse: jest.fn(),
      diff: jest.fn(),
      show: jest.fn(),
      status: jest.fn()
    };
    (simpleGit as jest.Mock).mockReturnValue(mockGit);
    gitService = new GitService('/test/repo');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentBranch', () => {
    it('should return the current branch name', async () => {
      mockGit.revparse.mockResolvedValue('feature-branch\n');
      
      const branch = await gitService.getCurrentBranch();
      
      expect(branch).toBe('feature-branch');
      expect(mockGit.revparse).toHaveBeenCalledWith(['--abbrev-ref', 'HEAD']);
    });
  });

  describe('getCommitHash', () => {
    it('should return the first 8 characters of commit hash', async () => {
      mockGit.revparse.mockResolvedValue('abcdef1234567890\n');
      
      const hash = await gitService.getCommitHash();
      
      expect(hash).toBe('abcdef12');
      expect(mockGit.revparse).toHaveBeenCalledWith(['HEAD']);
    });
  });

  describe('getBranchDiff', () => {
    it('should return list of changed TypeScript files', async () => {
      const diffOutput = 'src/file1.ts\nsrc/file2.tsx\nsrc/file3.js\n';
      mockGit.diff.mockResolvedValue(diffOutput);
      
      const files = await gitService.getBranchDiff('main', 'feature');
      
      expect(files).toEqual(['src/file1.ts', 'src/file2.tsx', 'src/file3.js']);
      expect(mockGit.diff).toHaveBeenCalledWith([
        '--name-only',
        'main...feature',
        '--',
        '*.ts',
        '*.tsx'
      ]);
    });

    it('should use HEAD as default target', async () => {
      mockGit.diff.mockResolvedValue('src/file1.ts\n');
      
      await gitService.getBranchDiff('main');
      
      expect(mockGit.diff).toHaveBeenCalledWith([
        '--name-only',
        'main...HEAD',
        '--',
        '*.ts',
        '*.tsx'
      ]);
    });
  });

  describe('getFileAtRevision', () => {
    it('should return file content at specific revision', async () => {
      const fileContent = 'export function test() { return true; }';
      mockGit.show.mockResolvedValue(fileContent);
      
      const content = await gitService.getFileAtRevision('src/test.ts', 'main');
      
      expect(content).toBe(fileContent);
      expect(mockGit.show).toHaveBeenCalledWith(['main:src/test.ts']);
    });

    it('should return null if file does not exist at revision', async () => {
      mockGit.show.mockRejectedValue(new Error('File not found'));
      
      const content = await gitService.getFileAtRevision('src/test.ts', 'main');
      
      expect(content).toBeNull();
    });
  });

  describe('compareIndexes', () => {
    const createMockFunction = (file: string, identifier: string, complexity: number = 5): FunctionInfo => ({
      file,
      identifier,
      signature: `function ${identifier}()`,
      startLine: 10,
      endLine: 20,
      hash_function: `hash_${identifier}`,
      hash_file: 'file_hash',
      exported: true,
      async: false,
      metrics: {
        cyclomaticComplexity: complexity,
        cognitiveComplexity: complexity + 2,
        linesOfCode: 10,
        nestingDepth: 2,
        parameterCount: 2,
        hasReturnType: true
      },
      domain: 'test'
    });

    beforeEach(() => {
      // Reset the readFile mock for each test
      (fs.readFile as jest.Mock).mockClear();
    });

    it('should detect added functions', async () => {
      const baseIndex: FunctionInfo[] = [
        createMockFunction('src/file1.ts', 'func1')
      ];
      const targetIndex: FunctionInfo[] = [
        createMockFunction('src/file1.ts', 'func1'),
        createMockFunction('src/file2.ts', 'func2')
      ];

      // Mock the readIndexFile method by spying on it
      const spy = jest.spyOn(gitService as any, 'readIndexFile')
        .mockResolvedValueOnce(baseIndex)
        .mockResolvedValueOnce(targetIndex);

      const result = await gitService.compareIndexes('base.jsonl', 'target.jsonl');

      expect(result.added).toHaveLength(1);
      expect(result.added[0].identifier).toBe('func2');
      expect(result.modified).toHaveLength(0);
      expect(result.removed).toHaveLength(0);
      
      spy.mockRestore();
    });

    it('should detect modified functions', async () => {
      const baseFunc = createMockFunction('src/file1.ts', 'func1', 5);
      const targetFunc = { 
        ...createMockFunction('src/file1.ts', 'func1', 10),
        hash_function: 'different_hash'
      };

      const baseIndex = [baseFunc];
      const targetIndex = [targetFunc];

      const spy = jest.spyOn(gitService as any, 'readIndexFile')
        .mockResolvedValueOnce(baseIndex)
        .mockResolvedValueOnce(targetIndex);

      const result = await gitService.compareIndexes('base.jsonl', 'target.jsonl');

      expect(result.modified).toHaveLength(1);
      expect(result.modified[0].before.identifier).toBe('func1');
      expect(result.modified[0].after.identifier).toBe('func1');
      expect(result.modified[0].metricsChanges.cyclomaticComplexity).toEqual({
        before: 5,
        after: 10,
        change: 5
      });
      
      spy.mockRestore();
    });

    it('should detect removed functions', async () => {
      const baseIndex: FunctionInfo[] = [
        createMockFunction('src/file1.ts', 'func1'),
        createMockFunction('src/file2.ts', 'func2')
      ];
      const targetIndex: FunctionInfo[] = [
        createMockFunction('src/file1.ts', 'func1')
      ];

      const spy = jest.spyOn(gitService as any, 'readIndexFile')
        .mockResolvedValueOnce(baseIndex)
        .mockResolvedValueOnce(targetIndex);

      const result = await gitService.compareIndexes('base.jsonl', 'target.jsonl');

      expect(result.removed).toHaveLength(1);
      expect(result.removed[0].identifier).toBe('func2');
      
      spy.mockRestore();
    });
  });

  describe('isGitRepository', () => {
    it('should return true if in git repository', async () => {
      mockGit.revparse.mockResolvedValue('.git');
      
      const isRepo = await gitService.isGitRepository();
      
      expect(isRepo).toBe(true);
    });

    it('should return false if not in git repository', async () => {
      mockGit.revparse.mockRejectedValue(new Error('Not a git repo'));
      
      const isRepo = await gitService.isGitRepository();
      
      expect(isRepo).toBe(false);
    });
  });

  describe('getChangedFiles', () => {
    it('should return changed files from git status when no base provided', async () => {
      mockGit.status.mockResolvedValue({
        modified: ['src/file1.ts', 'src/file2.tsx'],
        created: ['src/new.ts'],
        renamed: [{ from: 'old.ts', to: 'src/renamed.tsx' }]
      });

      const files = await gitService.getChangedFiles();

      expect(files).toEqual(['src/file1.ts', 'src/file2.tsx', 'src/new.ts', 'src/renamed.tsx']);
    });

    it('should filter out non-TypeScript files', async () => {
      mockGit.status.mockResolvedValue({
        modified: ['src/file1.ts', 'README.md', 'src/file2.tsx'],
        created: ['package.json'],
        renamed: []
      });

      const files = await gitService.getChangedFiles();

      expect(files).toEqual(['src/file1.ts', 'src/file2.tsx']);
    });

    it('should use getBranchDiff when base is provided', async () => {
      const spy = jest.spyOn(gitService, 'getBranchDiff').mockResolvedValue(['src/file1.ts']);

      const files = await gitService.getChangedFiles('main');

      expect(files).toEqual(['src/file1.ts']);
      expect(spy).toHaveBeenCalledWith('main');
    });
  });
});