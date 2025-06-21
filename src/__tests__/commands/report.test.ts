import { createReportCommand } from '../../commands/report';
import { ConfigService } from '../../services/config-service';
import { ProjectDetector } from '../../utils/project-detector';
import * as fs from 'fs/promises';
import chalk from 'chalk';

jest.mock('../../services/config-service');
jest.mock('../../utils/project-detector');
jest.mock('fs/promises');
jest.mock('handlebars', () => ({
  compile: jest.fn().mockImplementation((template: string) => {
    return (data: any) => {
      // If it's a custom template, return custom output
      if (template.includes('# Custom Report')) {
        return `# Custom Report\nFunctions: ${data.summary.totalFunctions}`;
      }
      
      // Default template behavior
      let result = `
# Function Index Report

Generated: ${data.generatedAt}

## Summary
- Total Functions: ${data.summary.totalFunctions}
- High Complexity: ${data.summary.highComplexity}
- Missing Types: ${data.summary.missingTypes}

${data.violations.length > 0 ? '## Violations\n' + data.violations.map((v: any) => 
  `### ${v.identifier}\nFile: ${v.file}:${v.startLine}\n${v.issues.map((i: string) => `- ${i}`).join('\n')}`
).join('\n') : ''}
`;
      return result.trim();
    };
  })
}));

// Disable chalk colors for testing
chalk.level = 0;

describe('report command', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  const mockProjectInfo = {
    root: '/test/project',
    type: 'typescript' as const
  };

  const mockConfig = {
    root: '/test/project',
    output: '/test/project/.function-indexer/index.jsonl',
    domain: 'main'
  };

  const mockFunctions = [
    {
      file: 'src/simple.ts',
      identifier: 'simpleFunction',
      startLine: 1,
      metrics: {
        cyclomaticComplexity: 3,
        cognitiveComplexity: 3,
        linesOfCode: 10,
        nestingDepth: 1,
        parameterCount: 2,
        hasReturnType: true
      }
    },
    {
      file: 'src/complex.ts',
      identifier: 'complexFunction',
      startLine: 10,
      metrics: {
        cyclomaticComplexity: 15, // Exceeds threshold
        cognitiveComplexity: 20,  // Exceeds threshold
        linesOfCode: 60,          // Exceeds threshold
        nestingDepth: 5,          // Exceeds threshold
        parameterCount: 6,        // Exceeds threshold
        hasReturnType: false      // Missing return type
      }
    },
    {
      file: 'src/medium.ts',
      identifier: 'mediumFunction',
      startLine: 20,
      metrics: {
        cyclomaticComplexity: 8,
        cognitiveComplexity: 12,
        linesOfCode: 30,
        nestingDepth: 2,
        parameterCount: 3,
        hasReturnType: true
      }
    }
  ];

  beforeEach(() => {
    // Setup mocks
    (ProjectDetector.detectProject as jest.Mock).mockReturnValue(mockProjectInfo);
    (ConfigService.isInitialized as jest.Mock).mockReturnValue(true);
    (ConfigService.loadConfig as jest.Mock).mockReturnValue(mockConfig);
    
    // Mock file operations
    (fs.stat as jest.Mock).mockResolvedValue({}); // File exists
    (fs.readFile as jest.Mock).mockImplementation((path: string) => {
      if (path.includes('index.jsonl')) {
        return Promise.resolve(mockFunctions.map(f => JSON.stringify(f)).join('\n'));
      }
      if (path.includes('report-markdown.hbs')) {
        return Promise.resolve(`
# Function Index Report

Generated: {{generatedAt}}

## Summary
- Total Functions: {{summary.totalFunctions}}
- High Complexity: {{summary.highComplexity}}
- Missing Types: {{summary.missingTypes}}

{{#if violations}}
## Violations
{{#each violations}}
### {{this.identifier}}
File: {{this.file}}:{{this.startLine}}
{{#each this.issues}}
- {{this}}
{{/each}}
{{/each}}
{{/if}}
        `);
      }
      return Promise.resolve('');
    });
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

    // Set test environment
    process.env.NODE_ENV = 'test';
    
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
    it('should check if project is initialized', async () => {
      (ConfigService.isInitialized as jest.Mock).mockReturnValue(false);

      const command = createReportCommand();
      
      await expect(
        command.parseAsync(['node', 'test'])
      ).rejects.toThrow('Project not initialized. Run `function-indexer` first to initialize the project.');
    });

    it('should check if index file exists', async () => {
      (fs.stat as jest.Mock).mockRejectedValue(new Error('File not found'));

      const command = createReportCommand();
      
      await expect(
        command.parseAsync(['node', 'test'])
      ).rejects.toThrow('Index file not found. Run `function-indexer` to create the index.');
    });

    it('should generate report successfully', async () => {
      const command = createReportCommand();
      await command.parseAsync(['node', 'test']);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Generating report...')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Function Index Report')
      );
    });
  });

  describe('report data generation', () => {
    it('should calculate summary statistics correctly', async () => {
      const command = createReportCommand();
      await command.parseAsync(['node', 'test', '--format', 'json']);

      // Check that output includes correct statistics
      const jsonCall = consoleLogSpy.mock.calls.find(call => 
        call[0].includes('"totalFunctions"')
      );
      
      expect(jsonCall).toBeDefined();
      const reportData = JSON.parse(jsonCall[0]);
      
      expect(reportData.summary).toEqual({
        totalFunctions: 3,
        highComplexity: 1, // Only complexFunction exceeds multiple thresholds
        missingTypes: 1,   // Only complexFunction has no return type
        avgComplexity: expect.any(Number)
      });
    });

    it('should identify violations correctly', async () => {
      const command = createReportCommand();
      await command.parseAsync(['node', 'test', '--format', 'json']);

      const jsonCall = consoleLogSpy.mock.calls.find(call => 
        call[0].includes('"violations"')
      );
      
      const reportData = JSON.parse(jsonCall[0]);
      
      expect(reportData.violations).toHaveLength(1);
      expect(reportData.violations[0]).toEqual({
        identifier: 'complexFunction',
        file: 'src/complex.ts',
        startLine: 10,
        issues: expect.arrayContaining([
          expect.stringContaining('Cyclomatic complexity: 15'),
          expect.stringContaining('Cognitive complexity: 20'),
          expect.stringContaining('Lines of code: 60'),
          expect.stringContaining('Nesting depth: 5'),
          expect.stringContaining('Parameter count: 6')
        ])
      });
    });

    it('should calculate file metrics correctly', async () => {
      const command = createReportCommand();
      await command.parseAsync(['node', 'test', '--format', 'json']);

      const jsonCall = consoleLogSpy.mock.calls.find(call => 
        call[0].includes('"fileMetrics"')
      );
      
      const reportData = JSON.parse(jsonCall[0]);
      
      expect(reportData.fileMetrics).toEqual(
        expect.arrayContaining([
          {
            file: 'src/complex.ts',
            functionCount: 1,
            avgComplexity: 15,
            maxComplexity: 15
          },
          {
            file: 'src/medium.ts',
            functionCount: 1,
            avgComplexity: 8,
            maxComplexity: 8
          },
          {
            file: 'src/simple.ts',
            functionCount: 1,
            avgComplexity: 3,
            maxComplexity: 3
          }
        ])
      );
    });
  });

  describe('output formats', () => {
    it('should generate markdown format by default', async () => {
      const command = createReportCommand();
      await command.parseAsync(['node', 'test']);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('# Function Index Report')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('## Summary')
      );
    });

    it('should generate HTML format when requested', async () => {
      const command = createReportCommand();
      await command.parseAsync(['node', 'test', '--format', 'html']);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('<!DOCTYPE html>')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('<title>Function Index Report</title>')
      );
    });

    it('should generate JSON format when requested', async () => {
      const command = createReportCommand();
      await command.parseAsync(['node', 'test', '--format', 'json']);

      const jsonCall = consoleLogSpy.mock.calls.find(call => 
        call[0].includes('"generatedAt"')
      );
      
      expect(jsonCall).toBeDefined();
      expect(() => JSON.parse(jsonCall[0])).not.toThrow();
    });

    it('should save output to file when specified', async () => {
      const command = createReportCommand();
      await command.parseAsync([
        'node', 'test',
        '--output', 'report.md',
        '--format', 'markdown'
      ]);

      expect(fs.writeFile).toHaveBeenCalledWith(
        'report.md',
        expect.stringContaining('# Function Index Report')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Report saved to report.md')
      );
    });
  });

  describe('custom templates', () => {
    it('should use custom template when provided', async () => {
      const customTemplate = '# Custom Report\nFunctions: {{summary.totalFunctions}}';
      (fs.readFile as jest.Mock).mockImplementation((path: string) => {
        if (path.includes('custom-template.hbs')) {
          return Promise.resolve(customTemplate);
        }
        if (path.includes('index.jsonl')) {
          return Promise.resolve(mockFunctions.map(f => JSON.stringify(f)).join('\n'));
        }
        return Promise.resolve('');
      });
      
      // Mock stat for custom template file to make it appear to exist
      (fs.stat as jest.Mock).mockImplementation((path: string) => {
        if (path.includes('custom-template.hbs')) {
          return Promise.resolve({ isFile: () => true });
        }
        return Promise.resolve({});
      });

      const command = createReportCommand();
      await command.parseAsync([
        'node', 'test',
        '--template', 'custom-template.hbs'
      ]);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('# Custom Report')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Functions: 3')
      );
    });
  });

  describe('custom thresholds', () => {
    it('should use custom thresholds when provided', async () => {
      const customThresholds = {
        cyclomaticComplexity: 20, // Higher than default
        cognitiveComplexity: 25,
        linesOfCode: 100,
        nestingDepth: 10,
        parameterCount: 10
      };

      const command = createReportCommand();
      await command.parseAsync([
        'node', 'test',
        '--thresholds', JSON.stringify(customThresholds),
        '--format', 'json'
      ]);

      const jsonCall = consoleLogSpy.mock.calls.find(call => 
        call[0].includes('"violations"')
      );
      
      const reportData = JSON.parse(jsonCall[0]);
      
      // With higher thresholds, should have no violations
      expect(reportData.violations).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should handle file read errors gracefully', async () => {
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('Read failed'));

      const command = createReportCommand();
      
      await expect(
        command.parseAsync(['node', 'test'])
      ).rejects.toThrow('Failed to read file: /test/project/.function-indexer/index.jsonl (Read failed)');
    });

    it('should handle invalid JSON in index file', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      (fs.readFile as jest.Mock).mockImplementation((path: string) => {
        if (path.includes('index.jsonl')) {
          return Promise.resolve('invalid json\n{"file": "test.ts", "identifier": "validFunction"}');
        }
        return Promise.resolve('template content');
      });

      const command = createReportCommand();
      await command.parseAsync(['node', 'test']);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('⚠️ Skipping malformed JSON at line 1')
      );
      
      consoleWarnSpy.mockRestore();
    });

    it('should handle invalid custom thresholds', async () => {
      const command = createReportCommand();
      
      await expect(
        command.parseAsync([
          'node', 'test',
          '--thresholds', 'invalid-json'
        ])
      ).rejects.toThrow();
    });
  });
});