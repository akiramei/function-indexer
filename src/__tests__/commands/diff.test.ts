import { createDiffCommand } from '../../commands/diff';
import { GitService } from '../../services/git';
import { FunctionIndexer } from '../../indexer';
import * as fs from 'fs/promises';
import chalk from 'chalk';

jest.mock('../../services/git');
jest.mock('../../indexer');
jest.mock('fs/promises');

// Disable chalk colors for testing
chalk.level = 0;

describe('diff command', () => {
  let mockGitService: jest.Mocked<GitService>;
  let mockIndexer: jest.Mocked<FunctionIndexer>;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    // Setup mocks
    mockGitService = {
      isGitRepository: jest.fn().mockResolvedValue(true),
      compareIndexes: jest.fn(),
      getCurrentBranch: jest.fn(),
      getCommitHash: jest.fn(),
      getBranchDiff: jest.fn(),
      getFileAtRevision: jest.fn(),
      getChangedFiles: jest.fn()
    } as any;

    mockIndexer = {
      run: jest.fn().mockResolvedValue({
        totalFiles: 10,
        totalFunctions: 50,
        processedFiles: [],
        errors: [],
        executionTime: 100
      })
    } as any;

    (GitService as jest.Mock).mockImplementation(() => mockGitService);
    (FunctionIndexer as jest.Mock).mockImplementation(() => mockIndexer);
    
    // Mock fs operations
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.rm as jest.Mock).mockResolvedValue(undefined);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

    // Spy on console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(((code?: string | number | null | undefined) => {
      throw new Error(`Process exited with code ${code}`);
    }) as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('basic functionality', () => {
    it('should detect when not in a git repository', async () => {
      mockGitService.isGitRepository.mockResolvedValue(false);

      const command = createDiffCommand();
      
      await expect(
        command.parseAsync(['node', 'test', 'main', 'feature'])
      ).rejects.toThrow('Process exited with code 1');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error: Not a git repository')
      );
    });

    it('should compare two branches successfully', async () => {
      const diffResult = {
        added: [{
          file: 'src/new.ts',
          identifier: 'newFunction',
          startLine: 1,
          metrics: {
            cyclomaticComplexity: 3,
            linesOfCode: 10
          }
        }],
        modified: [],
        removed: []
      };

      mockGitService.compareIndexes.mockResolvedValue(diffResult as any);

      const command = createDiffCommand();
      await command.parseAsync(['node', 'test', 'main', 'feature']);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Comparing main...feature')
      );
      expect(mockIndexer.run).toHaveBeenCalledTimes(2); // Once for each branch
    });

    it('should use default branches when not specified', async () => {
      mockGitService.compareIndexes.mockResolvedValue({
        added: [],
        modified: [],
        removed: []
      } as any);

      const command = createDiffCommand();
      await command.parseAsync(['node', 'test']);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Comparing main...HEAD')
      );
    });
  });

  describe('output formatting', () => {
    const createMockDiffResult = () => ({
      added: [{
        file: 'src/auth.ts',
        identifier: 'authenticate',
        startLine: 10,
        metrics: {
          cyclomaticComplexity: 12,
          cognitiveComplexity: 15,
          linesOfCode: 45,
          nestingDepth: 3,
          parameterCount: 3
        }
      }],
      modified: [{
        before: {
          file: 'src/user.ts',
          identifier: 'getUser',
          metrics: { cyclomaticComplexity: 5 }
        },
        after: {
          file: 'src/user.ts',
          identifier: 'getUser',
          startLine: 20,
          metrics: { cyclomaticComplexity: 8 }
        },
        metricsChanges: {
          cyclomaticComplexity: { before: 5, after: 8, change: 3 }
        }
      }],
      removed: [{
        file: 'src/legacy.ts',
        identifier: 'oldFunction',
        startLine: 5
      }]
    });

    it('should format terminal output correctly', async () => {
      mockGitService.compareIndexes.mockResolvedValue(createMockDiffResult() as any);

      const command = createDiffCommand();
      await command.parseAsync(['node', 'test', 'main', 'feature', '--format', 'terminal']);

      // Check for section headers
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Function Changes Summary:')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Added Functions:')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Modified Functions:')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Removed Functions:')
      );
    });

    it('should output JSON format when requested', async () => {
      const diffResult = createMockDiffResult();
      mockGitService.compareIndexes.mockResolvedValue(diffResult as any);

      const command = createDiffCommand();
      await command.parseAsync(['node', 'test', 'main', 'feature', '--format', 'json']);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        JSON.stringify(diffResult, null, 2)
      );
    });

    it('should save output to file when specified', async () => {
      mockGitService.compareIndexes.mockResolvedValue(createMockDiffResult() as any);

      const command = createDiffCommand();
      await command.parseAsync([
        'node', 'test', 'main', 'feature',
        '--output', 'diff-result.md',
        '--format', 'markdown'
      ]);

      expect(fs.writeFile).toHaveBeenCalledWith(
        'diff-result.md',
        expect.stringContaining('## Function Changes Summary')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Diff saved to diff-result.md')
      );
    });
  });

  describe('threshold violations', () => {
    it('should highlight functions exceeding thresholds', async () => {
      const diffResult = {
        added: [{
          file: 'src/complex.ts',
          identifier: 'complexFunction',
          startLine: 1,
          metrics: {
            cyclomaticComplexity: 15, // Exceeds default threshold of 10
            linesOfCode: 100 // Exceeds default threshold of 40
          }
        }],
        modified: [],
        removed: []
      };

      mockGitService.compareIndexes.mockResolvedValue(diffResult as any);

      const command = createDiffCommand();
      
      await expect(
        command.parseAsync(['node', 'test', 'main', 'feature'])
      ).rejects.toThrow('Process exited with code 1');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('cyclomaticComplexity: 15')
      );
    });

    it('should use custom thresholds when provided', async () => {
      const diffResult = {
        added: [{
          file: 'src/ok.ts',
          identifier: 'okFunction',
          startLine: 1,
          metrics: {
            cyclomaticComplexity: 15 // Would exceed default, but not custom
          }
        }],
        modified: [],
        removed: []
      };

      mockGitService.compareIndexes.mockResolvedValue(diffResult as any);

      const customThresholds = { cyclomaticComplexity: 20 };
      const command = createDiffCommand();
      
      await command.parseAsync([
        'node', 'test', 'main', 'feature',
        '--thresholds', JSON.stringify(customThresholds)
      ]);

      // Should not exit with error since custom threshold is higher
      expect(processExitSpy).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle indexing errors gracefully', async () => {
      mockIndexer.run.mockRejectedValue(new Error('Indexing failed'));

      const command = createDiffCommand();
      
      await expect(
        command.parseAsync(['node', 'test', 'main', 'feature'])
      ).rejects.toThrow('Process exited with code 1');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error:'),
        expect.any(Error)
      );
    });

    it('should handle invalid JSON in thresholds', async () => {
      const command = createDiffCommand();
      
      await expect(
        command.parseAsync([
          'node', 'test', 'main', 'feature',
          '--thresholds', 'invalid-json'
        ])
      ).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error:'),
        expect.any(Error)
      );
    });
  });
});