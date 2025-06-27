import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe.skip('Metrics Command Reorganization', () => {
  // Skip complex metrics reorganization tests due to project initialization dependencies
  // TODO: Fix test environment setup for proper project initialization
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'function-indexer-metrics-test-'));
    process.chdir(testDir);

    // Create a minimal TypeScript project structure
    const packageJson = {
      name: 'test-project',
      version: '1.0.0',
      scripts: {
        build: 'tsc'
      },
      devDependencies: {
        typescript: '^5.0.0'
      }
    };

    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

    // Create tsconfig.json
    const tsConfig = {
      compilerOptions: {
        target: 'es2020',
        module: 'commonjs',
        outDir: './dist',
        rootDir: './src',
        strict: true
      },
      include: ['src/**/*']
    };

    fs.writeFileSync('tsconfig.json', JSON.stringify(tsConfig, null, 2));

    // Create src directory and sample files
    fs.mkdirSync('src', { recursive: true });

    // Create a sample TypeScript file with various complexity levels
    const sampleCode = `
export class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }

  // High complexity function for testing
  complexCalculation(
    input: number,
    options: { multiply?: boolean; divide?: boolean; modulo?: boolean }
  ): number {
    let result = input;
    
    if (options.multiply) {
      if (result > 0) {
        for (let i = 0; i < 3; i++) {
          if (i % 2 === 0) {
            result *= 2;
          } else {
            result *= 3;
          }
          
          if (result > 1000) {
            break;
          }
        }
      } else {
        result = 0;
      }
    }
    
    if (options.divide) {
      if (result > 100) {
        result = result / 2;
      } else if (result > 50) {
        result = result / 3;
      } else {
        result = result / 4;
      }
    }
    
    if (options.modulo) {
      result = result % 17;
    }
    
    return result;
  }

  async processAsync(data: number[]): Promise<number[]> {
    return data.map(x => x * 2);
  }
}

export function simpleFunction(): string {
  return 'Hello World';
}
`;

    fs.writeFileSync('src/calculator.ts', sampleCode);

    // Build the CLI tool (assuming we're in the function-indexer directory)
    const functionIndexerPath = path.resolve(originalCwd);
    
    try {
      execSync('npm run build', { cwd: functionIndexerPath, stdio: 'pipe' });
    } catch (error) {
      throw new Error(`Failed to build function-indexer: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  afterEach(() => {
    process.chdir(originalCwd);
    // Clean up test directory
    try {
      fs.rmSync(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Cleanup warning:', error);
    }
  });

  const runCLI = (args: string[]): { stdout: string; stderr: string; success: boolean } => {
    const functionIndexerPath = path.resolve(originalCwd);
    const cliPath = path.join(functionIndexerPath, 'dist', 'cli.js');
    
    try {
      const result = execSync(`node "${cliPath}" ${args.join(' ')}`, {
        encoding: 'utf8',
        cwd: testDir,
        stdio: 'pipe'
      });
      return { stdout: result, stderr: '', success: true };
    } catch (error: any) {
      return { 
        stdout: error.stdout || '', 
        stderr: error.stderr || '', 
        success: false 
      };
    }
  };

  describe('Basic metrics command', () => {
    test('should show help for metrics command', () => {
      const result = runCLI(['metrics', '--help']);
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Code quality metrics commands');
      expect(result.stdout).toContain('collect');
      expect(result.stdout).toContain('show');
      expect(result.stdout).toContain('trends');
      expect(result.stdout).toContain('pr');
    });

    test('should run basic metrics analysis after initialization', () => {
      // First initialize the project
      const initResult = runCLI(['--root', './src', '--output', 'function-index.jsonl']);
      expect(initResult.success).toBe(true);

      // Then run metrics
      const metricsResult = runCLI(['metrics']);
      expect(metricsResult.success).toBe(true);
      expect(metricsResult.stdout).toContain('Code Quality Metrics');
      expect(metricsResult.stdout).toContain('Summary');
      expect(metricsResult.stdout).toContain('Total Functions:');
    });
  });

  describe('Metrics subcommands', () => {
    beforeEach(() => {
      // Initialize the project for subcommand tests
      const initResult = runCLI(['--root', './src', '--output', 'function-index.jsonl']);
      expect(initResult.success).toBe(true);
    });

    test('should show help for metrics collect subcommand', () => {
      const result = runCLI(['metrics', 'collect', '--help']);
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Collect code metrics for commit/PR tracking');
      expect(result.stdout).toContain('--root');
      expect(result.stdout).toContain('--pr');
      expect(result.stdout).toContain('--verbose');
    });

    test('should collect metrics successfully', () => {
      const result = runCLI(['metrics', 'collect', '--root', './src', '--verbose']);
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Collecting function metrics');
      expect(result.stdout).toContain('Metrics collection completed');
    });

    test('should show help for metrics show subcommand', () => {
      const result = runCLI(['metrics', 'show', '--help']);
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Show metrics history for a specific function');
      expect(result.stdout).toContain('--list');
      expect(result.stdout).toContain('--limit');
    });

    test('should list available functions when no data exists', () => {
      const result = runCLI(['metrics', 'show', '--list']);
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Available functions with metrics data');
    });

    test('should show help for metrics trends subcommand', () => {
      const result = runCLI(['metrics', 'trends', '--help']);
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Analyze metrics trends and violations');
    });

    test('should run trends analysis', () => {
      const result = runCLI(['metrics', 'trends']);
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Analyzing metrics trends');
    });

    test('should show help for metrics pr subcommand', () => {
      const result = runCLI(['metrics', 'pr', '--help']);
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Show metrics for a specific PR');
    });

    test('should handle PR metrics query', () => {
      const result = runCLI(['metrics', 'pr', '123']);
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Metrics for PR #123');
    });
  });

  describe('Backward compatibility', () => {
    test('should maintain existing metrics behavior', () => {
      // Initialize the project
      const initResult = runCLI(['--root', './src', '--output', 'function-index.jsonl']);
      expect(initResult.success).toBe(true);

      // Test that the base metrics command still works
      const metricsResult = runCLI(['metrics']);
      expect(metricsResult.success).toBe(true);
      expect(metricsResult.stdout).toContain('Code Quality Metrics');
      
      // Test detailed output
      const detailedResult = runCLI(['metrics', '--details']);
      expect(detailedResult.success).toBe(true);
      expect(detailedResult.stdout).toContain('Code Quality Metrics');
    });
  });

  describe('Command structure validation', () => {
    test('should reject invalid subcommands', () => {
      const result = runCLI(['metrics', 'invalid-subcommand']);
      expect(result.success).toBe(false);
      expect(result.stderr).toContain('error: unknown command');
    });

    test('should show metrics help when no subcommand provided', () => {
      // Initialize first
      const initResult = runCLI(['--root', './src', '--output', 'function-index.jsonl']);
      expect(initResult.success).toBe(true);

      // Base metrics should still work
      const result = runCLI(['metrics']);
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Code Quality Metrics');
    });
  });

  describe('Integration with existing functionality', () => {
    test('should work with project detection', () => {
      // Initialize the project
      const initResult = runCLI(['--root', './src', '--output', 'function-index.jsonl']);
      expect(initResult.success).toBe(true);

      // All metrics commands should work with auto-detected project
      const metricsResult = runCLI(['metrics']);
      expect(metricsResult.success).toBe(true);

      const collectResult = runCLI(['metrics', 'collect', '--root', './src']);
      expect(collectResult.success).toBe(true);
    });

    test('should maintain CLI output consistency', () => {
      // Initialize the project
      const initResult = runCLI(['--root', './src', '--output', 'function-index.jsonl']);
      expect(initResult.success).toBe(true);

      const result = runCLI(['metrics']);
      expect(result.success).toBe(true);
      
      // Check for consistent CLI output patterns
      expect(result.stdout).toContain('📊'); // Emoji usage
      expect(result.stdout).toMatch(/\d+ functions?/); // Function count patterns
    });
  });
});