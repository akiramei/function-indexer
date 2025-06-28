import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { MetricsService } from '../services/metrics-service';
import { ConfigService, FunctionIndexerConfig } from '../services/config-service';
import { MetricsConfigService } from '../services/metrics-config-service';
import { ProjectDetector } from '../utils/project-detector';
import { FunctionInfo, FunctionMetricsHistory } from '../types';

interface MetricsViolation {
  func: FunctionInfo;
  issues: string[];
}

interface ComplexityDistribution {
  low: number;
  medium: number;
  high: number;
}

interface MetricsOptions {
  details?: boolean;
  pr?: string;
  root?: string;
  output?: string;
  commit?: string;
  branch?: string;
  verbose?: boolean;
  limit?: string;
  list?: boolean;
}

/**
 * Initialize and validate project for metrics
 */
function initializeMetricsProject(): { config: FunctionIndexerConfig } {
  const projectInfo = (() => {
    try {
      return ProjectDetector.detectProject();
    } catch (error) {
      console.error(chalk.red('❌ Failed to detect project structure'));
      throw new Error('Project detection failed. Please ensure you are in a valid project directory.');
    }
  })();
  
  if (!ConfigService.isInitialized(projectInfo.root)) {
    console.error(chalk.red('❌ Project not initialized'));
    console.log(chalk.yellow('💡 Run `fx` or `function-indexer` first to initialize the project'));
    process.exit(1);
  }
  
  const config = ConfigService.loadConfig(projectInfo.root);
  
  if (!fs.existsSync(config.output)) {
    console.error(chalk.red('❌ Index file not found'));
    console.log(chalk.yellow('💡 Run `fx` to create the index'));
    process.exit(1);
  }
  
  return { config };
}

/**
 * Load functions from index file for metrics analysis
 */
function loadFunctionsForMetrics(indexPath: string): FunctionInfo[] {
  const indexContent = fs.readFileSync(indexPath, 'utf-8');
  const functions: FunctionInfo[] = [];
  
  for (const line of indexContent.trim().split('\n').filter(line => line)) {
    try {
      functions.push(JSON.parse(line));
    } catch (error) {
      console.warn(chalk.yellow(`⚠️  Skipping malformed JSON line`));
    }
  }
  
  return functions;
}

/**
 * Calculate metrics violations for functions
 */
function calculateViolations(functions: FunctionInfo[], thresholds: Record<string, number>): MetricsViolation[] {
  const violations: MetricsViolation[] = [];
  
  functions.forEach(func => {
    const metrics = func.metrics || {};
    const issues: string[] = [];
    
    // Check violations
    const metricChecks = [
      { key: 'cyclomaticComplexity', label: 'Cyclomatic complexity' },
      { key: 'cognitiveComplexity', label: 'Cognitive complexity' },
      { key: 'linesOfCode', label: 'Lines of code' },
      { key: 'nestingDepth', label: 'Nesting depth' },
      { key: 'parameterCount', label: 'Parameter count' }
    ] as const;
    
    for (const { key, label } of metricChecks) {
      const metricValue = metrics[key];
      const threshold = thresholds[key];
      if (metricValue !== undefined && metricValue > threshold) {
        issues.push(`${label}: ${metricValue} (>${threshold})`);
      }
    }
    
    if (issues.length > 0) {
      violations.push({ func, issues });
    }
  });
  
  return violations;
}

/**
 * Calculate complexity distribution
 */
function calculateComplexityDistribution(functions: FunctionInfo[], violations: MetricsViolation[]): ComplexityDistribution {
  const distribution: ComplexityDistribution = { low: 0, medium: 0, high: 0 };
  
  functions.forEach(func => {
    const violation = violations.find(v => v.func === func);
    const issueCount = violation ? violation.issues.length : 0;
    
    if (issueCount >= 3) {
      distribution.high++;
    } else if (issueCount >= 1) {
      distribution.medium++;
    } else {
      distribution.low++;
    }
  });
  
  return distribution;
}

/**
 * Display metrics summary
 */
