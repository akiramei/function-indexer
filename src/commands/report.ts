import { Command } from 'commander';
import { FunctionInfo } from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import Handlebars from 'handlebars';
import { ConfigService } from '../services/config-service';
import { ProjectDetector } from '../utils/project-detector';
import { handle as handleError, validateInput, validatePath, validateJSON, createFileError, withErrorHandling, ValidationError, ConfigurationError, IndexError } from '../utils/error-handler';

interface ReportOptions {
  template?: string;
  output?: string;
  format: 'markdown' | 'html' | 'json';
  thresholds?: string;
}

interface ReportData {
  generatedAt: string;
  summary: {
    totalFunctions: number;
    highComplexity: number;
    missingTypes: number;
    avgComplexity: number;
  };
  distribution: {
    low: number;
    lowPercent: number;
    medium: number;
    mediumPercent: number;
    high: number;
    highPercent: number;
  };
  violations: Array<{
    identifier: string;
    file: string;
    startLine: number;
    issues: string[];
  }>;
  fileMetrics: Array<{
    file: string;
    functionCount: number;
    avgComplexity: number;
    maxComplexity: number;
  }>;
  recommendations: string[];
}

const DEFAULT_THRESHOLDS = {
  cyclomaticComplexity: 10,
  cognitiveComplexity: 15,
  linesOfCode: 40,
  nestingDepth: 3,
  parameterCount: 4
};

export function createReportCommand(): Command {
  return new Command('report')
    .description('Generate comprehensive code quality reports')
    .option('-t, --template <path>', 'Custom Handlebars template path')
    .option('-o, --output <path>', 'Output file path (default: stdout)')
    .option(
      '-f, --format <format>', 
      'Output format (markdown, html, json)', 
      validateFormat,
      'markdown'
    )
    .option(
      '--thresholds <json>', 
      'Custom complexity thresholds as JSON',
      validateThresholdsJSON
    )
    .hook('preAction', validateCommandOptions)
    .action(async (options: ReportOptions) => {
      await executeReport(options);
    });
}

function validateFormat(value: string): string {
  const validFormats = ['markdown', 'html', 'json'];
  if (!validFormats.includes(value)) {
    throw new Error(`Invalid format: ${value}. Valid options are: ${validFormats.join(', ')}`);
  }
  return value;
}

