#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { FunctionIndexer } from './indexer';
import { IndexerOptions, FunctionInfo } from './types';
import { SearchService } from './search';
import { AIService } from './ai-service';
import { UpdateService } from './services/update-service';
import { FileSystemStorage } from './storage/filesystem-storage';
import { MetricsService } from './services/metrics-service';
import { ConfigService } from './services/config-service';
import { ProjectDetector } from './utils/project-detector';
import { createDiffCommand } from './commands/diff';
import { createReportCommand } from './commands/report';
import { createCICommand } from './commands/ci';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const program = new Command();

program
  .name('function-indexer')
  .description('A modern TypeScript function analyzer that helps you understand and maintain your codebase')
  .version('1.0.0');

program
  .option('-r, --root <path>', 'root directory to scan')
  .option('-o, --output <file>', 'output file for function index')
  .option('-v, --verbose', 'verbose output', false)
  .action(async (options) => {
    try {
      // Project detection with error handling
      const projectInfo = (() => {
        try {
          return ProjectDetector.detectProject();
        } catch (error) {
          console.error(chalk.red('❌ Failed to detect project structure'));
          if (options.verbose && error instanceof Error) {
            console.error(chalk.gray(error.stack));
          }
          throw new Error('Project detection failed. Please ensure you are in a valid project directory.');
        }
      })();
      
      // Check if initialized
      const isInitialized = ConfigService.isInitialized(projectInfo.root);
      
      if (!isInitialized) {
        // First time - Initialize
        console.log(chalk.blue('🚀 Welcome to Function Indexer!'));
        console.log(chalk.gray('Initializing project...'));
        
        // Auto-detect project
        console.log(chalk.cyan(`✨ Detected ${projectInfo.type} project at: ${projectInfo.root}`));
        
        // Show source detection results
        if (projectInfo.srcDirs.length > 0) {
          console.log(chalk.cyan(`📁 Found source directories: ${projectInfo.srcDirs.join(', ')}`));
          console.log(chalk.cyan(`🎯 Suggested scan root: ${path.relative(projectInfo.root, projectInfo.suggestedRoot) || '.'}`));
        } else {
          console.log(chalk.yellow(`⚠️  No source directories detected, using project root`));
        }
        
        // Initialize configuration
        const config = ConfigService.initialize(projectInfo.root);
        console.log(chalk.green(`✅ Created configuration in ${ConfigService.getConfigDir(projectInfo.root)}`));
        
        // Use command line options if provided
        let finalConfig = config;
        if (options.root || options.output) {
          const updatedConfig = { 
            ...config, 
            ...(options.root && { root: path.resolve(options.root) }),
            ...(options.output && { output: path.resolve(options.output) })
          };
          ConfigService.saveConfig(updatedConfig, projectInfo.root);
          finalConfig = updatedConfig;
        }
        
        console.log(chalk.gray(`📁 Scanning: ${finalConfig.root}`));
        console.log(chalk.gray(`📄 Output: ${finalConfig.output}`));
        
        // Run initial indexing
        const indexer = new FunctionIndexer(finalConfig);
        const result = await indexer.run();
        
        // Display results
        console.log('');
        console.log(chalk.green('✅ Indexing completed!'));
        console.log(chalk.cyan(`📁 Files processed: ${result.totalFiles}`));
        console.log(chalk.cyan(`🔧 Functions found: ${result.totalFunctions}`));
        console.log(chalk.cyan(`⏱️  Execution time: ${result.executionTime}ms`));
        
        if (result.errors.length > 0) {
          console.log(chalk.yellow(`⚠️  Warnings: ${result.errors.length}`));
          if (options.verbose) {
            result.errors.forEach(error => {
              const icon = error.severity === 'error' ? '❌' : '⚠️';
              console.log(chalk.gray(`  ${icon} ${error.file}: ${error.message}`));
            });
          }
        }
        
        // Show next steps
        console.log('');
        console.log(chalk.blue('💡 Next steps:'));
        console.log(chalk.gray('  • Run `function-indexer search <query>` to search functions'));
        console.log(chalk.gray('  • Run `function-indexer metrics` to view code quality'));
        console.log(chalk.gray('  • Run `function-indexer diff` to compare branches'));
        console.log(chalk.gray('  • Run `function-indexer` again to update the index'));
        
      } else {
        // Already initialized - Update
        console.log(chalk.blue('🔄 Updating function index...'));
        
        let finalConfig = ConfigService.loadConfig(projectInfo.root);
        
        // Use command line options if provided
        if (options.root || options.output) {
          finalConfig = { 
            ...finalConfig, 
            ...(options.root && { root: path.resolve(options.root) }),
            ...(options.output && { output: path.resolve(options.output) })
          };
        }
        
        // Check if index exists
        if (!ConfigService.indexExists(projectInfo.root)) {
          // Index was deleted, recreate it
          console.log(chalk.yellow('⚠️  Index file not found, creating new index...'));
          
          const indexer = new FunctionIndexer(finalConfig);
          const result = await indexer.run();
          
          console.log(chalk.green('✅ Index recreated!'));
          console.log(chalk.cyan(`📁 Files processed: ${result.totalFiles}`));
          console.log(chalk.cyan(`🔧 Functions found: ${result.totalFunctions}`));
          
        } else {
          // Update existing index
          const storage = new FileSystemStorage(path.dirname(finalConfig.output));
          const updateService = new UpdateService(storage, options.verbose);
          
          const result = await updateService.updateIndex(path.basename(finalConfig.output), {
            autoBackup: true,
            verbose: options.verbose
          });
          
          console.log(chalk.green('✅ Update completed!'));
          
          if (result.added > 0 || result.updated > 0 || result.deleted > 0) {
            console.log(chalk.cyan(`➕ Added: ${result.added} functions`));
            console.log(chalk.cyan(`🔄 Updated: ${result.updated} functions`));
            console.log(chalk.cyan(`➖ Deleted: ${result.deleted} functions`));
          } else {
            console.log(chalk.gray('No changes detected'));
          }
          
          console.log(chalk.cyan(`⏱️  Execution time: ${result.executionTime}ms`));
          
          if (result.errors.length > 0) {
            console.log(chalk.yellow(`⚠️  Warnings: ${result.errors.length}`));
            if (options.verbose) {
              result.errors.forEach(error => {
                console.log(chalk.gray(`  ⚠️  ${error}`));
              });
            }
          }
        }
        
        // Quick metrics summary
        try {
          const metricsService = new MetricsService();
          const violations = metricsService.analyzeTrends()
            .filter(f => f.riskLevel === 'high')
            .length;
          
          if (violations > 0) {
            console.log('');
            console.log(chalk.yellow(`⚠️  ${violations} functions exceed complexity thresholds`));
            console.log(chalk.gray('   Run `function-indexer metrics` for details'));
          }
          
          metricsService.close();
        } catch (error) {
          if (options.verbose) {
            console.warn(chalk.yellow('⚠️  Metrics analysis failed:'), error instanceof Error ? error.message : String(error));
          }
        }
      }

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : error);
      if (options.verbose && error instanceof Error) {
        console.error(chalk.gray(error.stack));
      }
      process.exit(1);
    }
  });