function displayMetricsSummary(
  functions: FunctionInfo[], 
  complexityDistribution: ComplexityDistribution, 
  violations: MetricsViolation[],
  options: MetricsOptions
): void {
  const totalFunctions = functions.length;
  
  console.log(chalk.cyan('📈 Summary'));
  console.log(chalk.gray(`   Total Functions: ${totalFunctions}`));
  
  // Prevent division by zero
  if (totalFunctions === 0) {
    console.log(chalk.gray('   No functions found to analyze'));
    return;
  }
  
  console.log(chalk.green(`   🟢 Low Risk: ${complexityDistribution.low} (${Math.round(complexityDistribution.low / totalFunctions * 100)}%)`));
  console.log(chalk.yellow(`   🟡 Medium Risk: ${complexityDistribution.medium} (${Math.round(complexityDistribution.medium / totalFunctions * 100)}%)`));
  console.log(chalk.red(`   🔴 High Risk: ${complexityDistribution.high} (${Math.round(complexityDistribution.high / totalFunctions * 100)}%)`));

  if (violations.length > 0) {
    console.log('\n' + chalk.yellow('⚠️  Functions exceeding thresholds:'));
    
    // Sort by number of violations
    violations.sort((a, b) => b.issues.length - a.issues.length);
    
    const showCount = options.details ? violations.length : Math.min(5, violations.length);
    
    violations.slice(0, showCount).forEach((violation, index) => {
      const riskIcon = violation.issues.length >= 3 ? '🔴' : '🟡';
      console.log(`\n${riskIcon} ${index + 1}. ${chalk.cyan(violation.func.identifier)}`);
      console.log(chalk.gray(`   ${violation.func.file}:${violation.func.startLine}`));
      violation.issues.forEach(issue => {
        console.log(chalk.gray(`   • ${issue}`));
      });
    });
    
    if (!options.details && violations.length > showCount) {
      console.log(chalk.gray(`\n   ... and ${violations.length - showCount} more functions`));
      console.log(chalk.gray('   Use --details to see all functions'));
    }
  } else {
    console.log('\n' + chalk.green('✅ All functions are within quality thresholds!'));
  }

  // Suggestions
  if (violations.length > 0) {
    console.log('\n' + chalk.blue('💡 Suggestions:'));
    console.log(chalk.gray('   • Consider breaking down complex functions'));
    console.log(chalk.gray('   • Reduce nesting levels with early returns'));
    console.log(chalk.gray('   • Extract helper functions for readability'));
    console.log(chalk.gray('   • Use `fx s` to find similar patterns'));
  }
}

/**
 * Display available functions with metrics data
 */
function displayAvailableFunctions(metricsService: MetricsService): void {
  console.log(chalk.blue('📊 Available functions with metrics data:\n'));
  
  const availableFunctions = metricsService.listAvailableFunctions();
  
  if (availableFunctions.length === 0) {
    console.log(chalk.yellow('No metrics data found'));
    console.log(chalk.gray('💡 Run `fx metrics collect` or `fx cm` to collect data'));
  } else {
    console.log(chalk.green(`Found ${availableFunctions.length} functions with metrics:\n`));
    
    availableFunctions.forEach((func: { functionId: string; recordCount: number; lastTimestamp: string; latestComplexity: number }, index: number) => {
      console.log(chalk.cyan(`${index + 1}. ${func.functionId}`));
      console.log(chalk.gray(`   Last updated: ${new Date(func.lastTimestamp).toLocaleString()}`));
      console.log(chalk.gray(`   Records: ${func.recordCount} | Latest complexity: ${func.latestComplexity}`));
      console.log();
    });
    
    console.log(chalk.blue('💡 Usage:'));
    console.log(chalk.gray('   fx metrics show "src/file.ts:functionName"'));
    console.log(chalk.gray('   fx sm "src/file.ts:functionName"'));
  }
}

/**
 * Display metrics history for a specific function
 */
function displayFunctionHistory(metricsService: MetricsService, functionId: string, limit: number): void {
  console.log(chalk.blue(`📈 Metrics history for: ${functionId}`));
  
  const history = metricsService.showFunctionMetrics(functionId, limit);
  
  if (history.length === 0) {
    console.log(chalk.yellow('No metrics history found for this function'));
    console.log(chalk.gray('💡 Make sure the function ID is correct'));
    console.log(chalk.gray('💡 Run `fx metrics show --list` to see available functions'));
  } else {
    console.log(chalk.green(`Found ${history.length} metric entries:\n`));
    
    history.forEach((metric: FunctionMetricsHistory, index: number) => {
      const date = new Date(metric.timestamp).toLocaleString();
      console.log(chalk.cyan(`${index + 1}. ${date} (${metric.commitHash.substring(0, 8)})`));
      console.log(chalk.gray(`   Branch: ${metric.branchName} | Change: ${metric.changeType}`));
      if (metric.prNumber) console.log(chalk.gray(`   PR: #${metric.prNumber}`));
      console.log(chalk.gray(`   Cyclomatic: ${metric.cyclomaticComplexity} | Cognitive: ${metric.cognitiveComplexity}`));
      console.log(chalk.gray(`   LOC: ${metric.linesOfCode} | Nesting: ${metric.nestingDepth} | Params: ${metric.parameterCount}`));
      console.log();
    });
  }
}

