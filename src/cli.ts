#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { FunctionIndexer } from './indexer';
import { IndexerOptions } from './types';
import { SearchService } from './search';
import { AIService } from './ai-service';
import { UpdateService } from './services/update-service';
import { FileSystemStorage } from './storage/filesystem-storage';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const program = new Command();

program
  .name('function-indexer')
  .description('TypeScript function indexer for AI development management')
  .version('1.0.0');

program
  .option('-r, --root <path>', 'root directory to scan', './src')
  .option('-o, --output <file>', 'output JSONL file', 'function-index.jsonl')
  .option('-d, --domain <name>', 'domain name for the functions', 'default')
  .option('--include <patterns>', 'include patterns (comma-separated)', '**/*.ts,**/*.tsx')
  .option('--exclude <patterns>', 'exclude patterns (comma-separated)', '**/*.test.ts,**/*.spec.ts,**/node_modules/**')
  .option('-v, --verbose', 'verbose output', false)
  .action(async (options) => {
    try {
      console.log(chalk.blue('🔍 Function Indexer Starting...'));
      console.log(chalk.gray(`Root: ${options.root}`));
      console.log(chalk.gray(`Output: ${options.output}`));
      console.log(chalk.gray(`Domain: ${options.domain}`));
      
      // 入力検証
      if (!fs.existsSync(options.root)) {
        console.error(chalk.red(`❌ Root directory does not exist: ${options.root}`));
        process.exit(1);
      }

      // 出力ディレクトリの作成
      const outputDir = path.dirname(options.output);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const indexerOptions: IndexerOptions = {
        root: path.resolve(options.root),
        output: path.resolve(options.output),
        domain: options.domain,
        include: options.include.split(',').map((p: string) => p.trim()),
        exclude: options.exclude.split(',').map((p: string) => p.trim()),
        verbose: options.verbose
      };

      const indexer = new FunctionIndexer(indexerOptions);
      const result = await indexer.run();

      // 結果表示
      console.log(chalk.green('✅ Indexing completed!'));
      console.log(chalk.cyan(`📁 Files processed: ${result.totalFiles}`));
      console.log(chalk.cyan(`🔧 Functions found: ${result.totalFunctions}`));
      console.log(chalk.cyan(`⏱️  Execution time: ${result.executionTime}ms`));

      if (result.errors.length > 0) {
        console.log(chalk.yellow(`⚠️  Warnings/Errors: ${result.errors.length}`));
        if (options.verbose) {
          result.errors.forEach(error => {
            const icon = error.severity === 'error' ? '❌' : '⚠️';
            console.log(chalk.gray(`  ${icon} ${error.file}: ${error.message}`));
          });
        }
      }

      console.log(chalk.green(`📄 Output written to: ${options.output}`));

    } catch (error) {
      console.error(chalk.red('❌ Fatal error:'), error);
      process.exit(1);
    }
  });

program
  .command('search <query>')
  .description('Search for functions using natural language')
  .option('-c, --context <context>', 'provide context for the search')
  .option('--save-history', 'save search to history', true)
  .option('-l, --limit <number>', 'limit number of results', '20')
  .option('-i, --index <file>', 'function index file', 'function-index.jsonl')
  .action(async (query, options) => {
    try {
      console.log(chalk.blue(`🔍 Searching for: "${query}"`));
      
      const indexPath = path.resolve(options.index);
      if (!fs.existsSync(indexPath)) {
        console.error(chalk.red(`❌ Index file not found: ${indexPath}`));
        console.log(chalk.yellow('💡 Run function-indexer first to create the index'));
        process.exit(1);
      }

      const searchService = new SearchService();
      searchService.loadFunctionIndex(indexPath);

      const results = searchService.search({
        query,
        context: options.context,
        saveHistory: options.saveHistory,
        limit: Math.max(1, parseInt(options.limit) || 20)
      });

      if (results.length === 0) {
        console.log(chalk.yellow('❌ No functions found matching your query'));
      } else {
        console.log(chalk.green(`✅ Found ${results.length} matching functions:\n`));
        
        results.forEach((func, index) => {
          console.log(chalk.cyan(`${index + 1}. ${func.identifier}`));
          console.log(chalk.gray(`   File: ${func.file}:${func.startLine}`));
          console.log(chalk.gray(`   Signature: ${func.signature.substring(0, 80)}...`));
          if (func.exported) console.log(chalk.green('   ✓ Exported'));
          if (func.async) console.log(chalk.blue('   ⚡ Async'));
          console.log();
        });
      }

      searchService.close();
    } catch (error) {
      console.error(chalk.red('❌ Search error:'), error);
      process.exit(1);
    }
  });

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