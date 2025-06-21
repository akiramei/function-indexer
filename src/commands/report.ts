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
      (value: string) => {
        if (!['markdown', 'html', 'json'].includes(value)) {
          throw new Error(`Invalid format: ${value}. Valid options are: markdown, html, json`);
        }
        return value;
      },
      'markdown'
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
      
      // Validate template path if provided
      if (options.template && typeof options.template !== 'string') {
        throw new Error('Template path must be a string');
      }
      
      // Validate output path if provided
      if (options.output && typeof options.output !== 'string') {
        throw new Error('Output path must be a string');
      }
    })
    .action(async (options: ReportOptions) => {
      await executeReport(options);
    });
}

async function executeReport(options: ReportOptions) {
  await withErrorHandling(async () => {
    // Validate inputs
    validateInput(options.format, 'format', (val) => ['markdown', 'html', 'json'].includes(val));
    
    if (options.template) {
      await validatePath(options.template, 'file');
    }

    // Auto-detect project
    let projectInfo;
    try {
      projectInfo = ProjectDetector.detectProject();
    } catch (error) {
      throw new ConfigurationError('Failed to detect project structure. Ensure you are in a valid TypeScript project directory.');
    }
    
    if (!ConfigService.isInitialized(projectInfo.root)) {
      throw new ConfigurationError(
        'Project not initialized. Run `function-indexer` first to initialize the project.',
        path.join(projectInfo.root, '.function-indexer')
      );
    }
    
    let config;
    try {
      config = ConfigService.loadConfig(projectInfo.root);
    } catch (error) {
      throw new ConfigurationError(
        'Failed to load project configuration',
        path.join(projectInfo.root, '.function-indexer', 'config.json')
      );
    }
    
    if (!await fs.stat(config.output).catch(() => false)) {
      throw new IndexError(
        'Index file not found. Run `function-indexer` to create the index.',
        config.output
      );
    }

    console.log(chalk.blue('📊 Generating report...'));

    // Load function index
    let indexContent;
    try {
      indexContent = await fs.readFile(config.output, 'utf-8');
    } catch (error) {
      throw createFileError('read', config.output, error instanceof Error ? error : undefined);
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
      throw new IndexError('No valid functions found in index file', config.output);
    }

    // Parse thresholds
    let thresholds;
    try {
      thresholds = options.thresholds 
        ? validateJSON(options.thresholds, 'thresholds')
        : DEFAULT_THRESHOLDS;
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new ValidationError('Invalid thresholds JSON format', 'thresholds');
    }

    // Generate report data
    const reportData = generateReportData(functions, thresholds);

    // Generate report output
    let output: string;
    try {
      switch (options.format) {
        case 'json':
          output = JSON.stringify(reportData, null, 2);
          break;
        case 'html':
          output = await generateHTMLReport(reportData, options.template);
          break;
        case 'markdown':
        default:
          output = await generateMarkdownReport(reportData, options.template);
          break;
      }
    } catch (error) {
      throw new ValidationError(
        `Failed to generate ${options.format} report: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'format'
      );
    }

    // Output report
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
  }, { command: 'report', action: 'Generate report' });
}

function generateReportData(functions: FunctionInfo[], thresholds: typeof DEFAULT_THRESHOLDS): ReportData {
  const totalFunctions = functions.length;
  let highComplexity = 0;
  let missingTypes = 0;
  let totalComplexity = 0;
  
  const distribution = {
    low: 0,
    medium: 0,
    high: 0
  };
  
  const violations: ReportData['violations'] = [];
  const fileMetricsMap = new Map<string, { count: number; totalComplexity: number; maxComplexity: number }>();

  functions.forEach(func => {
    const metrics = func.metrics || {};
    const issues: string[] = [];
    
    // Calculate total complexity
    const complexity = metrics.cyclomaticComplexity || 0;
    totalComplexity += complexity;
    
    // Check for missing types
    if (!metrics.hasReturnType) {
      missingTypes++;
    }
    
    // Check violations
    if (metrics.cyclomaticComplexity && metrics.cyclomaticComplexity > thresholds.cyclomaticComplexity) {
      issues.push(`Cyclomatic complexity: ${metrics.cyclomaticComplexity} (>${thresholds.cyclomaticComplexity})`);
    }
    if (metrics.cognitiveComplexity && metrics.cognitiveComplexity > thresholds.cognitiveComplexity) {
      issues.push(`Cognitive complexity: ${metrics.cognitiveComplexity} (>${thresholds.cognitiveComplexity})`);
    }
    if (metrics.linesOfCode && metrics.linesOfCode > thresholds.linesOfCode) {
      issues.push(`Lines of code: ${metrics.linesOfCode} (>${thresholds.linesOfCode})`);
    }
    if (metrics.nestingDepth && metrics.nestingDepth > thresholds.nestingDepth) {
      issues.push(`Nesting depth: ${metrics.nestingDepth} (>${thresholds.nestingDepth})`);
    }
    if (metrics.parameterCount && metrics.parameterCount > thresholds.parameterCount) {
      issues.push(`Parameter count: ${metrics.parameterCount} (>${thresholds.parameterCount})`);
    }
    
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
    
    // Update file metrics
    const fileData = fileMetricsMap.get(func.file) || { count: 0, totalComplexity: 0, maxComplexity: 0 };
    fileData.count++;
    fileData.totalComplexity += complexity;
    fileData.maxComplexity = Math.max(fileData.maxComplexity, complexity);
    fileMetricsMap.set(func.file, fileData);
  });

  // Sort violations by issue count
  violations.sort((a, b) => b.issues.length - a.issues.length);

  // Generate file metrics
  const fileMetrics = Array.from(fileMetricsMap.entries())
    .map(([file, data]) => ({
      file,
      functionCount: data.count,
      avgComplexity: Math.round(data.totalComplexity / data.count * 10) / 10,
      maxComplexity: data.maxComplexity
    }))
    .sort((a, b) => b.maxComplexity - a.maxComplexity)
    .slice(0, 10); // Top 10 files

  // Generate recommendations
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

  return {
    generatedAt: new Date().toLocaleString(),
    summary: {
      totalFunctions,
      highComplexity,
      missingTypes,
      avgComplexity: Math.round((totalComplexity / totalFunctions) * 10) / 10
    },
    distribution: {
      low: distribution.low,
      lowPercent: Math.round((distribution.low / totalFunctions) * 100),
      medium: distribution.medium,
      mediumPercent: Math.round((distribution.medium / totalFunctions) * 100),
      high: distribution.high,
      highPercent: Math.round((distribution.high / totalFunctions) * 100)
    },
    violations: violations.slice(0, 20), // Top 20 violations
    fileMetrics,
    recommendations
  };
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