/**
 * Validate and parse limit parameter
 */
function validateLimit(limit: string | undefined): number {
  const defaultLimit = 10;
  
  if (!limit) {
    return defaultLimit;
  }
  
  const parsedLimit = parseInt(limit);
  if (isNaN(parsedLimit) || parsedLimit <= 0) {
    console.error(chalk.red(`❌ Invalid limit value: ${limit}`));
    console.log(chalk.gray('💡 Limit must be a positive integer'));
    process.exit(1);
  }
  
  return parsedLimit;
}

/**
 * Create the unified metrics command with subcommands
 */
export function createMetricsCommand(): Command {
  const metricsCmd = new Command('metrics')
    .description('Code quality metrics commands')
    .action(async (options) => {
      // Default action: show metrics overview
      await showMetricsOverview(options);
    });

  // Add subcommands
  metricsCmd
    .command('collect')
    .description('Collect code metrics for commit/PR tracking')
    .option('-r, --root <path>', 'root directory to scan', './src')
    .option('--output <file>', 'output JSONL file for metrics history')
    .option('--pr <number>', 'PR number for this metrics collection')
    .option('--commit <hash>', 'specific commit hash (defaults to current HEAD)')
    .option('--branch <name>', 'branch name (defaults to current branch)')
    .option('-v, --verbose', 'verbose output')
    .action(collectMetrics);

  metricsCmd
    .command('show [functionId]')
    .description('Show metrics history for a specific function')
    .option('-l, --limit <number>', 'limit number of history entries', '10')
    .option('--list', 'list all functions with metrics data')
    .action(showFunctionMetrics);

  metricsCmd
    .command('trends')
    .description('Analyze metrics trends and violations')
    .action(analyzeTrends);

  metricsCmd
    .command('pr <prNumber>')
    .description('Show metrics for a specific PR')
    .action(showPRMetrics);

  return metricsCmd;
}

/**
 * Show metrics overview (default action)
 */
