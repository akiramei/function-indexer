#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { FunctionIndexer } from './indexer';
import { IndexerOptions } from './types';
import { SearchService } from './search';
import { AIService } from './ai-service';
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
        limit: parseInt(options.limit)
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
        .map(line => JSON.parse(line));

      console.log(chalk.gray(`Processing ${functions.length} functions...`));

      const aiService = new AIService(apiKey);
      const enhanced = await aiService.generateDescriptions(
        functions, 
        parseInt(options.batchSize)
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