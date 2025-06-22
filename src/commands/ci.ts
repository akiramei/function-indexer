import { Command } from 'commander';
import { FunctionIndexer } from '../indexer';
import { GitService } from '../services/git';
import { MetricsService } from '../services/metrics-service';
import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import { handle as handleError, validateJSON, createFileError, withErrorHandling, ValidationError } from '../utils/error-handler';

interface CIOptions {
  root: string;
  base?: string;
  output?: string;
  format: 'terminal' | 'github' | 'gitlab' | 'json';
  thresholds?: string;
  failOnViolation: boolean;
  noFailOnViolation?: boolean;
  comment?: boolean;
  verbose?: boolean;
}

interface CIResult {
  success: boolean;
  summary: {
    totalFunctions: number;
    violations: number;
    added: number;
    modified: number;
    removed: number;
  };
  violations: Array<{
    file: string;
    line: number;
    identifier: string;
    issues: string[];
    severity: 'warning' | 'error';
  }>;
  comment?: string;
}

const DEFAULT_THRESHOLDS = {
  cyclomaticComplexity: 10,
  cognitiveComplexity: 15,
  linesOfCode: 40,
  nestingDepth: 3,
  parameterCount: 4
};

function validateFormat(value: string): string {
  if (!['terminal', 'github', 'gitlab', 'json'].includes(value)) {
    throw new Error(`Invalid format: ${value}. Valid options are: terminal, github, gitlab, json`);
  }
  return value;
}

