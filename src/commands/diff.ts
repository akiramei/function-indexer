import { Command } from 'commander';
import { FunctionIndexer } from '../indexer';
import { GitService, DiffResult } from '../services/git';
import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import { FunctionInfo } from '../types';
import { ErrorHandler, ValidationError, GitError } from '../utils/error-handler';

interface DiffOptions {
  root: string;
  output?: string;
  format: 'terminal' | 'markdown' | 'json';
  thresholds?: string;
}

const DEFAULT_THRESHOLDS = {
  cyclomaticComplexity: 10,
  cognitiveComplexity: 15,
  linesOfCode: 40,
  nestingDepth: 3,
  parameterCount: 4
};

export function createDiffCommand(): Command {
  return new Command('diff')
    .description('Compare functions between Git branches or commits')
    .argument('[base]', 'Base branch or commit (default: main)', 'main')
    .argument('[target]', 'Target branch or commit (default: HEAD)', 'HEAD')
    .option('-r, --root <path>', 'Project root directory', process.cwd())
    .option('-o, --output <path>', 'Output file path')
    .option(
      '-f, --format <format>', 
      'Output format (terminal, markdown, json)', 
      (value: string) => {
        if (!['terminal', 'markdown', 'json'].includes(value)) {
          throw new Error(`Invalid format: ${value}. Valid options are: terminal, markdown, json`);
        }
        return value;
      },
      'terminal'
    )
    .option(
      '--thresholds <json>', 
      'Custom complexity thresholds as JSON',
      (value: string) => {
        try {
          const parsed = JSON.parse(value);
          // Validate that it's an object with expected properties
          const validKeys = ['cyclomaticComplexity', 'cognitiveComplexity', 'linesOfCode', 'nestingDepth', 'parameterCount'];
          const invalidKeys = Object.keys(parsed).filter(key => !validKeys.includes(key));
          if (invalidKeys.length > 0) {
            throw new Error(`Invalid threshold keys: ${invalidKeys.join(', ')}. Valid keys are: ${validKeys.join(', ')}`);
          }
          // Validate that all values are positive numbers
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
    )
    .hook('preAction', (thisCommand) => {
      const options = thisCommand.opts();
      
      // Validate root directory
      if (!options.root || typeof options.root !== 'string') {
        throw new Error('Root directory is required and must be a string');
      }
      
      // Validate output path if provided
      if (options.output && typeof options.output !== 'string') {
        throw new Error('Output path must be a string');
      }
    })
    .action(async (base: string, target: string, options: DiffOptions) => {
      await executeDiff(base, target, options);
    });
}

async function executeDiff(base: string, target: string, options: DiffOptions) {
  await ErrorHandler.withErrorHandling(async () => {
    // Validate inputs
    ErrorHandler.validateInput(base, 'base', (val) => typeof val === 'string' && val.length > 0);
    ErrorHandler.validateInput(target, 'target', (val) => typeof val === 'string' && val.length > 0);
    ErrorHandler.validateInput(options.format, 'format', (val) => ['terminal', 'markdown', 'json'].includes(val));
    
    await ErrorHandler.validatePath(options.root, 'directory');

    const gitService = new GitService(options.root);
    
    // Verify it's a git repository
    if (!await gitService.isGitRepository()) {
      throw new GitError('Not a git repository', 'git rev-parse --git-dir');
    }

    console.log(chalk.blue(`Comparing ${base}...${target}`));

    // Get the index directory
    const indexDir = path.join(options.root, '.function-indexer');
    const tempDir = path.join(indexDir, 'temp');
    
    try {
      await fs.mkdir(tempDir, { recursive: true });
    } catch (error) {
      throw ErrorHandler.createFileError('create directory', tempDir, error instanceof Error ? error : undefined);
    }

    // Generate indexes for both revisions
    const baseIndexPath = path.join(tempDir, `index-${base.replace(/\//g, '-')}.jsonl`);
    const targetIndexPath = path.join(tempDir, `index-${target.replace(/\//g, '-')}.jsonl`);

    // Create indexer instance
    const indexer = new FunctionIndexer({
      root: options.root,
      output: baseIndexPath,
      include: ['**/*.{ts,tsx}'],
      exclude: ['node_modules/**', '**/*.test.ts', '**/*.spec.ts'],
      verbose: false,
      domain: 'diff'
    });

    // Generate base index
    console.log(chalk.gray(`Generating index for ${base}...`));
    try {
      await generateIndexForRevision(gitService, indexer, base, baseIndexPath);
    } catch (error) {
      throw new GitError(`Failed to generate index for ${base}`, `indexing ${base}`);
    }

    // Generate target index
    console.log(chalk.gray(`Generating index for ${target}...`));
    try {
      await generateIndexForRevision(gitService, indexer, target, targetIndexPath);
    } catch (error) {
      throw new GitError(`Failed to generate index for ${target}`, `indexing ${target}`);
    }

    // Compare indexes
    console.log(chalk.gray('Comparing indexes...'));
    const diffResult = await gitService.compareIndexes(baseIndexPath, targetIndexPath);

    // Parse thresholds
    let thresholds;
    try {
      thresholds = options.thresholds 
        ? ErrorHandler.validateJSON(options.thresholds, 'thresholds')
        : DEFAULT_THRESHOLDS;
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new ValidationError('Invalid thresholds JSON format', 'thresholds');
    }

    // Format and output results
    const output = formatDiffResult(diffResult, thresholds, options.format);
    
    if (options.output) {
      try {
        await fs.writeFile(options.output, output);
        console.log(chalk.green(`Diff saved to ${options.output}`));
      } catch (error) {
        throw ErrorHandler.createFileError('write', options.output, error instanceof Error ? error : undefined);
      }
    } else if (options.format === 'terminal') {
      console.log(output);
    } else {
      console.log(output);
    }

    // Clean up temp files
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Non-critical error, just warn
      console.warn(chalk.yellow(`⚠️ Could not clean up temporary files: ${tempDir}`));
    }

    // Exit with error if there are violations
    const hasViolations = checkForViolations(diffResult, thresholds);
    if (hasViolations) {
      process.exit(1);
    }
  }, { command: 'diff', action: 'Generate diff comparison' });
}

async function generateIndexForRevision(
  gitService: GitService,
  indexer: FunctionIndexer,
  revision: string,
  outputPath: string
) {
  // For current revision (HEAD), use normal indexing
  if (revision === 'HEAD') {
    await indexer.run();
    return;
  }

  // For other revisions, we need to generate the index from that revision
  // This is a simplified approach - we'll just use the current working directory
  // In a production environment, we might use git worktree or sparse checkout
  console.warn(chalk.yellow(`Note: Diff functionality for historical revisions is limited in this version`));
  console.warn(chalk.yellow(`Only comparing current working directory state`));
  
  // For now, just run the indexer on current state
  await indexer.run();
}

function formatDiffResult(
  result: DiffResult,
  thresholds: typeof DEFAULT_THRESHOLDS,
  format: string
): string {
  switch (format) {
    case 'markdown':
      return formatMarkdown(result, thresholds);
    case 'json':
      return JSON.stringify(result, null, 2);
    case 'terminal':
    default:
      return formatTerminal(result, thresholds);
  }
}

function formatTerminal(result: DiffResult, thresholds: typeof DEFAULT_THRESHOLDS): string {
  const lines: string[] = [];
  
  lines.push(chalk.bold('\nFunction Changes Summary:'));
  lines.push(chalk.green(`  Added: ${result.added.length}`));
  lines.push(chalk.yellow(`  Modified: ${result.modified.length}`));
  lines.push(chalk.red(`  Removed: ${result.removed.length}`));
  lines.push('');

  if (result.added.length > 0) {
    lines.push(chalk.bold.green('\nAdded Functions:'));
    result.added.forEach(func => {
      const violations = checkMetricViolations(func.metrics, thresholds);
      const icon = violations.length > 0 ? '⚠️ ' : '✅ ';
      lines.push(`  ${icon}${func.file}:${func.startLine} - ${func.identifier}()`);
      if (violations.length > 0) {
        violations.forEach(v => lines.push(chalk.yellow(`     ${v}`)));
      }
    });
  }

  if (result.modified.length > 0) {
    lines.push(chalk.bold.yellow('\nModified Functions:'));
    result.modified.forEach(({ before, after, metricsChanges }) => {
      const violations = checkMetricViolations(after.metrics, thresholds);
      const icon = violations.length > 0 ? '⚠️ ' : '✅ ';
      lines.push(`  ${icon}${after.file}:${after.startLine} - ${after.identifier}()`);
      
      // Show metric changes
      Object.entries(metricsChanges).forEach(([metric, change]) => {
        const changeStr = typeof change.change === 'number' 
          ? (change.change > 0 ? `+${change.change}` : `${change.change}`)
          : change.change;
        
        const metricLine = `     ${metric}: ${change.before} → ${change.after} (${changeStr})`;
        
        // Highlight if threshold exceeded
        if (thresholds[metric as keyof typeof thresholds] && 
            typeof change.after === 'number' &&
            change.after > thresholds[metric as keyof typeof thresholds]) {
          lines.push(chalk.red(metricLine + ' ❌ Exceeded threshold'));
        } else {
          lines.push(chalk.gray(metricLine));
        }
      });
    });
  }

  if (result.removed.length > 0) {
    lines.push(chalk.bold.red('\nRemoved Functions:'));
    result.removed.forEach(func => {
      lines.push(`  ❌ ${func.file}:${func.startLine} - ${func.identifier}()`);
    });
  }

  return lines.join('\n');
}

function formatMarkdown(result: DiffResult, thresholds: typeof DEFAULT_THRESHOLDS): string {
  const lines: string[] = [];
  
  lines.push('## Function Changes Summary\n');
  lines.push(`- **Added**: ${result.added.length} functions`);
  lines.push(`- **Modified**: ${result.modified.length} functions`);
  lines.push(`- **Removed**: ${result.removed.length} functions`);
  lines.push('');

  if (result.added.length > 0) {
    lines.push('### Added Functions\n');
    result.added.forEach(func => {
      const violations = checkMetricViolations(func.metrics, thresholds);
      const icon = violations.length > 0 ? '⚠️' : '✅';
      lines.push(`- ${icon} \`${func.file}:${func.startLine}\` - \`${func.identifier}()\``);
      if (violations.length > 0) {
        violations.forEach(v => lines.push(`  - ${v}`));
      }
    });
    lines.push('');
  }

  if (result.modified.length > 0) {
    lines.push('### Modified Functions\n');
    result.modified.forEach(({ before, after, metricsChanges }) => {
      const violations = checkMetricViolations(after.metrics, thresholds);
      const icon = violations.length > 0 ? '⚠️' : '✅';
      lines.push(`- ${icon} \`${after.file}:${after.startLine}\` - \`${after.identifier}()\``);
      
      if (Object.keys(metricsChanges).length > 0) {
        lines.push('  - Changes:');
        Object.entries(metricsChanges).forEach(([metric, change]) => {
          const changeStr = typeof change.change === 'number' 
            ? (change.change > 0 ? `+${change.change}` : `${change.change}`)
            : change.change;
          lines.push(`    - ${metric}: ${change.before} → ${change.after} (${changeStr})`);
        });
      }
    });
    lines.push('');
  }

  if (result.removed.length > 0) {
    lines.push('### Removed Functions\n');
    result.removed.forEach(func => {
      lines.push(`- ❌ \`${func.file}:${func.startLine}\` - \`${func.identifier}()\``);
    });
  }

  return lines.join('\n');
}

function checkMetricViolations(
  metrics: FunctionInfo['metrics'],
  thresholds: typeof DEFAULT_THRESHOLDS
): string[] {
  const violations: string[] = [];
  
  Object.entries(thresholds).forEach(([metric, threshold]) => {
    const value = metrics[metric as keyof typeof metrics];
    if (typeof value === 'number' && value > threshold) {
      violations.push(`${metric}: ${value} (threshold: ${threshold})`);
    }
  });
  
  return violations;
}

function checkForViolations(
  result: DiffResult,
  thresholds: typeof DEFAULT_THRESHOLDS
): boolean {
  // Check added functions
  for (const func of result.added) {
    if (checkMetricViolations(func.metrics, thresholds).length > 0) {
      return true;
    }
  }
  
  // Check modified functions
  for (const { after } of result.modified) {
    if (checkMetricViolations(after.metrics, thresholds).length > 0) {
      return true;
    }
  }
  
  return false;
}