program
  .command('search <query>')
  .description('Search for functions using natural language')
  .option('-c, --context <context>', 'provide context for the search')
  .option('--no-save-history', 'do not save search to history')
  .option('-l, --limit <number>', 'limit number of results', '10')
  .action(async (query, options) => {
    try {
      // Auto-detect project and load config with error handling
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
        console.log(chalk.yellow('💡 Run `function-indexer` first to initialize the project'));
        process.exit(1);
      }
      
      const config = ConfigService.loadConfig(projectInfo.root);
      
      if (!fs.existsSync(config.output)) {
        console.error(chalk.red('❌ Index file not found'));
        console.log(chalk.yellow('💡 Run `function-indexer` to create the index'));
        process.exit(1);
      }

      console.log(chalk.blue(`🔍 Searching for: "${query}"`));
      if (options.context) {
        console.log(chalk.gray(`   Context: ${options.context}`));
      }

      const searchService = new SearchService();
      searchService.loadFunctionIndex(config.output);

      const results = searchService.search({
        query,
        context: options.context,
        saveHistory: options.saveHistory !== false,
        limit: (() => {
          const parsed = parseInt(options.limit);
          if (isNaN(parsed) || parsed < 1) {
            console.warn(chalk.yellow(`⚠️  Invalid limit "${options.limit}", using default: 10`));
            return 10;
          }
          return Math.max(1, parsed);
        })()
      });

      if (results.length === 0) {
        console.log(chalk.yellow('No functions found matching your query'));
        console.log(chalk.gray('\nTry:'));
        console.log(chalk.gray('  • Using different keywords'));
        console.log(chalk.gray('  • Being more specific'));
        console.log(chalk.gray('  • Adding context with --context'));
      } else {
        console.log(chalk.green(`\nFound ${results.length} matching function${results.length > 1 ? 's' : ''}:\n`));
        
        results.forEach((func, index) => {
          console.log(chalk.cyan(`${index + 1}. ${func.identifier}`) + 
                      (func.exported ? chalk.green(' ✓') : '') +
                      (func.async ? chalk.blue(' ⚡') : ''));
          console.log(chalk.gray(`   ${func.file}:${func.startLine}`));
          
          // Show truncated signature
          const maxSigLength = 70;
          const signature = func.signature.length > maxSigLength 
            ? func.signature.substring(0, maxSigLength) + '...'
            : func.signature;
          console.log(chalk.gray(`   ${signature}`));
          
          // Show metrics if high complexity
          if (func.metrics && 'cyclomaticComplexity' in func.metrics && func.metrics.cyclomaticComplexity && func.metrics.cyclomaticComplexity > 10) {
            console.log(chalk.yellow(`   ⚠️  High complexity: ${func.metrics.cyclomaticComplexity}`));
          }
          
          console.log();
        });
      }

      searchService.close();
    } catch (error) {
      console.error(chalk.red('❌ Search error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all functions in the codebase without limit')
  .option('-f, --format <format>', 'output format (default, simple, json)', 'default')
  .option('--file <pattern>', 'filter by file pattern (glob supported)')
  .option('--exported', 'show only exported functions')
  .option('--async', 'show only async functions')
  .option('-s, --sort <field>', 'sort by field (name, file, complexity)', 'file')
  .action(async (options) => {
    try {
      // Auto-detect project and load config
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
        console.log(chalk.yellow('💡 Run `function-indexer` first to initialize the project'));
        process.exit(1);
      }
      
      const config = ConfigService.loadConfig(projectInfo.root);
      
      if (!fs.existsSync(config.output)) {
        console.error(chalk.red('❌ Index file not found'));
        console.log(chalk.yellow('💡 Run `function-indexer` to create the index'));
        process.exit(1);
      }

      // Load all functions from index
      const content = fs.readFileSync(config.output, 'utf-8');
      let functions: FunctionInfo[] = content
        .trim()
        .split('\n')
        .filter(line => line)
        .map((line, index) => {
          try {
            return JSON.parse(line);
          } catch (error) {
            console.error(chalk.yellow(`⚠️  Invalid JSON at line ${index + 1}, skipping...`));
            return null;
          }
        })
        .filter(func => func !== null) as FunctionInfo[];

      // Apply filters
      if (options.file) {
        const pattern = options.file.toLowerCase();
        functions = functions.filter(func => {
          const filePath = func.file.toLowerCase();
          // Simple glob pattern matching
          if (pattern.includes('*')) {
            const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
            return regex.test(filePath);
          }
          return filePath.includes(pattern);
        });
      }

      if (options.exported) {
        functions = functions.filter(func => func.exported);
      }

      if (options.async) {
        functions = functions.filter(func => func.async);
      }

      // Sort functions
      switch (options.sort) {
        case 'name':
          functions.sort((a, b) => a.identifier.localeCompare(b.identifier));
          break;
        case 'complexity':
          functions.sort((a, b) => {
            const aComplexity = a.metrics?.cyclomaticComplexity || 0;
            const bComplexity = b.metrics?.cyclomaticComplexity || 0;
            return bComplexity - aComplexity;
          });
          break;
        case 'file':
        default:
          functions.sort((a, b) => {
            const fileCompare = a.file.localeCompare(b.file);
            if (fileCompare !== 0) return fileCompare;
            return a.startLine - b.startLine;
          });
          break;
      }

      // Output results
      if (functions.length === 0) {
        console.log(chalk.yellow('No functions found matching the criteria'));
      } else {
        switch (options.format) {
          case 'json':
            console.log(JSON.stringify(functions, null, 2));
            break;
          
          case 'simple':
            functions.forEach(func => {
              console.log(`${func.file}:${func.startLine}:${func.identifier}`);
            });
            break;
          
          case 'default':
          default: {
            console.log(chalk.green(`\nFound ${functions.length} function${functions.length > 1 ? 's' : ''}:\n`));
            
            let currentFile = '';
            functions.forEach((func, index) => {
              // Group by file
              if (func.file !== currentFile) {
                if (currentFile !== '') console.log(); // Add spacing between files
                console.log(chalk.blue(`📁 ${func.file}`));
                currentFile = func.file;
              }
              
              // Function info
              console.log(
                chalk.gray('  ') + 
                chalk.cyan(`${func.identifier}`) + 
                (func.exported ? chalk.green(' ✓') : '') +
                (func.async ? chalk.blue(' ⚡') : '') +
                chalk.gray(` (line ${func.startLine})`)
              );
              
              // Show metrics if requested
              if (func.metrics && func.metrics.cyclomaticComplexity && func.metrics.cyclomaticComplexity > 10) {
                console.log(chalk.yellow(`     ⚠️  Complexity: ${func.metrics.cyclomaticComplexity}`));
              }
            });
            console.log();
            break;
          }
        }
        
        // Summary statistics
        if (options.format === 'default') {
          const exportedCount = functions.filter(f => f.exported).length;
          const asyncCount = functions.filter(f => f.async).length;
          console.log(chalk.gray('─'.repeat(50)));
          console.log(chalk.gray(`Total: ${functions.length} functions`));
          console.log(chalk.gray(`Exported: ${exportedCount} | Async: ${asyncCount}`));
        }
      }

    } catch (error) {
      console.error(chalk.red('❌ List error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Add the diff command
program.addCommand(createDiffCommand());

// Add the report command
program.addCommand(createReportCommand());

// Add the CI command
program.addCommand(createCICommand());

program
  .command('generate-descriptions')
  .description('Generate AI descriptions for functions')
  .option('-i, --index <file>', 'function index file', 'function-index.jsonl')
  .option('-o, --output <file>', 'enhanced output file', 'function-index-enhanced.jsonl')
  .option('-b, --batch-size <number>', 'batch size for AI processing', '10')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🤖 Generating AI descriptions...'));
      
      const indexPath = path.resolve(options.index);
      if (!fs.existsSync(indexPath)) {
        console.error(chalk.red(`❌ Index file not found: ${indexPath}`));
        process.exit(1);
      }

      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.error(chalk.red('❌ OPENAI_API_KEY environment variable not set'));
        console.log(chalk.yellow('💡 Add OPENAI_API_KEY to your .env file'));
        process.exit(1);
      }

      const content = fs.readFileSync(indexPath, 'utf-8');
      const functions = content
        .trim()
        .split('\n')
        .filter(line => line)
        .map((line, index) => {
          try {
            return JSON.parse(line);
          } catch (error) {
            console.error(chalk.yellow(`⚠️  Warning: Invalid JSON at line ${index + 1}, skipping...`));
            return null;
          }
        })
        .filter(func => func !== null);

      console.log(chalk.gray(`Processing ${functions.length} functions...`));

      const aiService = new AIService(apiKey);
      const enhanced = await aiService.generateDescriptions(
        functions, 
        Math.max(1, parseInt(options.batchSize) || 10)
      );

      const outputPath = path.resolve(options.output);
      const outputContent = enhanced
        .map(func => JSON.stringify(func))
        .join('\n');
      
      fs.writeFileSync(outputPath, outputContent);

      console.log(chalk.green(`✅ Enhanced index written to: ${options.output}`));
      console.log(chalk.cyan(`📊 Processed ${enhanced.length} functions`));
    } catch (error) {
      console.error(chalk.red('❌ AI generation error:'), error);
      process.exit(1);
    }
  });

program
  .command('show-history')
  .description('Show search history')
  .option('-q, --query <query>', 'filter history by query')
  .action(async (options) => {
    try {
      const searchService = new SearchService();
      const history = searchService.getSearchHistory(options.query);

      if (history.length === 0) {
        console.log(chalk.yellow('No search history found'));
      } else {
        console.log(chalk.blue(`📜 Search History (${history.length} entries):\n`));
        
        history.forEach((entry, index) => {
          const date = new Date(entry.timestamp).toLocaleString();
          console.log(chalk.cyan(`${index + 1}. "${entry.query}"`));
          console.log(chalk.gray(`   Date: ${date}`));
          console.log(chalk.gray(`   Context: ${entry.context || 'None'}`));
          console.log(chalk.gray(`   Results: ${entry.resolvedFunctions.length} functions`));
          console.log(chalk.gray(`   Confidence: ${(entry.confidence * 100).toFixed(0)}%`));
          console.log();
        });
      }

      searchService.close();
    } catch (error) {
      console.error(chalk.red('❌ History error:'), error);
      process.exit(1);
    }
  });

program
  .command('update <index>')
  .description('Update an existing function index')
  .option('--auto-backup', 'automatically create backup before update', true)
  .option('--no-backup', 'skip creating backup')
  .option('-v, --verbose', 'verbose output', false)
  .action(async (index, options) => {
    try {
      console.log(chalk.blue(`🔄 Updating function index: ${index}`));
      
      const indexPath = path.resolve(index);
      if (!fs.existsSync(indexPath)) {
        console.error(chalk.red(`❌ Index file not found: ${indexPath}`));
        console.log(chalk.yellow('💡 Create the index first using: function-indexer --root <path> --output <file>'));
        process.exit(1);
      }

      const storage = new FileSystemStorage(path.dirname(indexPath));
      const updateService = new UpdateService(storage, options.verbose);
      
      const updateOptions = {
        autoBackup: options.autoBackup !== false,
        verbose: options.verbose
      };

      console.log(chalk.gray('Loading metadata and validating index...'));
      
      const result = await updateService.updateIndex(path.basename(indexPath), updateOptions);
      
      console.log(chalk.green('✅ Update completed!'));
      console.log(chalk.cyan(`➕ Added: ${result.added} functions`));
      console.log(chalk.cyan(`🔄 Updated: ${result.updated} functions`));
      console.log(chalk.cyan(`➖ Deleted: ${result.deleted} functions`));
      console.log(chalk.cyan(`⏱️  Execution time: ${result.executionTime}ms`));
      
      if (result.errors.length > 0) {
        console.log(chalk.yellow(`⚠️  Warnings: ${result.errors.length}`));
        if (options.verbose) {
          result.errors.forEach(error => {
            console.log(chalk.gray(`  ⚠️  ${error}`));
          });
        }
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Update failed:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('update-all')
  .description('Update all function indexes in the current directory')
  .option('--auto-backup', 'automatically create backup before update', true)
  .option('--no-backup', 'skip creating backup')
  .option('-v, --verbose', 'verbose output', false)
  .action(async (options) => {
    try {
      console.log(chalk.blue('🔄 Updating all function indexes...'));
      
      const storage = new FileSystemStorage('.');
      const indexes = await storage.getIndexList();
      
      if (indexes.length === 0) {
        console.log(chalk.yellow('No function indexes found in the current directory'));
        process.exit(0);
      }
      
      console.log(chalk.gray(`Found ${indexes.length} index(es) to update`));
      
      const updateService = new UpdateService(storage, options.verbose);
      const updateOptions = {
        autoBackup: options.autoBackup !== false,
        verbose: options.verbose
      };
      
      let successCount = 0;
      let failCount = 0;
      
      for (const index of indexes) {
        try {
          console.log(chalk.blue(`\n📄 Updating ${index}...`));
          const result = await updateService.updateIndex(index, updateOptions);
          
          console.log(chalk.green(`✅ ${index} updated successfully`));
          console.log(chalk.gray(`   Added: ${result.added}, Updated: ${result.updated}, Deleted: ${result.deleted}`));
          successCount++;
        } catch (error) {
          console.error(chalk.red(`❌ Failed to update ${index}: ${error instanceof Error ? error.message : String(error)}`));
          failCount++;
        }
      }
      
      console.log(chalk.blue(`\n📊 Summary:`));
      console.log(chalk.green(`✅ Successfully updated: ${successCount}`));
      if (failCount > 0) {
        console.log(chalk.red(`❌ Failed: ${failCount}`));
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Update all failed:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('validate <index>')
  .description('Validate the integrity of a function index')
  .action(async (index) => {
    try {
      console.log(chalk.blue(`🔍 Validating function index: ${index}`));
      
      const indexPath = path.resolve(index);
      const storage = new FileSystemStorage(path.dirname(indexPath));
      
      const result = await storage.validateIndex(path.basename(indexPath));
      
      if (result.valid) {
        console.log(chalk.green('✅ Index is valid!'));
      } else {
        console.log(chalk.red('❌ Index validation failed!'));
        console.log(chalk.yellow(`Error: ${result.error}`));
        
        if (result.recoverable) {
          console.log(chalk.yellow('💡 This index might be repairable. Run: function-indexer repair <index>'));
        }
      }
    } catch (error) {
      console.error(chalk.red('❌ Validation error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('repair <index>')
  .description('Attempt to repair a corrupted function index')
  .action(async (index) => {
    try {
      console.log(chalk.blue(`🔧 Attempting to repair function index: ${index}`));
      
      const indexPath = path.resolve(index);
      const storage = new FileSystemStorage(path.dirname(indexPath));
      
      const result = await storage.repairIndex(path.basename(indexPath));
      
      console.log(chalk.green(`✅ Repair completed!`));
      console.log(chalk.cyan(`📊 Recovered: ${result.recovered} functions`));
      console.log(chalk.cyan(`❌ Lost: ${result.lost} entries`));
      
      if (result.repairedFile) {
        console.log(chalk.green(`📄 Repaired index saved to: ${result.repairedFile}`));
      }
    } catch (error) {
      console.error(chalk.red('❌ Repair error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('backup <index>')
  .description('Create a backup of a function index')
  .action(async (index) => {
    try {
      console.log(chalk.blue(`💾 Creating backup of function index: ${index}`));
      
      const indexPath = path.resolve(index);
      const storage = new FileSystemStorage(path.dirname(indexPath));
      
      const backup = await storage.createBackup(path.basename(indexPath));
      
      console.log(chalk.green('✅ Backup created successfully!'));
      console.log(chalk.cyan(`📁 Backup ID: ${backup.id}`));
      console.log(chalk.cyan(`📊 Size: ${(backup.size / 1024).toFixed(2)} KB`));
      console.log(chalk.cyan(`📄 Indexes: ${backup.indexes.join(', ')}`));
    } catch (error) {
      console.error(chalk.red('❌ Backup error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('restore <backupId>')
  .description('Restore function indexes from a backup')
  .action(async (backupId) => {
    try {
      console.log(chalk.blue(`📥 Restoring from backup: ${backupId}`));
      
      const storage = new FileSystemStorage('.');
      await storage.restoreFromBackup(backupId);
      
      console.log(chalk.green('✅ Restore completed successfully!'));
    } catch (error) {
      console.error(chalk.red('❌ Restore error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('metrics')
  .description('Show code quality metrics and complexity overview')
  .option('-d, --details', 'show detailed function-level metrics')
  .action(async (options) => {
    try {
      // Auto-detect project and load config with error handling
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
        console.log(chalk.yellow('💡 Run `function-indexer` first to initialize the project'));
        process.exit(1);
      }
      
      const config = ConfigService.loadConfig(projectInfo.root);
      
      if (!fs.existsSync(config.output)) {
        console.error(chalk.red('❌ Index file not found'));
        console.log(chalk.yellow('💡 Run `function-indexer` to create the index'));
        process.exit(1);
      }

      console.log(chalk.blue('📊 Code Quality Metrics\n'));

      // Load and analyze functions from index
      const indexContent = fs.readFileSync(config.output, 'utf-8');
      const functions: any[] = [];
      
      for (const line of indexContent.trim().split('\n').filter(line => line)) {
        try {
          functions.push(JSON.parse(line));
        } catch (error) {
          console.warn(chalk.yellow(`⚠️  Skipping malformed JSON line: ${line.substring(0, 50)}...`));
          continue;
        }
      }

      // Calculate summary statistics
      const totalFunctions = functions.length;
      const complexityDistribution = {
        low: 0,
        medium: 0,
        high: 0
      };

      const defaultThresholds = {
        cyclomaticComplexity: 10,
        cognitiveComplexity: 15,
        linesOfCode: 50,
        nestingDepth: 4,
        parameterCount: 4
      };
      
      const thresholds = {
        ...defaultThresholds,
        ...(config.metrics?.thresholds || {})
      };

      const violations: Array<{ func: any; issues: string[] }> = [];

      functions.forEach(func => {
        const metrics = func.metrics || {};
        const issues: string[] = [];
        
        // Check violations using refactored approach
        const metricChecks = [
          { key: 'cyclomaticComplexity', label: 'Cyclomatic complexity' },
          { key: 'cognitiveComplexity', label: 'Cognitive complexity' },
          { key: 'linesOfCode', label: 'Lines of code' },
          { key: 'nestingDepth', label: 'Nesting depth' },
          { key: 'parameterCount', label: 'Parameter count' }
        ] as const;
        
        for (const { key, label } of metricChecks) {
          if (metrics[key] > thresholds[key]) {
            issues.push(`${label}: ${metrics[key]} (>${thresholds[key]})`);
          }
        }

        // Categorize by risk level
        if (issues.length >= 3) {
          complexityDistribution.high++;
        } else if (issues.length >= 1) {
          complexityDistribution.medium++;
        } else {
          complexityDistribution.low++;
        }

        if (issues.length > 0) {
          violations.push({ func, issues });
        }
      });

      // Display summary
      console.log(chalk.cyan('📈 Summary'));
      console.log(chalk.gray(`   Total Functions: ${totalFunctions}`));
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
        console.log(chalk.gray('   • Use function-indexer search to find similar patterns'));
      }

    } catch (error) {
      console.error(chalk.red('❌ Metrics error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('collect-metrics')
  .description('Collect code metrics for commit/PR tracking')
  .option('-r, --root <path>', 'root directory to scan', './src')
  .option('--metrics-output <file>', 'output JSONL file for metrics history')
  .option('--pr <number>', 'PR number for this metrics collection')
  .option('--commit <hash>', 'specific commit hash (defaults to current HEAD)')
  .option('--branch <name>', 'branch name (defaults to current branch)')
  .option('--verbose-metrics', 'verbose output for metrics collection')
  .action(async (options) => {
    try {
      console.log(chalk.blue('📊 Collecting function metrics...'));
      
      const rootPath = path.resolve(options.root);
      if (!fs.existsSync(rootPath)) {
        console.error(chalk.red(`❌ Root directory does not exist: ${rootPath}`));
        process.exit(1);
      }

      const metricsService = new MetricsService();
      
      await metricsService.collectMetrics(rootPath, {
        prNumber: options.pr ? parseInt(options.pr) : undefined,
        commitHash: options.commit,
        branchName: options.branch,
        verbose: options.verboseMetrics,
        outputFile: options.metricsOutput
      });

      console.log(chalk.green('✅ Metrics collection completed!'));
      
      if (options.metricsOutput) {
        console.log(chalk.cyan(`📄 Metrics history saved to: ${options.metricsOutput}`));
      } else {
        console.log(chalk.cyan('📄 Metrics stored in SQLite database'));
      }
      
      metricsService.close();
    } catch (error) {
      console.error(chalk.red('❌ Metrics collection error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('show-metrics [functionId]')
  .description('Show metrics history for a specific function (or list available functions)')
  .option('-l, --limit <number>', 'limit number of history entries', '10')
  .option('--list', 'list all functions with metrics data')
  .action(async (functionId, options) => {
    try {
      const metricsService = new MetricsService();
      
      if (!functionId || options.list) {
        // 利用可能な関数の一覧を表示
        console.log(chalk.blue('📊 Available functions with metrics data:\n'));
        
        const availableFunctions = metricsService.listAvailableFunctions();
        
        if (availableFunctions.length === 0) {
          console.log(chalk.yellow('No metrics data found'));
          console.log(chalk.gray('💡 Run `function-indexer collect-metrics` first to collect data'));
        } else {
          console.log(chalk.green(`Found ${availableFunctions.length} functions with metrics:\n`));
          
          availableFunctions.forEach((func, index) => {
            console.log(chalk.cyan(`${index + 1}. ${func.functionId}`));
            console.log(chalk.gray(`   Last updated: ${new Date(func.lastTimestamp).toLocaleString()}`));
            console.log(chalk.gray(`   Records: ${func.recordCount} | Latest complexity: ${func.latestComplexity}`));
            console.log();
          });
          
          console.log(chalk.blue('💡 Usage:'));
          console.log(chalk.gray('   function-indexer show-metrics "src/file.ts:functionName"'));
        }
      } else {
        // 特定の関数のメトリクス履歴を表示
        console.log(chalk.blue(`📈 Metrics history for: ${functionId}`));
        
        const history = metricsService.showFunctionMetrics(functionId, parseInt(options.limit));
        
        if (history.length === 0) {
          console.log(chalk.yellow('No metrics history found for this function'));
          console.log(chalk.gray('💡 Make sure the function ID is correct'));
          console.log(chalk.gray('💡 Run `function-indexer show-metrics --list` to see available functions'));
        } else {
          console.log(chalk.green(`Found ${history.length} metric entries:\n`));
          
          history.forEach((metric, index) => {
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
      
      metricsService.close();
    } catch (error) {
      console.error(chalk.red('❌ Show metrics error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('analyze-trends')
  .description('Analyze metrics trends and violations')
  .action(async () => {
    try {
      console.log(chalk.blue('📊 Analyzing metrics trends...'));
      
      const metricsService = new MetricsService();
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
  });

program
  .command('pr-metrics <prNumber>')
  .description('Show metrics for a specific PR')
  .action(async (prNumber) => {
    try {
      console.log(chalk.blue(`📊 Metrics for PR #${prNumber}`));
      
      const metricsService = new MetricsService();
      const prMetrics = metricsService.getPRMetrics(parseInt(prNumber));
      
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
  });

// エラーハンドリング
process.on('uncaughtException', (error) => {
  console.error(chalk.red('❌ Uncaught Exception:'), error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('❌ Unhandled Rejection at:'), promise, 'reason:', reason);
  process.exit(1);
});

program.parse();