function validateThresholdsJSON(value: string): string {
  try {
    const parsed = JSON.parse(value);
    validateThresholdKeys(parsed);
    validateThresholdValues(parsed);
    return value;
  } catch (error) {
    throw new Error(`Invalid JSON in thresholds: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function validateThresholdKeys(parsed: any): void {
  const validKeys = ['cyclomaticComplexity', 'cognitiveComplexity', 'linesOfCode', 'nestingDepth', 'parameterCount'];
  const invalidKeys = Object.keys(parsed).filter(key => !validKeys.includes(key));
  if (invalidKeys.length > 0) {
    throw new Error(`Invalid threshold keys: ${invalidKeys.join(', ')}. Valid keys are: ${validKeys.join(', ')}`);
  }
}

function validateThresholdValues(parsed: any): void {
  for (const [key, val] of Object.entries(parsed)) {
    if (typeof val !== 'number' || val <= 0) {
      throw new Error(`Threshold ${key} must be a positive number, got: ${val}`);
    }
  }
}

function validateCommandOptions(thisCommand: Command): void {
  const options = thisCommand.opts();
  
  if (options.template && typeof options.template !== 'string') {
    throw new Error('Template path must be a string');
  }
  
  if (options.output && typeof options.output !== 'string') {
    throw new Error('Output path must be a string');
  }
}

async function executeReport(options: ReportOptions) {
  await withErrorHandling(async () => {
    // Validate and prepare
    await validateReportOptions(options);
    const { config, projectInfo } = await loadProjectConfig();
    
    console.log(chalk.blue('📊 Generating report...'));

    // Load and process data
    const functions = await loadFunctionIndex(config.output);
    const thresholds = parseThresholds(options.thresholds);

    // Generate report data
    const reportData = generateReportData(functions, thresholds);

    // Generate and output report
    const output = await generateReportOutput(reportData, options);
    await outputReport(output, options);
  }, { command: 'report', action: 'Generate report' });
}

function generateReportData(functions: FunctionInfo[], thresholds: typeof DEFAULT_THRESHOLDS): ReportData {
  const analysis = analyzeFunctions(functions, thresholds);
  const fileMetrics = generateFileMetrics(analysis.fileMetricsMap);

  return {
    generatedAt: new Date().toLocaleString(),
    summary: {
      totalFunctions: functions.length,
      highComplexity: analysis.highComplexity,
      missingTypes: analysis.missingTypes,
      avgComplexity: Math.round(analysis.totalComplexity / functions.length * 100) / 100
    },
    distribution: {
      low: analysis.distribution.low,
      lowPercent: Math.round((analysis.distribution.low / functions.length) * 100),
      medium: analysis.distribution.medium,
      mediumPercent: Math.round((analysis.distribution.medium / functions.length) * 100),
      high: analysis.distribution.high,
      highPercent: Math.round((analysis.distribution.high / functions.length) * 100)
    },
    violations: analysis.violations.slice(0, 20), // Top 20 violations
    fileMetrics,
    recommendations: generateRecommendations(analysis.distribution, analysis.missingTypes, functions.length, fileMetrics)
  };
}

function analyzeFunctions(functions: FunctionInfo[], thresholds: typeof DEFAULT_THRESHOLDS) {
  let highComplexity = 0;
  let missingTypes = 0;
  let totalComplexity = 0;
  
  const distribution = { low: 0, medium: 0, high: 0 };
  const violations: ReportData['violations'] = [];
  const fileMetricsMap = new Map<string, { count: number; totalComplexity: number; maxComplexity: number }>();

  functions.forEach(func => {
    const metrics = func.metrics || {};
    const complexity = metrics.cyclomaticComplexity || 0;
    
    totalComplexity += complexity;
    
    if (!metrics.hasReturnType) {
      missingTypes++;
    }
    
    const issues = checkFunctionViolations(metrics, thresholds);
    
    // Categorize by risk
    if (issues.length >= 3) {
      distribution.high++;
      highComplexity++;
    } else if (issues.length >= 1) {
      distribution.medium++;
    } else {
      distribution.low++;
    }
    
    if (issues.length > 0) {
      violations.push({
        identifier: func.identifier,
        file: func.file,
        startLine: func.startLine,
        issues
      });
    }
    
    updateFileMetrics(fileMetricsMap, func.file, complexity);
  });

  violations.sort((a, b) => b.issues.length - a.issues.length);
  
  return {
    highComplexity,
    missingTypes,
    totalComplexity,
    distribution,
    violations,
    fileMetricsMap
  };
}

function checkFunctionViolations(metrics: any, thresholds: typeof DEFAULT_THRESHOLDS): string[] {
  const issues: string[] = [];
  const checks = [
    { key: 'cyclomaticComplexity', label: 'Cyclomatic complexity' },
    { key: 'cognitiveComplexity', label: 'Cognitive complexity' },
    { key: 'linesOfCode', label: 'Lines of code' },
    { key: 'nestingDepth', label: 'Nesting depth' },
    { key: 'parameterCount', label: 'Parameter count' }
  ];
  
  checks.forEach(({ key, label }) => {
    if (metrics[key] && metrics[key] > thresholds[key as keyof typeof thresholds]) {
      issues.push(`${label}: ${metrics[key]} (>${thresholds[key as keyof typeof thresholds]})`);
    }
  });
  
  return issues;
}

function updateFileMetrics(
  fileMetricsMap: Map<string, { count: number; totalComplexity: number; maxComplexity: number }>,
  file: string,
  complexity: number
): void {
  const fileData = fileMetricsMap.get(file) || { count: 0, totalComplexity: 0, maxComplexity: 0 };
  fileData.count++;
  fileData.totalComplexity += complexity;
  fileData.maxComplexity = Math.max(fileData.maxComplexity, complexity);
  fileMetricsMap.set(file, fileData);
}

function generateFileMetrics(fileMetricsMap: Map<string, { count: number; totalComplexity: number; maxComplexity: number }>) {
  return Array.from(fileMetricsMap.entries())
    .map(([file, data]) => ({
      file,
      functionCount: data.count,
      avgComplexity: Math.round(data.totalComplexity / data.count * 10) / 10,
      maxComplexity: data.maxComplexity
    }))
    .sort((a, b) => b.maxComplexity - a.maxComplexity)
    .slice(0, 10); // Top 10 files
}

function generateRecommendations(
  distribution: { low: number; medium: number; high: number },
  missingTypes: number,
  totalFunctions: number,
  fileMetrics: any[]
): string[] {
  const recommendations: string[] = [];
  
  if (distribution.high > 0) {
    recommendations.push(`Refactor ${distribution.high} high-complexity functions to improve maintainability`);
  }
  if (missingTypes > totalFunctions * 0.2) {
    recommendations.push(`Add return type annotations to ${missingTypes} functions for better type safety`);
  }
  if (distribution.medium > totalFunctions * 0.3) {
    recommendations.push('Consider breaking down medium-complexity functions into smaller, more focused units');
  }
  if (fileMetrics.some(f => f.avgComplexity > 8)) {
    recommendations.push('Some files have high average complexity - consider splitting into multiple modules');
  }
  
  return recommendations;
}

async function generateMarkdownReport(data: ReportData, templatePath?: string): Promise<string> {
  let template: string;
  
  if (templatePath) {
    template = await fs.readFile(templatePath, 'utf-8');
  } else {
    // Use default template
    const defaultTemplatePath = path.join(__dirname, '..', 'templates', 'report-markdown.hbs');
    template = await fs.readFile(defaultTemplatePath, 'utf-8');
  }
  
  const compiledTemplate = Handlebars.compile(template);
  return compiledTemplate(data);
}

async function generateHTMLReport(data: ReportData, templatePath?: string): Promise<string> {
  // For now, convert markdown to basic HTML
  const markdown = await generateMarkdownReport(data, templatePath);
  
  // Basic markdown to HTML conversion
  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Function Index Report</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        h1, h2, h3 { color: #333; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f4f4f4; }
        code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
        .low { color: #28a745; }
        .medium { color: #ffc107; }
        .high { color: #dc3545; }
    </style>
</head>
<body>
    <pre>${markdown}</pre>
</body>
</html>`;
  
  return html;
}

// Helper functions for executeReport
async function validateReportOptions(options: ReportOptions): Promise<void> {
  validateInput(options.format, 'format', (val) => ['markdown', 'html', 'json'].includes(val));
  
  if (options.template) {
    await validatePath(options.template, 'file');
  }
}

async function loadProjectConfig(): Promise<{ config: any; projectInfo: any }> {
  const projectInfo = detectProjectWithError();
  ensureProjectInitialized(projectInfo);
  const config = loadConfigWithError(projectInfo);
  await ensureIndexExists(config.output);
  
  return { config, projectInfo };
}

function detectProjectWithError(): any {
  try {
    return ProjectDetector.detectProject();
  } catch (error) {
    throw new ConfigurationError('Failed to detect project structure. Ensure you are in a valid TypeScript project directory.');
  }
}

function ensureProjectInitialized(projectInfo: any): void {
  if (!ConfigService.isInitialized(projectInfo.root)) {
    throw new ConfigurationError(
      'Project not initialized. Run `function-indexer` first to initialize the project.',
      path.join(projectInfo.root, '.function-indexer')
    );
  }
}

function loadConfigWithError(projectInfo: any): any {
  try {
    return ConfigService.loadConfig(projectInfo.root);
  } catch (error) {
    throw new ConfigurationError(
      'Failed to load project configuration',
      path.join(projectInfo.root, '.function-indexer', 'config.json')
    );
  }
}

async function ensureIndexExists(outputPath: string): Promise<void> {
  const stats = await fs.stat(outputPath).catch(() => false);
  if (!stats) {
    throw new IndexError(
      'Index file not found. Run `function-indexer` to create the index.',
      outputPath
    );
  }
}

async function loadFunctionIndex(outputPath: string): Promise<FunctionInfo[]> {
  let indexContent;
  try {
    indexContent = await fs.readFile(outputPath, 'utf-8');
  } catch (error) {
    throw createFileError('read', outputPath, error instanceof Error ? error : undefined);
  }

  const functions: FunctionInfo[] = [];
  const lines = indexContent.split('\n').filter(line => line.trim());
  
  for (let i = 0; i < lines.length; i++) {
    try {
      functions.push(JSON.parse(lines[i]));
    } catch (error) {
      console.warn(chalk.yellow(`⚠️ Skipping malformed JSON at line ${i + 1}`));
    }
  }

  if (functions.length === 0) {
    throw new IndexError('No valid functions found in index file', outputPath);
  }

  return functions;
}

function parseThresholds(thresholdsJson?: string): typeof DEFAULT_THRESHOLDS {
  try {
    return thresholdsJson 
      ? validateJSON(thresholdsJson, 'thresholds')
      : DEFAULT_THRESHOLDS;
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new ValidationError('Invalid thresholds JSON format', 'thresholds');
  }
}

async function generateReportOutput(reportData: ReportData, options: ReportOptions): Promise<string> {
  try {
    switch (options.format) {
      case 'json':
        return JSON.stringify(reportData, null, 2);
      case 'html':
        return await generateHTMLReport(reportData, options.template);
      default:
        return await generateMarkdownReport(reportData, options.template);
    }
  } catch (error) {
    throw new ValidationError(
      `Failed to generate ${options.format} report: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'format'
    );
  }
}

async function outputReport(output: string, options: ReportOptions): Promise<void> {
  if (options.output) {
    try {
      await fs.writeFile(options.output, output);
      console.log(chalk.green(`✅ Report saved to ${options.output}`));
    } catch (error) {
      throw createFileError('write', options.output, error instanceof Error ? error : undefined);
    }
  } else {
    console.log(output);
  }
}