async function showMetricsOverview(options: MetricsOptions): Promise<void> {
  try {
    const { config } = initializeMetricsProject();

    console.log(chalk.blue('📊 Code Quality Metrics\n'));

    const functions = loadFunctionsForMetrics(config.output);

    // Load thresholds from metrics configuration
    const metricsConfig = MetricsConfigService.loadConfig();
    const thresholds = metricsConfig.thresholds;

    const violations = calculateViolations(functions, thresholds);
    const complexityDistribution = calculateComplexityDistribution(functions, violations);
    
    displayMetricsSummary(functions, complexityDistribution, violations, options);

  } catch (error) {
    console.error(chalk.red('❌ Metrics error:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

/**
 * Collect metrics implementation
 */
async function collectMetrics(options: MetricsOptions): Promise<void> {
  let metricsService: MetricsService | null = null;
  
  try {
    console.log(chalk.blue('📊 Collecting function metrics...'));
    
    const rootPath = path.resolve(options.root || './src');
    if (!fs.existsSync(rootPath)) {
      console.error(chalk.red(`❌ Root directory does not exist: ${rootPath}`));
      process.exit(1);
    }

    metricsService = new MetricsService(undefined, rootPath);
    
    // Validate PR number if provided
    let prNumber: number | undefined;
    if (options.pr) {
      prNumber = parseInt(options.pr);
      if (isNaN(prNumber) || prNumber <= 0) {
        console.error(chalk.red(`❌ Invalid PR number: ${options.pr}`));
        console.log(chalk.gray('💡 PR number must be a positive integer'));
        process.exit(1);
      }
    }
    
    try {
      await metricsService.collectMetrics(rootPath, {
      prNumber,
      commitHash: options.commit,
      branchName: options.branch,
      verbose: options.verbose,
      outputFile: options.output
      });

      console.log(chalk.green('✅ Metrics collection completed!'));
      
      if (options.output) {
        console.log(chalk.cyan(`📄 Metrics history saved to: ${options.output}`));
      } else {
        console.log(chalk.cyan('📄 Metrics stored in SQLite database'));
      }
    } catch (metricsError) {
      console.error(chalk.red('❌ Metrics collection failed:'), metricsError instanceof Error ? metricsError.message : String(metricsError));
      throw metricsError;
    } finally {
      if (metricsService) {
        metricsService.close();
      }
    }
  } catch (error) {
    console.error(chalk.red('❌ Metrics collection error:'), error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Show function metrics implementation
 */
async function showFunctionMetrics(functionId: string | undefined, options: MetricsOptions): Promise<void> {
  try {
    const { config } = initializeMetricsProject();
    const metricsService = new MetricsService(undefined, config.root);
    
    if (!functionId || options.list) {
      displayAvailableFunctions(metricsService);
    } else if (functionId) {
      const limit = validateLimit(options.limit);
      displayFunctionHistory(metricsService, functionId, limit);
    } else {
      console.log(chalk.yellow('No function ID provided'));
      console.log(chalk.gray('💡 Use --list to see available functions or provide a function ID'));
    }
    
    metricsService.close();
  } catch (error) {
    console.error(chalk.red('❌ Show metrics error:'), error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Analyze trends implementation
 */
async function analyzeTrends(): Promise<void> {
  try {
    console.log(chalk.blue('📊 Analyzing metrics trends...'));
    
    const { config } = initializeMetricsProject();
    const metricsService = new MetricsService(undefined, config.root);
    const analysis = metricsService.analyzeTrends();
    
    if (analysis.length === 0) {
      console.log(chalk.yellow('No metrics data found for analysis'));
    } else {
      console.log(chalk.green(`Analysis results for ${analysis.length} functions:\n`));
      
      const highRisk = analysis.filter(a => a.riskLevel === 'high');
      const mediumRisk = analysis.filter(a => a.riskLevel === 'medium');
      const lowRisk = analysis.filter(a => a.riskLevel === 'low');
      
      console.log(chalk.red(`🔴 High Risk: ${highRisk.length} functions`));
      console.log(chalk.yellow(`🟡 Medium Risk: ${mediumRisk.length} functions`));
      console.log(chalk.green(`🟢 Low Risk: ${lowRisk.length} functions\n`));
      
      // Show high risk functions
      if (highRisk.length > 0) {
        console.log(chalk.red('🔴 High Risk Functions:'));
        highRisk.forEach(func => {
          console.log(chalk.red(`  ❌ ${func.functionId} (${func.trend})`));
          func.violations.forEach(v => {
            console.log(chalk.gray(`     ${v.metric}: ${v.value} (threshold: ${v.threshold})`));
          });
        });
        console.log();
      }
      
      // Show medium risk functions (limited)
      if (mediumRisk.length > 0) {
        console.log(chalk.yellow('🟡 Medium Risk Functions (showing first 5):'));
        mediumRisk.slice(0, 5).forEach(func => {
          console.log(chalk.yellow(`  ⚠️  ${func.functionId} (${func.trend})`));
          func.violations.forEach(v => {
            console.log(chalk.gray(`     ${v.metric}: ${v.value} (threshold: ${v.threshold})`));
          });
        });
        if (mediumRisk.length > 5) {
          console.log(chalk.gray(`  ... and ${mediumRisk.length - 5} more`));
        }
      }
    }
    
    metricsService.close();
  } catch (error) {
    console.error(chalk.red('❌ Trend analysis error:'), error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Show PR metrics implementation
 */
async function showPRMetrics(prNumber: string): Promise<void> {
  try {
    const prNum = parseInt(prNumber);
    if (isNaN(prNum) || prNum <= 0) {
      console.error(chalk.red(`❌ Invalid PR number: ${prNumber}`));
      console.log(chalk.gray('💡 PR number must be a positive integer'));
      process.exit(1);
    }
    
    console.log(chalk.blue(`📊 Metrics for PR #${prNumber}`));
    
    const { config } = initializeMetricsProject();
    const metricsService = new MetricsService(undefined, config.root);
    const prMetrics = metricsService.getPRMetrics(prNum);
    
    if (prMetrics.length === 0) {
      console.log(chalk.yellow(`No metrics found for PR #${prNumber}`));
    } else {
      console.log(chalk.green(`Found metrics for ${prMetrics.length} functions:\n`));
      
      prMetrics.forEach((metric, index) => {
        console.log(chalk.cyan(`${index + 1}. ${metric.functionId}`));
        console.log(chalk.gray(`   Change: ${metric.changeType} | Commit: ${metric.commitHash.substring(0, 8)}`));
        console.log(chalk.gray(`   Cyclomatic: ${metric.cyclomaticComplexity} | Cognitive: ${metric.cognitiveComplexity}`));
        console.log(chalk.gray(`   LOC: ${metric.linesOfCode} | Nesting: ${metric.nestingDepth} | Params: ${metric.parameterCount}`));
        console.log();
      });
    }
    
    metricsService.close();
  } catch (error) {
    console.error(chalk.red('❌ PR metrics error:'), error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}