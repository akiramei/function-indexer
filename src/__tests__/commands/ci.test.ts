import { createCICommand } from '../../commands/ci';
import { FunctionIndexer } from '../../indexer';
import { GitService } from '../../services/git';
import { MetricsService } from '../../services/metrics-service';
import * as fs from 'fs/promises';
import chalk from 'chalk';

jest.mock('../../indexer');
jest.mock('../../services/git');
jest.mock('../../services/metrics-service');
jest.mock('fs/promises');

// Disable chalk colors for testing
chalk.level = 0;

describe('ci command', () => {
  let mockIndexer: jest.Mocked<FunctionIndexer>;
  let mockGitService: jest.Mocked<GitService>;
  let mockMetricsService: jest.Mocked<MetricsService>;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  const mockFunctions = [
    {
      file: 'src/good.ts',
      identifier: 'goodFunction',
      startLine: 1,
      metrics: {
        cyclomaticComplexity: 5,
        cognitiveComplexity: 6,
        linesOfCode: 20,
        nestingDepth: 2,
        parameterCount: 2
      }
    },
    {
      file: 'src/bad.ts',
      identifier: 'badFunction',
      startLine: 10,
      metrics: {
        cyclomaticComplexity: 15, // Exceeds threshold
        cognitiveComplexity: 20,  // Exceeds threshold
        linesOfCode: 100,         // Exceeds threshold
        nestingDepth: 5,          // Exceeds threshold
        parameterCount: 6         // Exceeds threshold
      }
    }
  ];

  beforeEach(() => {
    // Setup mocks
    mockIndexer = {
      run: jest.fn().mockResolvedValue({
        totalFiles: 10,
        totalFunctions: 50,
        processedFiles: [],
        errors: [],
        executionTime: 100
      })
    } as any;

    mockGitService = {
      getChangedFiles: jest.fn().mockResolvedValue(['src/test.ts'])
    } as any;

    mockMetricsService = {
      collectMetrics: jest.fn().mockResolvedValue(undefined),
      close: jest.fn()
    } as any;

    (FunctionIndexer as jest.Mock).mockImplementation(() => mockIndexer);
    (GitService as jest.Mock).mockImplementation(() => mockGitService);
    (MetricsService as jest.Mock).mockImplementation(() => mockMetricsService);

    // Mock file operations
    (fs.readFile as jest.Mock).mockResolvedValue(
      mockFunctions.map(f => JSON.stringify(f)).join('\n')
    );
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
    (fs.stat as jest.Mock).mockResolvedValue({ size: 1000 }); // Mock file exists with size

    // Set test environment
    process.env.NODE_ENV = 'test';
    
    // Spy on console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(((code?: string | number | null | undefined) => {
      throw new Error(`Process exited with code ${code}`);
    }) as any);

    // Clear environment variables
    delete process.env.GITHUB_ACTIONS;
    delete process.env.GITLAB_CI;
    delete process.env.CIRCLECI;
    delete process.env.JENKINS_URL;
    delete process.env.CI;
    delete process.env.GITHUB_PR_NUMBER;
    delete process.env.CI_MERGE_REQUEST_IID;
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('CI environment detection', () => {
    it('should detect GitHub Actions', async () => {
      process.env.GITHUB_ACTIONS = 'true';
      
      // Use good functions without violations for this test
      (fs.readFile as jest.Mock).mockResolvedValue(
        [mockFunctions[0]].map(f => JSON.stringify(f)).join('\n') // Only goodFunction
      );

      const command = createCICommand();
      await command.parseAsync(['node', 'test']);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Detected CI: GitHub Actions')
      );
    });

    it('should detect GitLab CI', async () => {
      process.env.GITLAB_CI = 'true';
      
      // Use good functions without violations for this test
      (fs.readFile as jest.Mock).mockResolvedValue(
        [mockFunctions[0]].map(f => JSON.stringify(f)).join('\n') // Only goodFunction
      );

      const command = createCICommand();
      await command.parseAsync(['node', 'test']);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Detected CI: GitLab CI')
      );
    });

    it('should detect CircleCI', async () => {
      process.env.CIRCLECI = 'true';
      
      // Use good functions without violations for this test
      (fs.readFile as jest.Mock).mockResolvedValue(
        [mockFunctions[0]].map(f => JSON.stringify(f)).join('\n') // Only goodFunction
      );

      const command = createCICommand();
      await command.parseAsync(['node', 'test']);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Detected CI: CircleCI')
      );
    });

    it('should detect Jenkins', async () => {
      process.env.JENKINS_URL = 'http://jenkins.example.com';
      
      // Use good functions without violations for this test
      (fs.readFile as jest.Mock).mockResolvedValue(
        [mockFunctions[0]].map(f => JSON.stringify(f)).join('\n') // Only goodFunction
      );

      const command = createCICommand();
      await command.parseAsync(['node', 'test']);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Detected CI: Jenkins')
      );
    });

    it('should detect generic CI', async () => {
      process.env.CI = 'true';
      
      // Use good functions without violations for this test
      (fs.readFile as jest.Mock).mockResolvedValue(
        [mockFunctions[0]].map(f => JSON.stringify(f)).join('\n') // Only goodFunction
      );

      const command = createCICommand();
      await command.parseAsync(['node', 'test']);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Detected CI: Generic CI')
      );
    });
  });

  describe('basic functionality', () => {
    it('should run CI analysis successfully', async () => {
      // Use only good functions to ensure this test passes
      (fs.readFile as jest.Mock).mockResolvedValue(
        JSON.stringify(mockFunctions[0]) // Only goodFunction
      );

      const command = createCICommand();
      await command.parseAsync(['node', 'test']);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Running CI analysis...')
      );
      expect(mockIndexer.run).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Quality gate passed!')
      );
    });

    it('should collect metrics when PR number is available', async () => {
      process.env.GITHUB_PR_NUMBER = '123';
      
      // Use only good functions to ensure this test passes
      (fs.readFile as jest.Mock).mockResolvedValue(
        JSON.stringify(mockFunctions[0]) // Only goodFunction
      );

      const command = createCICommand();
      await command.parseAsync(['node', 'test']);

      expect(mockMetricsService.collectMetrics).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          prNumber: 123,
          verbose: false
        })
      );
    });

    it('should handle GitLab merge request ID', async () => {
      process.env.CI_MERGE_REQUEST_IID = '456';
      
      // Use only good functions to ensure this test passes
      (fs.readFile as jest.Mock).mockResolvedValue(
        JSON.stringify(mockFunctions[0]) // Only goodFunction
      );

      const command = createCICommand();
      await command.parseAsync(['node', 'test']);

      expect(mockMetricsService.collectMetrics).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          prNumber: 456
        })
      );
    });
  });

  describe('violation detection', () => {
    it('should detect violations and exit with code 1 by default', async () => {
      const command = createCICommand();
      
      await expect(
        command.parseAsync(['node', 'test'])
      ).rejects.toThrow('Process exited with code 1');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Quality gate failed!')
      );
    });

    it('should not exit with error when --no-fail-on-violation is used', async () => {
      const command = createCICommand();
      await command.parseAsync(['node', 'test', '--no-fail-on-violation']);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Quality issues detected')
      );
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should pass quality gate when no violations', async () => {
      // Mock only good functions
      (fs.readFile as jest.Mock).mockResolvedValue(
        JSON.stringify(mockFunctions[0])
      );

      const command = createCICommand();
      await command.parseAsync(['node', 'test']);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Quality gate passed!')
      );
      expect(processExitSpy).not.toHaveBeenCalled();
    });
  });

  describe('output formats', () => {
    it('should format terminal output by default', async () => {
      const command = createCICommand();
      
      await expect(
        command.parseAsync(['node', 'test'])
      ).rejects.toThrow('Process exited with code 1');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('CI Analysis Results')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Violations:')
      );
    });

    it('should format GitHub annotations when requested', async () => {
      const command = createCICommand();
      
      await expect(
        command.parseAsync(['node', 'test', '--format', 'github'])
      ).rejects.toThrow('Process exited with code 1');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('::error file=src/bad.ts,line=10::')
      );
    });

    it('should format GitLab report when requested', async () => {
      const command = createCICommand();
      
      await expect(
        command.parseAsync(['node', 'test', '--format', 'gitlab'])
      ).rejects.toThrow('Process exited with code 1');

      const gitlabCall = consoleLogSpy.mock.calls.find(call => 
        call[0].includes('"severity"')
      );
      
      expect(gitlabCall).toBeDefined();
      const report = JSON.parse(gitlabCall[0]);
      expect(report).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            description: expect.stringContaining('badFunction'),
            severity: 'major',
            location: expect.objectContaining({
              path: 'src/bad.ts',
              lines: { begin: 10 }
            })
          })
        ])
      );
    });

    it('should output JSON format when requested', async () => {
      const command = createCICommand();
      
      await expect(
        command.parseAsync(['node', 'test', '--format', 'json'])
      ).rejects.toThrow('Process exited with code 1');

      const jsonCall = consoleLogSpy.mock.calls.find(call => 
        call[0].includes('"success"')
      );
      
      expect(jsonCall).toBeDefined();
      const result = JSON.parse(jsonCall[0]);
      expect(result).toEqual({
        success: false,
        summary: expect.objectContaining({
          totalFunctions: 2,
          violations: 1
        }),
        violations: expect.arrayContaining([
          expect.objectContaining({
            file: 'src/bad.ts',
            line: 10,
            identifier: 'badFunction',
            severity: 'error'
          })
        ])
      });
    });
  });

  describe('PR comment generation', () => {
    it('should generate PR comment when requested', async () => {
      const command = createCICommand();
      
      await expect(
        command.parseAsync(['node', 'test', '--comment', '--format', 'json'])
      ).rejects.toThrow('Process exited with code 1');

      const jsonCall = consoleLogSpy.mock.calls.find(call => 
        call[0].includes('"comment"')
      );
      
      expect(jsonCall).toBeDefined();
      const result = JSON.parse(jsonCall[0]);
      expect(result.comment).toContain('Function Indexer Quality Gate failed');
      expect(result.comment).toContain('**Total Functions**: 2');
      expect(result.comment).toContain('**Violations**: 1');
      expect(result.comment).toContain('### ⚠️ Violations');
      expect(result.comment).toContain('**badFunction**');
    });

    it('should generate passing PR comment when no violations', async () => {
      // Mock only good functions
      (fs.readFile as jest.Mock).mockResolvedValue(
        JSON.stringify(mockFunctions[0])
      );

      const command = createCICommand();
      await command.parseAsync(['node', 'test', '--comment', '--format', 'json']);

      const jsonCall = consoleLogSpy.mock.calls.find(call => 
        call[0].includes('"comment"')
      );
      
      expect(jsonCall).toBeDefined();
      const result = JSON.parse(jsonCall[0]);
      expect(result.comment).toContain('Function Indexer Quality Gate passed');
      expect(result.comment).toContain('✅');
    });
  });

  describe('file output', () => {
    it('should save results to file when specified', async () => {
      const command = createCICommand();
      
      await expect(
        command.parseAsync(['node', 'test', '--output', 'ci-results.json', '--format', 'json'])
      ).rejects.toThrow('Process exited with code 1');

      expect(fs.writeFile).toHaveBeenCalledWith(
        'ci-results.json',
        expect.stringContaining('"success": false')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Results saved to ci-results.json')
      );
    });
  });

  describe('custom thresholds', () => {
    it('should use custom thresholds when provided', async () => {
      const customThresholds = {
        cyclomaticComplexity: 20, // Higher than default
        cognitiveComplexity: 25,
        linesOfCode: 150,
        nestingDepth: 10,
        parameterCount: 10
      };

      const command = createCICommand();
      await command.parseAsync([
        'node', 'test',
        '--thresholds', JSON.stringify(customThresholds)
      ]);

      // Should pass with higher thresholds
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Quality gate passed!')
      );
      expect(processExitSpy).not.toHaveBeenCalled();
    });
  });

  describe('base branch comparison', () => {
    it('should get diff information when base branch is provided', async () => {
      const command = createCICommand();
      await command.parseAsync(['node', 'test', '--base', 'main', '--no-fail-on-violation']);

      expect(mockGitService.getChangedFiles).toHaveBeenCalledWith('main');
    });

    it('should handle git service errors gracefully', async () => {
      mockGitService.getChangedFiles.mockRejectedValue(new Error('Git error'));

      const command = createCICommand();
      await command.parseAsync(['node', 'test', '--base', 'main', '--no-fail-on-violation']);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Could not get diff information')
      );
    });
  });

  describe('error handling', () => {
    it('should handle indexing errors gracefully', async () => {
      mockIndexer.run.mockRejectedValue(new Error('Indexing failed'));

      const command = createCICommand();
      
      await expect(
        command.parseAsync(['node', 'test'])
      ).rejects.toThrow('Indexing failed');
    });

    it('should handle metrics collection errors gracefully', async () => {
      process.env.GITHUB_PR_NUMBER = '123';
      mockMetricsService.collectMetrics.mockRejectedValue(new Error('Metrics failed'));

      const command = createCICommand();
      await command.parseAsync(['node', 'test', '--no-fail-on-violation']);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Could not collect metrics')
      );
    });

    it('should handle invalid JSON in thresholds', async () => {
      const command = createCICommand();
      
      await expect(
        command.parseAsync([
          'node', 'test',
          '--thresholds', 'invalid-json'
        ])
      ).rejects.toThrow();
    });
  });
});