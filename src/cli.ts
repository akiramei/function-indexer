#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { FunctionIndexer } from './indexer';
import { IndexerOptions } from './types';
import * as fs from 'fs';
import * as path from 'path';

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