function validateThresholds(value: string): string {
  try {
    const parsed = JSON.parse(value);
    const validKeys = ['cyclomaticComplexity', 'cognitiveComplexity', 'linesOfCode', 'nestingDepth', 'parameterCount'];
    const invalidKeys = Object.keys(parsed).filter(key => !validKeys.includes(key));
    if (invalidKeys.length > 0) {
      throw new Error(`Invalid threshold keys: ${invalidKeys.join(', ')}. Valid keys are: ${validKeys.join(', ')}`);
    }
    for (const [key, val] of Object.entries(parsed)) {
      if (typeof val !== 'number' || val <= 0) {
        throw new Error(`Threshold ${key} must be a positive number, got: ${val}`);
      }
    }
    return value;
  } catch (error) {
    throw new Error(`Invalid JSON in thresholds: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function validateOptions(options: any): void {
  if (!options.root || typeof options.root !== 'string') {
    throw new Error('Root directory is required and must be a string');
  }
  
  if (options.base && typeof options.base !== 'string') {
    throw new Error('Base branch must be a string');
  }
  
  if (options.output && typeof options.output !== 'string') {
    throw new Error('Output path must be a string');
  }
  
  if (options.failOnViolation === undefined) {
    options.failOnViolation = true;
  }
  
  if (typeof options.comment !== 'boolean') {
    throw new Error('--comment must be a boolean');
  }
  
  if (typeof options.verbose !== 'boolean') {
    throw new Error('--verbose must be a boolean');
  }
}

export function createCICommand(): Command {
  return new Command('ci')
    .description('Run function analysis for CI/CD pipelines')
    .option('-r, --root <path>', 'Project root directory', process.cwd())
    .option('-b, --base <branch>', 'Base branch for comparison')
    .option('-o, --output <path>', 'Output file for results')
    .option('-f, --format <format>', 'Output format (terminal, github, gitlab, json)', validateFormat, 'terminal')
    .option('--thresholds <json>', 'Custom complexity thresholds as JSON', validateThresholds)
    .option('--fail-on-violation', 'Exit with error code if violations found')
    .option('--no-fail-on-violation', 'Do not exit with error code if violations found')
    .option('--comment', 'Generate PR comment (for GitHub/GitLab)', false)
    .option('-v, --verbose', 'Enable verbose output', false)
    .hook('preAction', (thisCommand) => {
      validateOptions(thisCommand.opts());
    })
    .action(async (options: CIOptions) => {
      await executeCI(options);
    });
}

function parseOutputOption(options: CIOptions): void {
  if (options.output === undefined && process.argv.includes('--output')) {
    const outputIndex = process.argv.indexOf('--output');
    if (
      outputIndex !== -1 &&
      outputIndex + 1 < process.argv.length &&
      !process.argv[outputIndex + 1].startsWith('-')
    ) {
      options.output = process.argv[outputIndex + 1];
    }
  }
  if (options.output === undefined && process.argv.includes('-o')) {
    const outputIndex = process.argv.indexOf('-o');
    if (
      outputIndex !== -1 &&
      outputIndex + 1 < process.argv.length &&
      !process.argv[outputIndex + 1].startsWith('-')
    ) {
      options.output = process.argv[outputIndex + 1];
    }
  }
}

function parseThresholds(options: CIOptions): any {
  try {
    return options.thresholds 
      ? validateJSON(options.thresholds, 'thresholds')
      : DEFAULT_THRESHOLDS;
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new ValidationError('Invalid thresholds JSON format', 'thresholds');
  }
}

async function ensureIndexDirectory(): Promise<string> {
  const indexDir = '.function-indexer';
  const indexPath = path.join(indexDir, 'ci-index.jsonl');
  
  try {
    await fs.mkdir(indexDir, { recursive: true });
  } catch (error) {
    // Directory already exists, continue
  }
  
  return indexPath;
}

async function loadIndexedFunctions(indexPath: string): Promise<any[]> {
  let indexContent;
  try {
    const stats = await fs.stat(indexPath);
    if (stats.size === 0) {
      throw new Error('Index file is empty');
    }
    indexContent = await fs.readFile(indexPath, 'utf-8');
  } catch (error) {
    throw createFileError('read', indexPath, error instanceof Error ? error : undefined);
  }

  const functions: any[] = [];
  const lines = indexContent.split('\n').filter(line => line.trim());
  
  for (let i = 0; i < lines.length; i++) {
    try {
      functions.push(JSON.parse(lines[i]));
    } catch (error) {
      console.warn(chalk.yellow(`⚠️ Skipping malformed JSON at line ${i + 1}`));
    }
  }
  
  return functions;
}

function checkViolations(functions: any[], thresholds: any): CIResult['violations'] {
  const violations: CIResult['violations'] = [];
  
  functions.forEach(func => {
    const issues: string[] = [];
    const metrics = func.metrics || {};

    if (metrics.cyclomaticComplexity && metrics.cyclomaticComplexity > thresholds.cyclomaticComplexity) {
      issues.push(`Cyclomatic complexity: ${metrics.cyclomaticComplexity} (threshold: ${thresholds.cyclomaticComplexity})`);
    }
    if (metrics.cognitiveComplexity && metrics.cognitiveComplexity > thresholds.cognitiveComplexity) {
      issues.push(`Cognitive complexity: ${metrics.cognitiveComplexity} (threshold: ${thresholds.cognitiveComplexity})`);
    }
    if (metrics.linesOfCode && metrics.linesOfCode > thresholds.linesOfCode) {
      issues.push(`Lines of code: ${metrics.linesOfCode} (threshold: ${thresholds.linesOfCode})`);
    }
    if (metrics.nestingDepth && metrics.nestingDepth > thresholds.nestingDepth) {
      issues.push(`Nesting depth: ${metrics.nestingDepth} (threshold: ${thresholds.nestingDepth})`);
    }
    if (metrics.parameterCount && metrics.parameterCount > thresholds.parameterCount) {
      issues.push(`Parameter count: ${metrics.parameterCount} (threshold: ${thresholds.parameterCount})`);
    }

    if (issues.length > 0) {
      violations.push({
        file: func.file,
        line: func.startLine,
        identifier: func.identifier,
        issues,
        severity: issues.length >= 3 ? 'error' : 'warning'
      });
    }
  });
  
  return violations;
}

async function getDiffSummary(options: CIOptions): Promise<{added: number, modified: number, removed: number}> {
  let diffSummary = { added: 0, modified: 0, removed: 0 };
  
  if (options.base) {
    try {
      const gitService = new GitService(options.root);
      const changedFiles = await gitService.getChangedFiles(options.base);
      diffSummary.added = changedFiles.length;
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Could not get diff information'));
    }
  }
  
  return diffSummary;
}

async function collectPRMetrics(options: CIOptions): Promise<void> {
  const prNumber = process.env.GITHUB_PR_NUMBER || process.env.CI_MERGE_REQUEST_IID;
  
  if (prNumber) {
    try {
      const metricsService = new MetricsService();
      await metricsService.collectMetrics(options.root, {
        prNumber: parseInt(prNumber),
        verbose: false
      });
      metricsService.close();
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Could not collect metrics'));
    }
  }
}

async function outputResults(result: CIResult, options: CIOptions, thresholds: any): Promise<void> {
  if (options.comment) {
    result.comment = generatePRComment(result, thresholds);
  }

  const output = formatCIResult(result, options.format);
  
  if (options.output) {
    try {
      const fileContent = options.format !== 'json' ? JSON.stringify(result, null, 2) : output;
      await fs.writeFile(options.output, fileContent);
      console.log(chalk.green(`✅ Results saved to ${options.output}`));
      
      if (options.format !== 'terminal' && options.format !== 'json') {
        console.log(output);
      }
    } catch (error) {
      throw createFileError('write', options.output, error instanceof Error ? error : undefined);
    }
  } else if (options.format === 'terminal') {
    console.log(output);
  } else {
    console.log(output);
  }
}

function handleExitCode(result: CIResult, options: CIOptions): void {
  if (!result.success && options.failOnViolation) {
    console.error(chalk.red('\n❌ Quality gate failed!'));
    
    if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined) {
      throw new Error('Process exited with code 1');
    }
    
    process.exit(1);
  } else if (!result.success) {
    console.warn(chalk.yellow('\n⚠️  Quality issues detected'));
  } else {
    console.log(chalk.green('\n✅ Quality gate passed!'));
  }
}

async function executeCI(options: CIOptions) {
  await withErrorHandling(async () => {
    const startTime = Date.now();
    console.log(chalk.blue('🔄 Running CI analysis...'));

    parseOutputOption(options);

    const ciEnvironment = detectCIEnvironment();
    if (ciEnvironment) {
      console.log(chalk.gray(`Detected CI: ${ciEnvironment}`));
    }

    const thresholds = parseThresholds(options);
    const indexPath = await ensureIndexDirectory();

    const indexer = new FunctionIndexer({
      root: options.root,
      output: indexPath,
      domain: 'ci',
      verbose: options.verbose || false
    });

    console.log(chalk.gray('Indexing functions...'));
    await indexer.run();

    const functions = await loadIndexedFunctions(indexPath);
    const violations = checkViolations(functions, thresholds);
    const diffSummary = await getDiffSummary(options);
    await collectPRMetrics(options);

    const result: CIResult = {
      success: violations.filter(v => v.severity === 'error').length === 0,
      summary: {
        totalFunctions: functions.length,
        violations: violations.length,
        added: diffSummary.added,
        modified: diffSummary.modified,
        removed: diffSummary.removed
      },
      violations
    };

    await outputResults(result, options, thresholds);

    const executionTime = Date.now() - startTime;
    console.log(chalk.gray(`\nExecution time: ${executionTime}ms`));

    handleExitCode(result, options);
  }, { command: 'ci', action: 'Run CI analysis' });
}

function detectCIEnvironment(): string | null {
  if (process.env.GITHUB_ACTIONS) return 'GitHub Actions';
  if (process.env.GITLAB_CI) return 'GitLab CI';
  if (process.env.CIRCLECI) return 'CircleCI';
  if (process.env.JENKINS_URL) return 'Jenkins';
  if (process.env.CI) return 'Generic CI';
  return null;
}

function formatCIResult(result: CIResult, format: string): string {
  switch (format) {
    case 'github':
      return formatGitHubAnnotations(result);
    case 'gitlab':
      return formatGitLabReport(result);
    case 'json':
      return JSON.stringify(result, null, 2);
    case 'terminal':
    default:
      return formatTerminalOutput(result);
  }
}

function formatTerminalOutput(result: CIResult): string {
  const lines: string[] = [];
  
  lines.push(chalk.bold('\n📊 CI Analysis Results'));
  lines.push(chalk.gray(`Total Functions: ${result.summary.totalFunctions}`));
  lines.push(chalk.gray(`Violations: ${result.summary.violations}`));
  
  if (result.summary.added > 0 || result.summary.modified > 0) {
    lines.push(chalk.gray(`Changes: +${result.summary.added} ~${result.summary.modified} -${result.summary.removed}`));
  }

  if (result.violations.length > 0) {
    lines.push('\n' + chalk.yellow('⚠️  Violations:'));
    
    result.violations.forEach(violation => {
      const icon = violation.severity === 'error' ? '❌' : '⚠️';
      lines.push(`\n${icon} ${chalk.cyan(violation.identifier)} at ${violation.file}:${violation.line}`);
      violation.issues.forEach(issue => {
        lines.push(chalk.gray(`   • ${issue}`));
      });
    });
  } else {
    lines.push('\n' + chalk.green('✅ No violations found!'));
  }

  return lines.join('\n');
}

function formatGitHubAnnotations(result: CIResult): string {
  const annotations: string[] = [];
  
  result.violations.forEach(violation => {
    const level = violation.severity === 'error' ? 'error' : 'warning';
    const message = violation.issues.join(', ');
    annotations.push(
      `::${level} file=${violation.file},line=${violation.line}::${violation.identifier}: ${message}`
    );
  });
  
  return annotations.join('\n');
}

function formatGitLabReport(result: CIResult): string {
  // GitLab Code Quality report format
  const report = result.violations.map(violation => ({
    description: `${violation.identifier}: ${violation.issues.join(', ')}`,
    fingerprint: `${violation.file}:${violation.line}:${violation.identifier}`,
    severity: violation.severity === 'error' ? 'major' : 'minor',
    location: {
      path: violation.file,
      lines: {
        begin: violation.line
      }
    }
  }));
  
  return JSON.stringify(report, null, 2);
}

function generatePRComment(result: CIResult, thresholds: typeof DEFAULT_THRESHOLDS): string {
  const emoji = result.success ? '✅' : '❌';
  const status = result.success ? 'passed' : 'failed';
  
  let comment = `## ${emoji} Function Indexer Quality Gate ${status}\n\n`;
  
  comment += `### 📊 Summary\n`;
  comment += `- **Total Functions**: ${result.summary.totalFunctions}\n`;
  comment += `- **Violations**: ${result.summary.violations}\n`;
  
  if (result.summary.added > 0 || result.summary.modified > 0) {
    comment += `- **Changes**: +${result.summary.added} ~${result.summary.modified} -${result.summary.removed}\n`;
  }
  
  comment += `\n### ⚙️ Thresholds\n`;
  comment += `| Metric | Threshold |\n`;
  comment += `|--------|----------|\n`;
  Object.entries(thresholds).forEach(([metric, value]) => {
    comment += `| ${metric} | ${value} |\n`;
  });
  
  if (result.violations.length > 0) {
    comment += `\n### ⚠️ Violations\n`;
    
    const errors = result.violations.filter(v => v.severity === 'error');
    const warnings = result.violations.filter(v => v.severity === 'warning');
    
    if (errors.length > 0) {
      comment += `\n#### ❌ Errors (${errors.length})\n`;
      errors.slice(0, 5).forEach(violation => {
        comment += `- \`${violation.file}:${violation.line}\` - **${violation.identifier}**\n`;
        violation.issues.forEach(issue => {
          comment += `  - ${issue}\n`;
        });
      });
      if (errors.length > 5) {
        comment += `\n_...and ${errors.length - 5} more errors_\n`;
      }
    }
    
    if (warnings.length > 0) {
      comment += `\n#### ⚠️ Warnings (${warnings.length})\n`;
      warnings.slice(0, 3).forEach(violation => {
        comment += `- \`${violation.file}:${violation.line}\` - **${violation.identifier}**\n`;
        violation.issues.forEach(issue => {
          comment += `  - ${issue}\n`;
        });
      });
      if (warnings.length > 3) {
        comment += `\n_...and ${warnings.length - 3} more warnings_\n`;
      }
    }
  }
  
  comment += `\n---\n`;
  comment += `*Generated by [function-indexer](https://github.com/akiramei/function-indexer)*`;
  
  return comment;
}