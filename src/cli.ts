#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { FunctionIndexer } from './indexer';
import type { IndexerOptions } from './types';
import { SearchService } from './search';
import { AIService } from './ai-service';
import { UpdateService } from './services/update-service';
import { FileSystemStorage } from './storage/filesystem-storage';
import { MetricsService } from './services/metrics-service';
import { ConfigService } from './services/unified-config-service';
import { ProjectDetector } from './utils/project-detector';
import { createDiffCommand } from './commands/diff';
import { createReportCommand } from './commands/report';
import { createCICommand } from './commands/ci';
import { createMetricsCommand } from './commands/metrics';
import { createListCommand } from './commands/list';
import { applyCommandAliases, getAliasHelpText } from './commands/aliases';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const program = new Command();

// Support both 'function-indexer' and 'fx' as program names
const programName = path.basename(process.argv[1]) === 'fx' ? 'fx' : 'function-indexer';

program
  .name(programName)
  .description('A modern TypeScript function analyzer that helps you understand and maintain your codebase')
  .version('1.0.0');

program
  .option('-r, --root <path>', 'root directory to scan')
  .option('-o, --output <file>', 'output file for function index')
  .option('-v, --verbose', 'verbose output', false)
  .option('--cyclomatic-complexity <number>', 'cyclomatic complexity threshold', '10')
  .option('--cognitive-complexity <number>', 'cognitive complexity threshold', '15')
  .option('--lines-of-code <number>', 'lines of code threshold', '50')
  .option('--nesting-depth <number>', 'nesting depth threshold', '4')
  .option('--parameter-count <number>', 'parameter count threshold', '4')
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
        
        // Extract threshold options from CLI
        const thresholdOptions = {
          cyclomaticComplexity: parseInt(options.cyclomaticComplexity) || 10,
          cognitiveComplexity: parseInt(options.cognitiveComplexity) || 15,
          linesOfCode: parseInt(options.linesOfCode) || 50,
          nestingDepth: parseInt(options.nestingDepth) || 4,
          parameterCount: parseInt(options.parameterCount) || 4
        };

        // Initialize configuration with threshold options
        const config = ConfigService.initialize(projectInfo.root, { thresholds: thresholdOptions });
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
        
        // Show enhanced next steps with specific examples
        console.log('');
        console.log(chalk.blue('💡 Next steps - Get immediate value:'));
        console.log(chalk.yellow('   🔍 Explore your codebase:'));
        console.log(chalk.gray('      fx search "authentication"  # Find auth-related functions'));
        console.log(chalk.gray('      fx search "database"        # Find database functions'));
        console.log(chalk.gray('      fx list                     # See all functions'));
        console.log('');
        console.log(chalk.yellow('   📊 Check code quality:'));
        console.log(chalk.gray('      fx metrics                  # Quality overview'));
        console.log(chalk.gray('      fx metrics trends           # Find complex functions'));
        console.log('');
        console.log(chalk.yellow('   📚 Learn more:'));
        console.log(chalk.gray('      📖 Getting Started: docs/GETTING-STARTED.md'));
        console.log(chalk.gray('      🔧 All Commands: docs/COMMAND-REFERENCE.md'));
        console.log('');
        console.log(chalk.green('💡 Tip: Use `fx` instead of `function-indexer` for shorter commands!'));
        
      } else {
        // Already initialized - Check for migration first
        if (ConfigService.needsMigration(projectInfo.root)) {
          ConfigService.migrateIndexFile(projectInfo.root);
          
          // Update config to use new default path if it's still pointing to the old path
          const config = ConfigService.loadConfig(projectInfo.root);
          const legacyPath = ConfigService.getLegacyIndexPath(projectInfo.root);
          if (config.output === legacyPath || config.output.endsWith('.function-indexer/index.jsonl')) {
            const newIndexPath = ConfigService.getDefaultIndexPath(projectInfo.root);
            const updatedConfig = {
              ...config,
              output: newIndexPath
            };
            ConfigService.saveConfig(updatedConfig, projectInfo.root);
            console.log(chalk.gray('📝 Updated configuration to use new index location'));
          }
        }
        
        // Update existing index
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
          // Check if we have proper metadata for the update service
          const storage = new FileSystemStorage(path.dirname(finalConfig.output));
          const indexName = path.basename(finalConfig.output);
          
          try {
            // Try to get metadata first
            await storage.loadMetadata(indexName);
            
            // If metadata exists, do normal update
            const updateService = new UpdateService(storage, options.verbose);
            const result = await updateService.updateIndex(indexName, {
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
          
          } catch (error) {
            // Metadata doesn't exist or is corrupted (likely after migration)
            // Recreate the entire index
            console.log(chalk.yellow('⚠️  Index metadata missing or corrupted, recreating index...'));
            
            const indexer = new FunctionIndexer(finalConfig);
            const result = await indexer.run();
            
            console.log(chalk.green('✅ Index recreated!'));
            console.log(chalk.cyan(`📁 Files processed: ${result.totalFiles}`));
            console.log(chalk.cyan(`🔧 Functions found: ${result.totalFunctions}`));
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
  .option('-l, --limit <number>', 'limit number of results', '100')
  .option('--all', 'show all results (no limit)')
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

      const determineLimitValue = (options: { all?: boolean; limit?: string }): number | undefined => {
        if (options.all) return undefined;
        
        const parsed = parseInt(options.limit || '100');
        if (isNaN(parsed) || parsed < 1) {
          console.warn(chalk.yellow(`⚠️  Invalid limit "${options.limit}", using default: 100`));
          return 100;
        }
        return Math.max(1, parsed);
      };

      const results = searchService.search({
        query,
        context: options.context,
        saveHistory: options.saveHistory !== false,
        limit: determineLimitValue(options)
      });

      if (results.length === 0) {
        console.log(chalk.yellow('No functions found matching your query'));
        console.log(chalk.gray('\nTry:'));
        console.log(chalk.gray('  • Using different keywords'));
        console.log(chalk.gray('  • Being more specific'));
        console.log(chalk.gray('  • Adding context with --context'));
      } else {
        // Get the total results count for display
        const totalResults = searchService.getLastSearchTotalCount();
        const isLimited = !options.all && totalResults > results.length;
        
        if (isLimited) {
          console.log(chalk.green(`\nFound ${totalResults} matching functions (showing first ${results.length}):\n`));
          console.log(chalk.gray(`💡 Use --all to see all results or --limit <n> to adjust\n`));
        } else {
          console.log(chalk.green(`\nFound ${results.length} matching function${results.length > 1 ? 's' : ''}:\n`));
        }
        
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

// Add structured commands
program.addCommand(createDiffCommand());
program.addCommand(createReportCommand());
program.addCommand(createCICommand());
program.addCommand(createMetricsCommand());
program.addCommand(createListCommand());

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

// Legacy metrics command - redirect to new structure
program
  .command('metrics-legacy')
  .description('Legacy metrics command (use "metrics" instead)')
  .option('-d, --details', 'show detailed function-level metrics')
  .action(async () => {
    console.log(chalk.yellow('⚠️  The old metrics command structure is deprecated'));
    console.log(chalk.blue('💡 Use the new structure:'));
    console.log(chalk.gray('   fx metrics           # Show overview'));
    console.log(chalk.gray('   fx metrics collect   # Collect metrics'));
    console.log(chalk.gray('   fx metrics show      # Show function metrics'));
    console.log(chalk.gray('   fx metrics trends    # Analyze trends'));
    console.log('');
    console.log(chalk.gray('Running new metrics command...'));
    
    // Import and run the new metrics command
    try {
      const { createMetricsCommand } = await import('./commands/metrics');
      const metricsCmd = createMetricsCommand();
      await metricsCmd.parseAsync(['node', 'fx', 'metrics'], { from: 'user' });
    } catch (error) {
      console.error(chalk.red('❌ Failed to execute metrics command:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Legacy collect-metrics command - redirect to new structure
program
  .command('collect-metrics')
  .description('Collect code metrics (use "metrics collect" instead)')
  .option('-r, --root <path>', 'root directory to scan', './src')
  .option('--metrics-output <file>', 'output JSONL file for metrics history')
  .option('--pr <number>', 'PR number for this metrics collection')
  .option('--commit <hash>', 'specific commit hash (defaults to current HEAD)')
  .option('--branch <name>', 'branch name (defaults to current branch)')
  .option('--verbose-metrics', 'verbose output for metrics collection')
  .action(async (options) => {
    console.log(chalk.yellow('⚠️  collect-metrics is deprecated, use "fx metrics collect" instead'));
    console.log(chalk.gray('Running new command...\n'));
    
    // Map options to new format
    const args = ['node', 'fx', 'metrics', 'collect'];
    if (options.root) args.push('--root', options.root);
    if (options.metricsOutput) args.push('--output', options.metricsOutput);
    if (options.pr) args.push('--pr', options.pr);
    if (options.commit) args.push('--commit', options.commit);
    if (options.branch) args.push('--branch', options.branch);
    if (options.verboseMetrics) args.push('--verbose');
    
    try {
      const { createMetricsCommand } = await import('./commands/metrics');
      const metricsCmd = createMetricsCommand();
      await metricsCmd.parseAsync(args, { from: 'user' });
    } catch (error) {
      console.error(chalk.red('❌ Failed to execute metrics collect command:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Legacy show-metrics command - redirect to new structure
program
  .command('show-metrics [functionId]')
  .description('Show metrics history (use "metrics show" instead)')
  .option('-l, --limit <number>', 'limit number of history entries', '10')
  .option('--list', 'list all functions with metrics data')
  .action(async (functionId, options) => {
    console.log(chalk.yellow('⚠️  show-metrics is deprecated, use "fx metrics show" instead'));
    console.log(chalk.gray('Running new command...\n'));
    
    const args = ['node', 'fx', 'metrics', 'show'];
    if (functionId) args.push(functionId);
    if (options.limit) args.push('--limit', options.limit);
    if (options.list) args.push('--list');
    
    try {
      const { createMetricsCommand } = await import('./commands/metrics');
      const metricsCmd = createMetricsCommand();
      await metricsCmd.parseAsync(args, { from: 'user' });
    } catch (error) {
      console.error(chalk.red('❌ Failed to execute metrics show command:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Legacy analyze-trends command - redirect to new structure
program
  .command('analyze-trends')
  .description('Analyze metrics trends (use "metrics trends" instead)')
  .action(async () => {
    console.log(chalk.yellow('⚠️  analyze-trends is deprecated, use "fx metrics trends" instead'));
    console.log(chalk.gray('Running new command...\n'));
    
    try {
      const { createMetricsCommand } = await import('./commands/metrics');
      const metricsCmd = createMetricsCommand();
      await metricsCmd.parseAsync(['node', 'fx', 'metrics', 'trends'], { from: 'user' });
    } catch (error) {
      console.error(chalk.red('❌ Failed to execute metrics trends command:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Legacy pr-metrics command - redirect to new structure
program
  .command('pr-metrics <prNumber>')
  .description('Show PR metrics (use "metrics pr" instead)')
  .action(async (prNumber) => {
    console.log(chalk.yellow('⚠️  pr-metrics is deprecated, use "fx metrics pr" instead'));
    console.log(chalk.gray('Running new command...\n'));
    
    try {
      const { createMetricsCommand } = await import('./commands/metrics');
      const metricsCmd = createMetricsCommand();
      await metricsCmd.parseAsync(['node', 'fx', 'metrics', 'pr', prNumber], { from: 'user' });
    } catch (error) {
      console.error(chalk.red('❌ Failed to execute metrics pr command:'), error instanceof Error ? error.message : error);
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

// Apply command aliases before parsing
applyCommandAliases(program);

// Add help command that shows aliases
program
  .command('help-aliases')
  .description('Show command aliases')
  .action(() => {
    console.log(chalk.blue('\n' + getAliasHelpText()));
  });

// Override the help to mention aliases
program.on('--help', () => {
  console.log('');
  console.log(chalk.blue('Tip: Use `' + programName + ' help-aliases` to see command shortcuts'));
  if (programName === 'function-indexer') {
    console.log(chalk.blue('     You can also use `fx` as a shorter command'));
  }
});

program.parse();