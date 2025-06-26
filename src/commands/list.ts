import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import { ConfigService } from '../services/config-service';
import { ProjectDetector } from '../utils/project-detector';
import { FunctionInfo } from '../types';

/**
 * Load and parse functions from index file
 */
function loadFunctionsFromIndex(indexPath: string): FunctionInfo[] {
  const indexContent = fs.readFileSync(indexPath, 'utf-8');
  const functions: FunctionInfo[] = [];
  
  for (const line of indexContent.trim().split('\n').filter(line => line)) {
    try {
      functions.push(JSON.parse(line));
    } catch (error) {
      // Skip malformed lines
    }
  }
  
  return functions;
}

/**
 * Apply filters to function list
 */
function applyFilters(functions: FunctionInfo[], options: any): FunctionInfo[] {
  let filtered = functions;
  
  if (options.exported) {
    filtered = filtered.filter(f => f.exported);
  }
  
  if (options.async) {
    filtered = filtered.filter(f => f.async);
  }
  
  if (options.file) {
    const pattern = new RegExp(options.file, 'i');
    filtered = filtered.filter(f => pattern.test(f.file));
  }
  
  return filtered;
}

/**
 * Sort functions by specified field
 */
function sortFunctions(functions: FunctionInfo[], sortField: string): FunctionInfo[] {
  const field = sortField.toLowerCase();
  return functions.sort((a, b) => {
    switch (field) {
      case 'name':
        return a.identifier.localeCompare(b.identifier);
      case 'complexity':
        return (b.metrics?.cyclomaticComplexity || 0) - (a.metrics?.cyclomaticComplexity || 0);
      case 'loc':
        return (b.metrics?.linesOfCode || 0) - (a.metrics?.linesOfCode || 0);
      default:
        return a.file.localeCompare(b.file) || a.startLine - b.startLine;
    }
  });
}

/**
 * Display functions in grouped format
 */
function displayFunctions(functions: FunctionInfo[]): void {
  console.log(chalk.blue(`📋 Found ${functions.length} functions:\n`));
  
  let currentFile = '';
  functions.forEach((func) => {
    // Group by file
    if (func.file !== currentFile) {
      currentFile = func.file;
      console.log(chalk.cyan(`\n${currentFile}:`));
    }
    
    // Function info
    const badges = [];
    if (func.exported) badges.push(chalk.green('exported'));
    if (func.async) badges.push(chalk.blue('async'));
    if (func.metrics?.cyclomaticComplexity && func.metrics.cyclomaticComplexity > 10) {
      badges.push(chalk.yellow(`complexity:${func.metrics.cyclomaticComplexity}`));
    }
    
    const badgeStr = badges.length > 0 ? ` [${badges.join(', ')}]` : '';
    console.log(chalk.gray(`  L${func.startLine}: `) + chalk.white(func.identifier) + badgeStr);
  });
  
  // Summary
  console.log(chalk.gray(`\n📊 Summary:`));
  const exportedCount = functions.filter(f => f.exported).length;
  const asyncCount = functions.filter(f => f.async).length;
  console.log(chalk.gray(`   Total: ${functions.length} | Exported: ${exportedCount} | Async: ${asyncCount}`));
}

/**
 * Initialize and validate project configuration
 */
function initializeProject(): { config: any } {
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
    console.log(chalk.yellow('💡 Run `fx` first to initialize the project'));
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
 * Create the list command for enumerating functions
 */
export function createListCommand(): Command {
  return new Command('list')
    .description('List all indexed functions')
    .alias('ls')
    .option('-e, --exported', 'show only exported functions')
    .option('-a, --async', 'show only async functions')
    .option('-f, --file <pattern>', 'filter by file pattern')
    .option('-s, --sort <field>', 'sort by field (name, file, complexity, loc)', 'file')
    .option('--json', 'output as JSON array')
    .action(async (options) => {
      try {
        const { config } = initializeProject();
        
        let functions = loadFunctionsFromIndex(config.output);
        functions = applyFilters(functions, options);
        functions = sortFunctions(functions, options.sort);

        // Output results
        if (options.json) {
          console.log(JSON.stringify(functions, null, 2));
        } else if (functions.length === 0) {
          console.log(chalk.yellow('No functions found matching criteria'));
        } else {
          displayFunctions(functions);
        }

      } catch (error) {
        console.error(chalk.red('❌ List error:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}